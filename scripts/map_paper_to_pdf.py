import os
import glob
import json

def get_pdf_map():
    pdf_files = glob.glob("pastpapers/**/*.pdf", recursive=True) + glob.glob("pastpapers/*.pdf")
    pdf_map = {}
    for p in pdf_files:
        bn = os.path.basename(p)
        # Normalize
        pdf_map[p] = bn
    return pdf_files

def match_pdf(subject, class_val, year, paper_num):
    all_pdfs = get_pdf_map()
    sub_clean = subject.lower().replace(" ", "").replace("-", "")
    class_clean = class_val.upper()
    year_str = str(year)

    for path in all_pdfs:
        bn = os.path.basename(path)
        if "e-marking" in bn.lower() or "cv" in bn.lower() or bn.lower() == "c.pdf":
            continue
        # Match class exactly: either in dir name like /MathsXP1/ or in filename like -X-
        dir_name = os.path.dirname(path).split("/")[-1]
        
        # Check class
        class_match = False
        if class_clean == "X":
            if "xp1" in dir_name.lower() or "-x-" in bn.lower() or "class-x" in bn.lower():
                if "xi" not in dir_name.lower() and "-xi" not in bn.lower() and "ix" not in dir_name.lower() and "-ix" not in bn.lower():
                    class_match = True
        elif class_clean == "XII":
            if "xiip1" in dir_name.lower() or "-xii-" in bn.lower():
                class_match = True
        elif class_clean == "IX":
            if "ixp1" in dir_name.lower() or "-ix-" in bn.lower():
                class_match = True
        elif class_clean == "XI":
            if "xip1" in dir_name.lower() or "-xi-" in bn.lower():
                if "xii" not in dir_name.lower() and "-xii" not in bn.lower():
                    class_match = True

        if not class_match:
            continue

        # Check year
        if year_str not in bn:
            continue

        # Check paper number: if paper_num == 1, avoid Paper-II or Paper-2
        if paper_num == 1 and ("paper-ii" in bn.lower() or "paper-2." in bn.lower() or "-paper-2-" in bn.lower() or "xp2" in dir_name.lower()):
            continue
        elif paper_num == 2 and ("paper-i-" in bn.lower() or "paper-1" in bn.lower() or "p1" in dir_name.lower()):
            continue

        # Check subject
        subj_match = False
        if "physics" in sub_clean and ("physics" in bn.lower() or "physics" in dir_name.lower()):
            subj_match = True
        elif "chemistry" in sub_clean and ("chemistry" in bn.lower() or "chemistry" in dir_name.lower()):
            subj_match = True
        elif "biology" in sub_clean and ("biology" in bn.lower() or "biology" in dir_name.lower()):
            subj_match = True
        elif "math" in sub_clean and ("math" in bn.lower() or "math" in dir_name.lower()):
            subj_match = True
        elif "computer" in sub_clean and ("computer" in bn.lower() or "computer" in dir_name.lower()):
            subj_match = True

        if subj_match:
            return path
    return None

if __name__ == "__main__":
    with open("audit_clusters_detailed.json", "r") as f:
        clusters = json.load(f)

    for i, cl in enumerate(clusters):
        q0 = cl["questions"][0]
        pdf = match_pdf(q0["subject"], q0["class"], q0["year"], q0["paper_number"])
        q_nums = [str(q["question_number"]) for q in cl["questions"]]
        print(f"Cluster {i+1}: {q0['subject']} Class {q0['class']} {q0['year']} (Questions: {', '.join(q_nums)}) => PDF: {pdf}")
