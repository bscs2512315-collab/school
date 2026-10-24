#!/usr/bin/env python3
"""
extract_syllabus_pdf.py

Extracts text and structured tables from AKUEB syllabus PDFs using PyMuPDF (fitz).
Outputs structured text with clear section/grade demarcations for Gemini AI extraction.
"""

import sys
import os
import re
import json
import argparse
import fitz  # PyMuPDF

try:
    fitz.TOOLS.mupdf_display_errors(False)
except Exception:
    pass

def extract_pdf_content(pdf_path):
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    
    sections = []
    current_grade = None
    current_text_blocks = []
    
    # Identify pages where Student Learning Outcomes are located
    start_page = 0
    end_page = total_pages
    
    for pno in range(min(15, total_pages)):
        txt = doc[pno].get_text()
        if "Student Learning Outcomes" in txt or "Table of Contents" in txt:
            # Check TOC for start page
            m = re.search(r"Student Learning Outcomes[^\d]*(\d+)", txt, re.IGNORECASE)
            if m:
                try:
                    p = int(m.group(1))
                    start_page = max(0, p - 1)
                except Exception:
                    pass
            break
            
    # Also find where Scheme of Assessment begins (end of SLOs)
    for pno in range(start_page, total_pages):
        txt = doc[pno].get_text()
        if "Scheme of Assessment" in txt or "Examination Structure" in txt or "Annexure" in txt or "Acknowledgements" in txt:
            if pno > start_page + 3:
                end_page = min(total_pages, pno + 1)
                break

    extracted_pages = []
    for pno in range(start_page, end_page):
        page = doc[pno]
        page_text = page.get_text("text")
        
        # Check for Grade indicators
        if re.search(r"Part\s*I\s*\(\s*Grade\s*IX\s*\)|Grade\s*IX\b|SSC\s*-\s*I\b|Class\s*IX\b", page_text, re.IGNORECASE):
            current_grade = "IX"
        elif re.search(r"Part\s*II\s*\(\s*Grade\s*X\s*\)|Grade\s*X\b|SSC\s*-\s*II\b|Class\s*X\b", page_text, re.IGNORECASE):
            current_grade = "X"
        elif re.search(r"Part\s*I\s*\(\s*Grade\s*XI\s*\)|Grade\s*XI\b|HSSC\s*-\s*I\b|Class\s*XI\b", page_text, re.IGNORECASE):
            current_grade = "XI"
        elif re.search(r"Part\s*II\s*\(\s*Grade\s*XII\s*\)|Grade\s*XII\b|HSSC\s*-\s*II\b|Class\s*XII\b", page_text, re.IGNORECASE):
            current_grade = "XII"
            
        # Try table extraction first
        tabs = page.find_tables()
        page_content = ""
        if tabs.tables:
            for tab in tabs.tables:
                table_data = tab.extract()
                for row in table_data:
                    clean_row = [str(cell).strip() if cell is not None else "" for cell in row]
                    # Filter out empty or header repeating rows
                    if any(clean_row):
                        page_content += " | ".join(clean_row) + "\n"
        else:
            page_content = page_text

        extracted_pages.append({
            "page": pno + 1,
            "grade": current_grade,
            "content": page_content
        })

    return {
        "totalPages": total_pages,
        "startPage": start_page + 1,
        "endPage": end_page,
        "pages": extracted_pages
    }

def main():
    parser = argparse.ArgumentParser(description="Extract structured text from AKUEB syllabus PDF")
    parser.add_argument("pdf_path", help="Path to PDF file")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    if not os.path.exists(args.pdf_path):
        print(f"Error: File not found {args.pdf_path}", file=sys.stderr)
        sys.exit(1)

    result = extract_pdf_content(args.pdf_path)
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        for p in result["pages"]:
            print(f"--- PAGE {p['page']} (Grade: {p['grade'] or 'Auto'}) ---")
            print(p["content"])
            print("\n")

if __name__ == "__main__":
    main()
