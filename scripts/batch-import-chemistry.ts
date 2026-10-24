import "dotenv/config";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { db } from "../lib/db";

const PAPERS = [
  {
    year: 2021,
    file: "Chemistry-XII-Annual-Exam-Paper-2021.pdf",
  },
  {
    year: 2022,
    file: "Chemistry-XII-Annual-Exam-Paper-2022.pdf",
  },
  {
    year: 2023,
    file: "Chemistry-XII-Paper-I-2023.pdf",
  },
  {
    year: 2024,
    file: "Chemistry-XII-Paper-I-2024.pdf",
  },
  {
    year: 2025,
    file: "Chemistry-XII-Paper-I-2025.pdf",
  },
];

const BASE_DIR = path.resolve(process.cwd(), "pastpapers/ChemistryXIIP1");

async function run() {
  console.log("=================================================================");
  console.log("🚀 Starting Batch Ingestion of Chemistry XII Paper 1 (2021-2025)");
  console.log("=================================================================\n");

  const results: Array<{ year: number; status: string; questions?: number; error?: string }> = [];

  for (let i = 0; i < PAPERS.length; i++) {
    const p = PAPERS[i];
    const fullPath = path.join(BASE_DIR, p.file);

    console.log(`\n---------------------------------------------------------------`);
    console.log(`[${i + 1}/${PAPERS.length}] Processing Class XII Chemistry ${p.year} Paper 1`);
    console.log(`File: ${fullPath}`);
    console.log(`---------------------------------------------------------------`);

    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${fullPath}`);
      results.push({ year: p.year, status: "FAILED", error: "File not found" });
      continue;
    }

    try {
      const cmd = `npx tsx scripts/auto-import-paper.ts --pdf "${fullPath}" --class XII --subject Chemistry --year ${p.year} --paper 1 --publish`;
      console.log(`Executing: ${cmd}\n`);
      execSync(cmd, { stdio: "inherit", cwd: process.cwd() });

      // Verify in DB
      const { rows } = await db.query(
        `SELECT id, total_questions, status FROM past_papers 
         WHERE class = 'XII' AND subject = 'Chemistry' AND year = $1 AND paper_number = 1`,
        [p.year],
      );

      if (rows.length > 0) {
        console.log(`\n🎉 Verification Passed: Chemistry ${p.year} saved with ${rows[0].total_questions} questions (ID: ${rows[0].id})`);
        results.push({ year: p.year, status: "SUCCESS", questions: rows[0].total_questions });
      } else {
        results.push({ year: p.year, status: "SUCCESS_NO_VERIFY" });
      }
    } catch (err: any) {
      console.error(`❌ Failed to process ${p.year}:`, err?.message || err);
      results.push({ year: p.year, status: "FAILED", error: err?.message || String(err) });
    }

    // Small cooldown between papers to stay within API limits
    if (i < PAPERS.length - 1) {
      console.log(`\n⏳ Cooling down for 3s before next paper...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log("\n=================================================================");
  console.log("📊 BATCH INGESTION SUMMARY");
  console.log("=================================================================");
  console.table(results);
  process.exit(0);
}

run().catch((err) => {
  console.error("Batch error:", err);
  process.exit(1);
});
