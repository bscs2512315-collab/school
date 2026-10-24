import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Pool } from "pg";

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const SUBJECT_MAP: Record<string, string> = {
  Chem: "Chemistry",
  Bio: "Biology",
  Phy: "Physics",
};

async function run() {
  const dirPath = path.join(process.cwd(), "public", "PastPapers", "P1", "Chem_HSSC_P1_2021_2025");
  
  if (!fs.existsSync(dirPath)) {
    console.error(`Directory not found: ${dirPath}`);
    process.exit(1);
  }

  const files = fs.readdirSync(dirPath);
  console.log(`Found ${files.length} files in ${dirPath}`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const file of files) {
    // Regex to match Chem_P1_XI_Q2_2025.jpg or Chem_P1_XI_Q50a_2022.png
    // Pattern: [Subject]_[Paper]_[Class]_Q[Number][Part]_[Year].[ext]
    const match = file.match(/^(\w+)_P(\d+)_(\w+)_Q(\d+)([a-z]?)_(\d{4})\.(jpg|png)$/i);
    
    if (!match) {
      console.log(`Skipping file (no match): ${file}`);
      skippedCount++;
      continue;
    }

    const [_, subjectPrefix, paperNum, className, questionNumStr, questionPart, yearStr, ext] = match;
    const subject = SUBJECT_MAP[subjectPrefix] || subjectPrefix;
    const paperNumber = parseInt(paperNum);
    const year = parseInt(yearStr);
    const questionNumber = parseInt(questionNumStr);
    const part = questionPart || null;

    const relativePath = `/PastPapers/P1/Chem_HSSC_P1_2021_2025/${file}`;

    try {
      // Find the past paper ID
      const paperRes = await pool.query(
        `SELECT id FROM past_papers 
         WHERE subject = $1 AND class = $2 AND year = $3 AND paper_number = $4`,
        [subject, className, year, paperNumber]
      );

      if (paperRes.rows.length === 0) {
        console.warn(`[MISSING PAPER] No paper found for ${subject} ${className} ${year} P${paperNumber} (${file})`);
        skippedCount++;
        continue;
      }

      const paperId = paperRes.rows[0].id;

      // Update the question
      let updateRes;
      if (part) {
        updateRes = await pool.query(
          `UPDATE questions 
           SET image_url = $1 
           WHERE past_paper_id = $2 AND question_number = $3 AND question_part = $4`,
          [relativePath, paperId, questionNumber, part]
        );
      } else {
        updateRes = await pool.query(
          `UPDATE questions 
           SET image_url = $1 
           WHERE past_paper_id = $2 AND question_number = $3 AND (question_part IS NULL OR question_part = '')`,
          [relativePath, paperId, questionNumber]
        );
      }

      if (updateRes && updateRes.rowCount !== null && updateRes.rowCount > 0) {
        console.log(`[SUCCESS] Updated Q${questionNumber}${part || ""} for ${subject} ${year} P${paperNumber}`);
        updatedCount++;
      } else {
        console.warn(`[NOT FOUND] Question ${questionNumber}${part || ""} not found in database for paper ${paperId} (${year})`);
        errorCount++;
      }
    } catch (err: any) {
      console.error(`[ERROR] Failed to update ${file}:`, err.message);
      errorCount++;
    }
  }

  console.log("\n--- Bulk Upload Summary ---");
  console.log(`Total Files:   ${files.length}`);
  console.log(`Updated:       ${updatedCount}`);
  console.log(`Skipped:       ${skippedCount}`);
  console.log(`Errors:        ${errorCount}`);
  
  await pool.end();
}

run().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
