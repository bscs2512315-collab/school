import "dotenv/config";
import { db } from "../lib/db";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

function cleanTableText(text: string, hasImage: boolean): string {
  if (!text) return text;
  let cleaned = text;

  if (hasImage) {
    // 1. Serialized range data like: "Height Range (cm): 150.5-160.5 (5), 160.5-170.5 (3)..."
    cleaned = cleaned.replace(/\s*[A-Za-z\s\(\)]+:\s*\d+[\.\d]*\s*[-–—]\s*\d+[\.\d]*\s*\(\d+\)[,\s\d\.\-–—\(\)]+/gi, " ");

    // 2. Remove [Table] markers
    cleaned = cleaned.replace(/\s*:\s*\[Table\]\./gi, ".");
    cleaned = cleaned.replace(/\s*:\s*\[Table\]/gi, "");
    cleaned = cleaned.replace(/\s*\[Table\]/gi, "");
  }

  cleaned = cleaned.replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ").trim();
  return cleaned;
}

async function queryWithRetry(sql: string, params: any[] = [], maxRetries = 5): Promise<any> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await db.query(sql, params);
    } catch (err: any) {
      attempt++;
      if (attempt >= maxRetries) throw err;
      console.warn(`[DB Retry ${attempt}/${maxRetries}] ${err.message}. Retrying in ${attempt * 1000}ms...`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
}

async function main() {
  console.log("🚀 Starting Comprehensive Diagram Reprocessing & Table Cleanup Pipeline...\n");

  const diagramsBaseDir = path.resolve("./public/diagrams");
  if (!fs.existsSync(diagramsBaseDir)) {
    console.error("Diagrams base directory does not exist!");
    process.exit(1);
  }

  const paperDirs = fs
    .readdirSync(diagramsBaseDir)
    .filter((f) => fs.statSync(path.join(diagramsBaseDir, f)).isDirectory());

  console.log(`Found ${paperDirs.length} paper diagram directories to reprocess.\n`);

  let totalDiagramsFound = 0;
  let totalQuestionsUpdated = 0;
  let totalTableTextsCleaned = 0;

  for (let i = 0; i < paperDirs.length; i++) {
    const paperId = paperDirs[i];
    const paperDir = path.join(diagramsBaseDir, paperId);

    // Find the PDF file in this directory
    const files = fs.readdirSync(paperDir);
    const pdfFile = files.find((f) => f.endsWith(".pdf"));

    if (!pdfFile) {
      continue;
    }

    const pdfPath = path.join(paperDir, pdfFile);

    // 1. Remove old png files to prevent stray orphaned diagrams
    const oldPngs = files.filter((f) => f.endsWith(".png"));
    for (const op of oldPngs) {
      fs.unlinkSync(path.join(paperDir, op));
    }

    // 2. Run updated pdf_past_paper_processor.py
    try {
      execSync(`python3 scripts/pdf_past_paper_processor.py "${pdfPath}" --out-dir "${paperDir}"`, {
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch (err: any) {
      console.warn(`⚠️ Error processing PDF for paper ${paperId}: ${err.message}`);
    }

    // 3. Collect newly generated diagrams
    const newFiles = fs.readdirSync(paperDir);
    const newPngs = newFiles.filter((f) => f.endsWith(".png"));
    totalDiagramsFound += newPngs.length;

    // Map question number to diagram path
    const diagramMap = new Map<number, string>();
    for (const png of newPngs) {
      const match = png.match(/diagram_p\d+_q(\d+)\.png/);
      if (match) {
        const qnum = parseInt(match[1], 10);
        diagramMap.set(qnum, `/diagrams/${paperId}/${png}`);
      }
    }

    // 4. Update questions in database for this paper
    try {
      const { rows: questions } = await queryWithRetry(
        `SELECT q.id, q.question_number, q.question_text, q.image_url, q.mcq_data
         FROM questions q
         WHERE q.past_paper_id = $1
         ORDER BY q.question_number`,
        [paperId]
      );

      for (const q of questions) {
        const expectedImageUrl = diagramMap.get(q.question_number) || null;
        const hasImage = expectedImageUrl !== null;
        const cleanedText = cleanTableText(q.question_text, hasImage);

        const textChanged = cleanedText !== q.question_text;
        const imageChanged = expectedImageUrl !== q.image_url;

        if (textChanged) {
          totalTableTextsCleaned++;
        }

        if (textChanged || imageChanged) {
          await queryWithRetry(
            `UPDATE questions 
             SET image_url = $1, question_text = $2, updated_at = NOW()
             WHERE id = $3`,
            [expectedImageUrl, cleanedText, q.id]
          );
          totalQuestionsUpdated++;
        }
      }
    } catch (err: any) {
      console.error(`❌ DB error updating paper ${paperId}: ${err.message}`);
    }

    if ((i + 1) % 25 === 0 || i === paperDirs.length - 1) {
      console.log(`[${i + 1}/${paperDirs.length}] Processed papers | Extracted ${totalDiagramsFound} clean diagrams | Updated ${totalQuestionsUpdated} questions (Cleaned ${totalTableTextsCleaned} table texts).`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`🎉 COMPREHENSIVE REPROCESSING & CLEANUP COMPLETE!`);
  console.log(`📊 Papers Reprocessed:       ${paperDirs.length}`);
  console.log(`🖼️ Clean Diagrams Extracted: ${totalDiagramsFound}`);
  console.log(` Questions Synchronized:   ${totalQuestionsUpdated}`);
  console.log(`🧹 Redundant Table Texts:    ${totalTableTextsCleaned}`);
  console.log(`======================================================\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
