import "dotenv/config";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { db } from "../lib/db";

const BATCH = [
  // 1. Biology Class X (2021-2025)
  {
    class: "X",
    subject: "Biology",
    year: 2021,
    file: "pastpapers/BiologyXP1/Biology-X-Paper-I-2021.pdf",
  },
  {
    class: "X",
    subject: "Biology",
    year: 2022,
    file: "pastpapers/BiologyXP1/Biology-X-Paper-I-2022.pdf",
  },
  {
    class: "X",
    subject: "Biology",
    year: 2023,
    file: "pastpapers/BiologyXP1/Biology-X-Paper-I-2023.pdf",
  },
  {
    class: "X",
    subject: "Biology",
    year: 2024,
    file: "pastpapers/BiologyXP1/Biology-X-Paper-I-2024.pdf",
  },
  {
    class: "X",
    subject: "Biology",
    year: 2025,
    file: "pastpapers/BiologyXP1/Biology-X-Paper-I-2025.pdf",
  },

  // 2. Mathematics Class X (2021-2025)
  {
    class: "X",
    subject: "Mathematics",
    year: 2021,
    file: "pastpapers/MathsXP1/Mathematics-X-Paper-I-2021.pdf",
  },
  {
    class: "X",
    subject: "Mathematics",
    year: 2022,
    file: "pastpapers/MathsXP1/Mathematics-X-Paper-I-2022.pdf",
  },
  {
    class: "X",
    subject: "Mathematics",
    year: 2023,
    file: "pastpapers/MathsXP1/Mathematics-X-Paper-I-2023.pdf",
  },
  {
    class: "X",
    subject: "Mathematics",
    year: 2024,
    file: "pastpapers/MathsXP1/Mathematics-X-Paper-I-2024.pdf",
  },
  {
    class: "X",
    subject: "Mathematics",
    year: 2025,
    file: "pastpapers/MathsXP1/Mathematics-X-Paper-I-2025.pdf",
  },

  // 3. Computer Science Class X (2022-2025)
  {
    class: "X",
    subject: "Computer Science",
    year: 2022,
    file: "pastpapers/ComputerXP1/Computer-Science-X-Paper-I-2022.pdf",
  },
  {
    class: "X",
    subject: "Computer Science",
    year: 2023,
    file: "pastpapers/ComputerXP1/Computer-Science-X-Paper-I-2023.pdf",
  },
  {
    class: "X",
    subject: "Computer Science",
    year: 2024,
    file: "pastpapers/ComputerXP1/Computer-Science-X-Paper-I-2024.pdf",
  },
  {
    class: "X",
    subject: "Computer Science",
    year: 2025,
    file: "pastpapers/ComputerXP1/Computer-Science-X-Paper-I-2025.pdf",
  },
];

async function run() {
  console.log("=========================================================================");
  console.log("🚀 Starting Batch Ingestion of Class X (Biology, Maths, Computer Science)");
  console.log("=========================================================================\n");

  const results: Array<{
    subject: string;
    year: number;
    status: string;
    questions?: number;
    error?: string;
  }> = [];

  for (let i = 0; i < BATCH.length; i++) {
    const item = BATCH[i];
    const fullPath = path.resolve(process.cwd(), item.file);

    console.log(`\n-------------------------------------------------------------------------`);
    console.log(`[${i + 1}/${BATCH.length}] Processing Class X ${item.subject} ${item.year} Paper 1`);
    console.log(`File: ${fullPath}`);
    console.log(`-------------------------------------------------------------------------`);

    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${fullPath}`);
      results.push({
        subject: item.subject,
        year: item.year,
        status: "FAILED",
        error: "File not found",
      });
      continue;
    }

    try {
      const cmd = `npx tsx scripts/auto-import-paper.ts --pdf "${fullPath}" --class X --subject "${item.subject}" --year ${item.year} --paper 1 --publish`;
      console.log(`Executing: ${cmd}\n`);
      execSync(cmd, { stdio: "inherit", cwd: process.cwd() });

      // Verify in DB
      const { rows } = await db.query(
        `SELECT id, total_questions, status FROM past_papers 
         WHERE class = 'X' AND subject = $1 AND year = $2 AND paper_number = 1`,
        [item.subject, item.year],
      );

      if (rows.length > 0) {
        console.log(
          `\n🎉 Verification Passed: Class X ${item.subject} ${item.year} saved with ${rows[0].total_questions} questions (ID: ${rows[0].id})`,
        );
        results.push({
          subject: item.subject,
          year: item.year,
          status: "SUCCESS",
          questions: rows[0].total_questions,
        });
      } else {
        results.push({ subject: item.subject, year: item.year, status: "SUCCESS_NO_VERIFY" });
      }
    } catch (err: any) {
      console.error(`❌ Failed to process ${item.subject} ${item.year}:`, err?.message || err);
      results.push({
        subject: item.subject,
        year: item.year,
        status: "FAILED",
        error: err?.message || String(err),
      });
    }

    // Cooldown between papers
    if (i < BATCH.length - 1) {
      console.log(`\n⏳ Cooling down for 4s before next paper...`);
      await new Promise((r) => setTimeout(r, 4000));
    }
  }

  console.log("\n=========================================================================");
  console.log("📊 BATCH INGESTION SUMMARY: CLASS X (BIOLOGY, MATHS, COMPUTER SCIENCE)");
  console.log("=========================================================================");
  console.table(results);
  process.exit(0);
}

run().catch((err) => {
  console.error("Batch error:", err);
  process.exit(1);
});
