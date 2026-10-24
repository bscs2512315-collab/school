import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { db } from "../lib/db";
import { isUrduText } from "../lib/utils/math-notation";

// Helper to normalize strings for matching
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Map of all PDF files found on disk
function buildPdfIndex(baseDir: string): Map<string, string> {
  const index = new Map<string, string>();

  function scan(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
        const baseName = entry.name;
        index.set(baseName.toLowerCase(), fullPath);
        index.set(normalizeKey(baseName.replace(".pdf", "")), fullPath);
      }
    }
  }

  scan(baseDir);
  return index;
}

// Clean question text and options
function cleanMathAndUrduText(text?: string | null): string {
  if (!text) return "";
  let result = text;

  // 1. Fix unparenthesized superscript=/subscript= text leakage
  result = result.replace(/\bsuperscript=([a-zA-Z0-9+\-]+)/g, "<sup>$1</sup>");
  result = result.replace(/\bsubscript=([a-zA-Z0-9+\-]+)/g, "<sub>$1</sub>");

  // 2. Fix explicit (superscript=...) and (subscript=...)
  result = result.replace(/\(superscript=((?:[^()]+|\([^()]*\))+)\)/g, "<sup>$1</sup>");
  result = result.replace(/\(subscript=((?:[^()]+|\([^()]*\))+)\)/g, "<sub>$1</sub>");

  // 3. Normalize LaTeX \frac{a}{b} if written raw
  result = result.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "($1)/($2)");

  // 4. Clean up LaTeX math delimiters $$...$$ and $...$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, "$1");
  result = result.replace(/\$([^\$\n]+?)\$/g, "$1");

  // 5. If Urdu text starts with numbers, add RTL marker
  if (isUrduText(result)) {
    if (/^\s*\d+/.test(result) && !result.startsWith("\u200F")) {
      result = "\u200F" + result.trim();
    }
  }

  return result.trim();
}

// Clean MCQ data JSONB
function cleanMcqData(mcqData: any): any {
  if (!mcqData || typeof mcqData !== "object") return mcqData;
  const cleaned = { ...mcqData };

  if (cleaned.options) {
    if (Array.isArray(cleaned.options)) {
      cleaned.options = cleaned.options.map((opt: any) => {
        if (typeof opt === "string") return cleanMathAndUrduText(opt);
        if (typeof opt === "object" && opt !== null) {
          return {
            ...opt,
            text: cleanMathAndUrduText(opt.text || opt.option || ""),
          };
        }
        return opt;
      });
    } else if (typeof cleaned.options === "object") {
      const newOpts: Record<string, any> = {};
      for (const [key, val] of Object.entries(cleaned.options)) {
        newOpts[key] = typeof val === "string" ? cleanMathAndUrduText(val) : val;
      }
      cleaned.options = newOpts;
    }
  }

  if (cleaned.explanation && typeof cleaned.explanation === "string") {
    cleaned.explanation = cleanMathAndUrduText(cleaned.explanation);
  }

  return cleaned;
}

// Clean Paper II data JSONB
function cleanPaperIIData(paperIIData: any): any {
  if (!paperIIData || typeof paperIIData !== "object") return paperIIData;
  const cleaned = { ...paperIIData };

  if (cleaned.betterResponse && typeof cleaned.betterResponse === "string") {
    cleaned.betterResponse = cleanMathAndUrduText(cleaned.betterResponse);
  }
  if (cleaned.weakerResponse && typeof cleaned.weakerResponse === "string") {
    cleaned.weakerResponse = cleanMathAndUrduText(cleaned.weakerResponse);
  }
  if (cleaned.markingNotes && typeof cleaned.markingNotes === "string") {
    cleaned.markingNotes = cleanMathAndUrduText(cleaned.markingNotes);
  }

  return cleaned;
}

async function main() {
  console.log("🚀 Starting Comprehensive Past Paper Audit & Fix Engine...");

  const pastpapersDir = path.resolve(process.cwd(), "pastpapers");
  const publicDiagramsDir = path.resolve(process.cwd(), "public", "diagrams");
  if (!fs.existsSync(publicDiagramsDir)) {
    fs.mkdirSync(publicDiagramsDir, { recursive: true });
  }

  console.log("📦 Indexing local PDF exam archives...");
  const pdfIndex = buildPdfIndex(pastpapersDir);
  console.log(`Found ${pdfIndex.size} indexed PDF paths.`);

  // Query all past papers
  const papersRes = await db.query(
    "SELECT id, class, board, subject, year, paper_number, file_name, file_url, total_questions FROM past_papers ORDER BY class, subject, year, paper_number;"
  );
  const pastPapers = papersRes.rows;
  console.log(`📋 Loaded ${pastPapers.length} past papers from database.`);

  let totalQuestionsAudited = 0;
  let totalDiagramsAttached = 0;
  let totalDiagramsCleared = 0;
  let totalMathTextsFixed = 0;
  let totalPapersWithPdf = 0;

  for (let i = 0; i < pastPapers.length; i++) {
    const paper = pastPapers[i];
    const paperId = paper.id;
    const pClass = paper.class;
    const pSub = paper.subject;
    const pYear = paper.year;
    const pNum = paper.paper_number;
    const pFileName = paper.file_name || "";

    console.log(`\n[${i + 1}/${pastPapers.length}] Auditing: Class ${pClass} | ${pSub} | ${pYear} | Paper ${pNum}`);

    // Locate PDF on disk
    let pdfPath: string | undefined;

    // Try by exact file_name
    if (pFileName && pdfIndex.has(pFileName.toLowerCase())) {
      pdfPath = pdfIndex.get(pFileName.toLowerCase());
    }

    // Try by normalized keys
    if (!pdfPath) {
      const possibleKeys = [
        normalizeKey(`${pSub}${pClass}P${pNum}${pYear}`),
        normalizeKey(`${pSub}-${pClass}-Paper-${pNum === 1 ? 'I' : 'II'}-${pYear}`),
        normalizeKey(`${pSub}-${pClass}-Annual-Exam-Paper-${pYear}`),
        normalizeKey(`${pSub}${pClass}${pYear}`),
        normalizeKey(`${pSub}${pClass}P${pNum}`),
      ];
      for (const k of possibleKeys) {
        if (pdfIndex.has(k)) {
          pdfPath = pdfIndex.get(k);
          break;
        }
      }
    }

    // Process PDF diagrams if found
    const verifiedDiagrams = new Map<number, string>(); // qnum -> web path
    if (pdfPath && fs.existsSync(pdfPath)) {
      totalPapersWithPdf++;
      try {
        const outDir = path.join(publicDiagramsDir, paperId);
        fs.mkdirSync(outDir, { recursive: true });

        const cmd = `python3 scripts/pdf_past_paper_processor.py "${pdfPath}" --out-dir "${outDir}"`;
        const outputStr = execSync(cmd, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
        const res = JSON.parse(outputStr);

        if (res && Array.isArray(res.diagrams)) {
          for (const d of res.diagrams) {
            const relUrl = `/diagrams/${paperId}/${d.fileName}`;
            verifiedDiagrams.set(d.questionNumber, relUrl);
          }
        }
      } catch (err: any) {
        console.error(`⚠️ Diagram processor error for ${pSub} ${pClass} (${pYear}):`, err.message);
      }
    }

    // Fetch questions for this paper
    const qRes = await db.query(
      "SELECT id, question_number, question_part, question_text, question_type, image_url, mcq_data, paper_ii_data FROM questions WHERE past_paper_id = $1 ORDER BY question_number, question_part;",
      [paperId]
    );
    const questions = qRes.rows;
    totalQuestionsAudited += questions.length;

    for (const q of questions) {
      const qNum = q.question_number;
      let newImageUrl = q.image_url;
      let imageChanged = false;

      if (pdfPath) {
        if (verifiedDiagrams.has(qNum)) {
          const verifiedUrl = verifiedDiagrams.get(qNum);
          if (newImageUrl !== verifiedUrl) {
            newImageUrl = verifiedUrl;
            imageChanged = true;
            totalDiagramsAttached++;
          }
        } else {
          // If PDF exists and this question has NO diagram in the source PDF, clear any leaked image
          if (newImageUrl) {
            newImageUrl = null;
            imageChanged = true;
            totalDiagramsCleared++;
          }
        }
      }

      // Clean Math and Urdu formatting
      const originalText = q.question_text || "";
      const cleanedText = cleanMathAndUrduText(originalText);
      const textChanged = cleanedText !== originalText;

      const originalMcq = q.mcq_data;
      const cleanedMcq = cleanMcqData(originalMcq);
      const mcqChanged = JSON.stringify(originalMcq) !== JSON.stringify(cleanedMcq);

      const originalPaperII = q.paper_ii_data;
      const cleanedPaperII = cleanPaperIIData(originalPaperII);
      const paperIIChanged = JSON.stringify(originalPaperII) !== JSON.stringify(cleanedPaperII);

      if (textChanged || mcqChanged || paperIIChanged) {
        totalMathTextsFixed++;
      }

      if (imageChanged || textChanged || mcqChanged || paperIIChanged) {
        await db.query(
          "UPDATE questions SET image_url = $1, question_text = $2, mcq_data = $3, paper_ii_data = $4, updated_at = NOW() WHERE id = $5;",
          [newImageUrl, cleanedText, cleanedMcq, cleanedPaperII, q.id]
        );
      }
    }
  }

  console.log("\n=======================================================");
  console.log("✅ COMPREHENSIVE PAST PAPER AUDIT COMPLETE!");
  console.log(`📄 Total Past Papers Audited:        ${pastPapers.length}`);
  console.log(`📑 Papers with Source PDFs:          ${totalPapersWithPdf}`);
  console.log(`❓ Total Questions Audited:          ${totalQuestionsAudited}`);
  console.log(`🖼️ Verified Diagrams Attached:       ${totalDiagramsAttached}`);
  console.log(`🧹 Mismatched/Leaked Images Cleared: ${totalDiagramsCleared}`);
  console.log(`📐 Math & Urdu Text Fixes Applied:    ${totalMathTextsFixed}`);
  console.log("=======================================================\n");

  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
