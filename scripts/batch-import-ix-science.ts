import "dotenv/config";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { db } from "../lib/db";

interface BatchItem {
  class: string;
  subject: string;
  year: number;
  file: string;
}

const BATCH: BatchItem[] = [
  // 1. Physics Class IX (2021-2025)
  { class: "IX", subject: "Physics", year: 2021, file: "pastpapers/PhysicsIXP1/Physics-IX-Paper-I-2021.pdf" },
  { class: "IX", subject: "Physics", year: 2022, file: "pastpapers/PhysicsIXP1/Physics-IX-Paper-I-2022.pdf" },
  { class: "IX", subject: "Physics", year: 2023, file: "pastpapers/PhysicsIXP1/Physics-IX-Paper-I-2023.pdf" },
  { class: "IX", subject: "Physics", year: 2024, file: "pastpapers/PhysicsIXP1/Physics-IX-Paper-I-2024.pdf" },
  { class: "IX", subject: "Physics", year: 2025, file: "pastpapers/PhysicsIXP1/Physics-IX-Paper-I-2025.pdf" },

  // 2. Chemistry Class IX (2021-2025)
  { class: "IX", subject: "Chemistry", year: 2021, file: "pastpapers/ChemistryIXP1/Chemistry-IX-Paper-I-2021.pdf" },
  { class: "IX", subject: "Chemistry", year: 2022, file: "pastpapers/ChemistryIXP1/Chemistry-IX-Paper-I-2022.pdf" },
  { class: "IX", subject: "Chemistry", year: 2023, file: "pastpapers/ChemistryIXP1/Chemistry-IX-Paper-I-2023.pdf" },
  { class: "IX", subject: "Chemistry", year: 2024, file: "pastpapers/ChemistryIXP1/Chemistry-IX-Paper-I-2024.pdf" },
  { class: "IX", subject: "Chemistry", year: 2025, file: "pastpapers/ChemistryIXP1/Chemistry-IX-Paper-I-2025.pdf" },

  // 3. Biology Class IX (2021-2025)
  { class: "IX", subject: "Biology", year: 2021, file: "pastpapers/BiologyIXP1/Biology-IX-Paper-I-2021.pdf" },
  { class: "IX", subject: "Biology", year: 2022, file: "pastpapers/BiologyIXP1/Biology-IX-Paper-I-2022.pdf" },
  { class: "IX", subject: "Biology", year: 2023, file: "pastpapers/BiologyIXP1/Biology-IX-Paper-I-2023.pdf" },
  { class: "IX", subject: "Biology", year: 2024, file: "pastpapers/BiologyIXP1/Biology-IX-Paper-I-2024.pdf" },
  { class: "IX", subject: "Biology", year: 2025, file: "pastpapers/BiologyIXP1/Biology-IX-Paper-I-2025.pdf" },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        flags[key] = args[++i];
      } else {
        flags[key] = "true";
      }
    }
  }
  return flags;
}

async function run() {
  const flags = parseArgs();
  const filterSubject = flags.subject;
  const filterYear = flags.year ? parseInt(flags.year, 10) : undefined;

  let items = BATCH;
  if (filterSubject) {
    items = items.filter((it) => it.subject.toLowerCase() === filterSubject.toLowerCase());
  }
  if (filterYear) {
    items = items.filter((it) => it.year === filterYear);
  }

  console.log("=========================================================================");
  console.log("🚀 Starting Batch Ingestion of Class IX Science Past Papers (2021-2025)");
  console.log(`Targeting ${items.length} papers (Physics, Chemistry, Biology)`);
  console.log("=========================================================================\n");

  const results: Array<{
    subject: string;
    year: number;
    status: string;
    questions?: number;
    error?: string;
  }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const fullPath = path.resolve(process.cwd(), item.file);

    console.log(`\n-------------------------------------------------------------------------`);
    console.log(`[${i + 1}/${items.length}] Processing Class IX ${item.subject} ${item.year} Paper 1`);
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

    if (flags["skip-existing"]) {
      const { rows: existing } = await db.query(
        `SELECT id, total_questions FROM past_papers 
         WHERE class = 'IX' AND subject = $1 AND year = $2 AND paper_number = 1 AND status = 'COMPLETED'`,
        [item.subject, item.year],
      );
      if (existing.length > 0 && existing[0].total_questions > 0) {
        console.log(`⏩ Skipping Class IX ${item.subject} ${item.year} (already completed with ${existing[0].total_questions} questions)`);
        results.push({
          subject: item.subject,
          year: item.year,
          status: "SKIPPED",
          questions: existing[0].total_questions,
        });
        continue;
      }
    }

    try {
      const cmd = `npx tsx scripts/auto-import-paper.ts --pdf "${fullPath}" --class IX --subject "${item.subject}" --year ${item.year} --paper 1 --publish`;
      console.log(`Executing: ${cmd}\n`);
      execSync(cmd, { stdio: "inherit", cwd: process.cwd() });

      // Verify in DB
      const { rows } = await db.query(
        `SELECT id, total_questions, status FROM past_papers 
         WHERE class = 'IX' AND subject = $1 AND year = $2 AND paper_number = 1`,
        [item.subject, item.year],
      );

      if (rows.length > 0) {
        console.log(
          `\n🎉 Verification Passed: Class IX ${item.subject} ${item.year} saved with ${rows[0].total_questions} questions (ID: ${rows[0].id})`,
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

    // Cooldown between papers to prevent API throttling
    if (i < items.length - 1) {
      console.log(`\n⏳ Cooling down for 4s before next paper...`);
      await new Promise((r) => setTimeout(r, 4000));
    }
  }

  console.log("\n=========================================================================");
  console.log("📊 BATCH INGESTION SUMMARY: CLASS IX (PHYSICS, CHEMISTRY, BIOLOGY)");
  console.log("=========================================================================");
  console.table(results);
  process.exit(0);
}

run().catch((err) => {
  console.error("Batch error:", err);
  process.exit(1);
});
