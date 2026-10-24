/**
 * auto-import-practical.ts
 *
 * Automated CLI script to download, extract, or synthesize AKUEB & Board Practical Journals:
 * - Reads from local PDF / DOCX file or official curriculum specifications.
 * - Extracts structured write-ups: Title, Object, Apparatus, Theory, Method, Observation Tables, Calculations, Results, Errors.
 * - Saves output to JSON and can sync into the application dataset.
 *
 * Usage:
 *   npx tsx scripts/auto-import-practical.ts --subject "Physics" --class "IX"
 *   npx tsx scripts/auto-import-practical.ts --pdf "path/to/journal.pdf" --subject "Chemistry" --class "XI"
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import {
  extractPracticalsFromText,
  normalizePracticalSubject,
  normalizeClassLevel,
  type PracticalJournalEntry,
} from "@/lib/ai/practical-extract";

function parseArgs(argv: string[]) {
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const eqIdx = arg.indexOf("=");
      if (eqIdx !== -1) {
        const key = arg.slice(2, eqIdx);
        flags[key] = arg.slice(eqIdx + 1);
      } else {
        const key = arg.slice(2);
        if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
          flags[key] = argv[++i];
        } else {
          flags[key] = "true";
        }
      }
    }
  }
  return flags;
}

function extractPdfText(pdfPath: string): string {
  try {
    const pyScript = `
import fitz, sys
doc = fitz.open(sys.argv[1])
full_text = []
for page in doc:
    full_text.append(page.get_text("text"))
print("\\n---PAGE---\\n".join(full_text))
`;
    const tempPy = path.join(process.cwd(), "tmp", "_extract_practical.py");
    if (!fs.existsSync(path.dirname(tempPy))) {
      fs.mkdirSync(path.dirname(tempPy), { recursive: true });
    }
    fs.writeFileSync(tempPy, pyScript);
    const output = execSync(`python3 "${tempPy}" "${pdfPath}"`, {
      encoding: "utf-8",
      maxBuffer: 20 * 1024 * 1024,
    });
    if (fs.existsSync(tempPy)) fs.unlinkSync(tempPy);
    return output;
  } catch (err: any) {
    console.warn(`[PDF] PyMuPDF extraction failed (${err.message}). Using fallback.`);
    return "";
  }
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));

  const subjectRaw = flags.subject || flags.sub || "Physics";
  const classRaw = flags.class || flags.grade || "IX";
  const board = flags.board || "AKUEB";
  const pdfPath = flags.pdf || flags.file;
  const outDir = flags.out || path.join(process.cwd(), "scratch", "practicals");

  const subject = normalizePracticalSubject(subjectRaw);
  const classLevel = normalizeClassLevel(classRaw);

  console.log(`\n======================================================`);
  console.log(`🧪 Practical Journal Pipeline: ${subject.toUpperCase()} (Class ${classLevel} - ${board})`);
  console.log(`======================================================\n`);

  let extractedText = "";

  if (pdfPath && fs.existsSync(pdfPath)) {
    console.log(`[Source] Reading document: ${pdfPath}`);
    extractedText = extractPdfText(pdfPath);
    console.log(`[Source] Extracted ${extractedText.length} characters from file.`);
  }

  if (!extractedText || extractedText.length < 50) {
    console.log(`[Mode] Synthesizing complete practicals based on official AKUEB / Board syllabus standard for Class ${classLevel} ${subject}...`);
    extractedText = `Standard official board practical activities and experiments list for Subject: ${subject}, Class: ${classLevel}, Board: ${board}.`;
  }

  const result = await extractPracticalsFromText(extractedText, subject, classLevel, board);

  console.log(`\n✅ Extraction Complete: Found ${result.practicals.length} experiments.\n`);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFileName = `${subject}-${classLevel.toLowerCase()}.json`;
  const outPath = path.join(outDir, outFileName);
  fs.writeFileSync(outPath, JSON.stringify(result.practicals, null, 2), "utf-8");

  console.log(`💾 Saved structured output to: ${outPath}`);
  console.log(`Sample practical: "${result.practicals[0]?.title}"`);
}

main().catch(console.error);
