# Bulk Past Paper Upload Guide

This project includes a script to upload past papers in bulk via text files. This is much faster than using the admin portal manual entry.

## 1. Prepare your Text File
Create a `.txt` file (e.g., `my_paper.txt`) with the following format. Ensure there is a line with `---` between questions.

```text
METADATA:
Class: IX
Board: AKUEB
Subject: Chemistry
Year: 2024
Paper: 1

QUESTIONS:
Question 1:
A scientist uses 52 g of Na(subscript=2)SO(subscript=4) for a chemical reaction. How many moles of Na atoms does the compound contain?
A. 0.366 mol
B. 0.732 mol
C. 8.422 mol
D. 16.845 mol
Correct Answer: B
Chapter: Stoichiometry

---

Question 2:
[Next Question Text]
A. [Option A]
B. [Option B]
C. [Option C]
D. [Option D]
Correct Answer: [Letter]
Chapter: [Chapter Name]
```

### Tips:
- **Notations**: Use `(subscript=...)` and `(superscript=...)` for chemical formulas and math.
- **Chapter**: Use the exact chapter name (e.g., "Stoichiometry").
- **Paper Number**: Use `1` for MCQs and `2` for Theory/CRQs.

## 2. Run the Upload Command
Open your terminal in the project root and run:

```bash
npx tsx scripts/bulk_upload_papers.ts [path_to_your_file]
```

**Example:**
```bash
npx tsx scripts/bulk_upload_papers.ts chemistry_2024.txt
```

## 3. Post-Upload Actions
- **Images**: If a question needs an image, go to the Admin Portal, find the paper, click **Edit**, and upload the image there.
- **Verification**: The script automatically marks questions as **Verified**. You can check them in the Question Bank or Archive.

---
**Note**: If you run the script again with the same Metadata (Class, Board, Subject, Year, Paper), the script will **DELETE** the previous version and replace it with the new one. This is useful for fixing typos in bulk.
