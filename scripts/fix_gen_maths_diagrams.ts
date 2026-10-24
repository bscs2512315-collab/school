import "dotenv/config";
import fs from "fs";
import path from "path";
import { db } from "../lib/db";
import { processPastPaperPdf } from "../lib/ai/pdf-paper-processor";

const GEN_MATHS_PAPERS = [
  { year: 2021, file: "pastpapers/downloads/ClassIX_General/General-Mathematics-IX-Paper-I-2021.pdf" },
  { year: 2022, file: "pastpapers/downloads/ClassIX_General/General-Mathematics-IX-Paper-I-2022.pdf" },
  { year: 2023, file: "pastpapers/downloads/ClassIX_General/General-Mathematics-IX-Paper-I-2023.pdf" },
  { year: 2024, file: "pastpapers/downloads/ClassIX_General/General-Mathematics-IX-Paper-I-2024.pdf" },
  { year: 2025, file: "pastpapers/downloads/ClassIX_General/General-Mathematics-IX-Paper-I-2025.pdf" },
];

async function fixGenMathsDiagrams() {
  console.log("=========================================================================");
  console.log("🎯 Fixing General Mathematics Diagrams (Stripping Cover Page Images)");
  console.log("=========================================================================\n");

  for (const item of GEN_MATHS_PAPERS) {
    const fullPdfPath = path.resolve(process.cwd(), item.file);
    if (!fs.existsSync(fullPdfPath)) {
      console.warn(`File not found: ${fullPdfPath}`);
      continue;
    }

    const { rows: papers } = await db.query(
      `SELECT id FROM past_papers WHERE class = 'IX' AND subject = 'General Mathematics' AND year = $1`,
      [item.year]
    );

    if (papers.length === 0) continue;
    const paperId = papers[0].id;

    console.log(`\n--- Processing General Mathematics ${item.year} (Paper ID: ${paperId}) ---`);
    
    // First, clear all images for this paper
    await db.query(`UPDATE questions SET image_url = NULL WHERE past_paper_id = $1`, [paperId]);

    // Now extract real diagrams using updated pdf processor (which skips page 1 cover instructions)
    const pdfBuf = fs.readFileSync(fullPdfPath);
    const result = await processPastPaperPdf(pdfBuf, path.basename(item.file));

    console.log(`Extracted ${result.diagrams.length} valid diagrams:`);
    for (const diag of result.diagrams) {
      if (diag.questionNumber && diag.imageUrl) {
        // Double check that question text actually requires a diagram
        const { rows: qRows } = await db.query(
          `SELECT question_number, question_text FROM questions WHERE past_paper_id = $1 AND question_number = $2`,
          [paperId, diag.questionNumber]
        );

        if (qRows.length > 0) {
          const qText = qRows[0].question_text.toLowerCase();
          const isDiagramQuestion = 
            qText.includes("diagram") ||
            qText.includes("figure") ||
            qText.includes("graph") ||
            qText.includes("table") ||
            qText.includes("triangle") ||
            qText.includes("circuit") ||
            qText.includes("shown in") ||
            qText.includes("represented in the");

          if (isDiagramQuestion) {
            console.log(`  ✅ Assigned Q${diag.questionNumber} -> ${diag.imageUrl}`);
            await db.query(
              `UPDATE questions SET image_url = $1 WHERE past_paper_id = $2 AND question_number = $3`,
              [diag.imageUrl, paperId, diag.questionNumber]
            );
          } else {
            console.log(`  ⚠️ Skipped Q${diag.questionNumber} (text does not reference a diagram: "${qRows[0].question_text.slice(0, 50)}...")`);
          }
        }
      }
    }
  }

  // Also verify across Class XII and other subjects that no diagram_p1_ exists in DB
  const { rows: remainingP1 } = await db.query(`
    SELECT q.id, p.class, p.subject, p.year, q.question_number, q.image_url
    FROM questions q
    JOIN past_papers p ON p.id = q.past_paper_id
    WHERE q.image_url ILIKE '%diagram_p1_%' OR q.image_url ILIKE '%p1_q%'
  `);

  if (remainingP1.length > 0) {
    console.log(`\nFound ${remainingP1.length} remaining p1 images across DB. Clearing them...`);
    await db.query(`
      UPDATE questions 
      SET image_url = NULL 
      WHERE id = ANY($1::uuid[])
    `, [remainingP1.map(r => r.id)]);
  }

  console.log("\n🎉 ALL DIAGRAMS VERIFIED AND CLEANED!");
  process.exit(0);
}

fixGenMathsDiagrams().catch(console.error);
