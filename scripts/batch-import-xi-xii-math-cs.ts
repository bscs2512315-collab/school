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
  // 1. Mathematics XI (HSSC-I)
  { class: "XI", subject: "Mathematics", year: 2021, file: "pastpapers/MathsXIP1/Mathematics-XI-Paper-I-2021.pdf" },
  { class: "XI", subject: "Mathematics", year: 2022, file: "pastpapers/MathsXIP1/Mathematics-XI-Paper-I-2022.pdf" },
  { class: "XI", subject: "Mathematics", year: 2023, file: "pastpapers/MathsXIP1/Mathematics-XI-Paper-I-2023.pdf" },
  { class: "XI", subject: "Mathematics", year: 2024, file: "pastpapers/MathsXIP1/Mathematics-XI-Paper-I-2024.pdf" },
  { class: "XI", subject: "Mathematics", year: 2025, file: "pastpapers/MathsXIP1/Mathematics-XI-Paper-I-2025.pdf" },

  // 2. Computer Science XI (HSSC-I)
  { class: "XI", subject: "Computer Science", year: 2021, file: "pastpapers/ComputerXIP1/Computer-Science-XI-Paper-I-2021.pdf" },
  { class: "XI", subject: "Computer Science", year: 2022, file: "pastpapers/ComputerXIP1/Computer-Science-XI-Paper-I-2022.pdf" },
  { class: "XI", subject: "Computer Science", year: 2023, file: "pastpapers/ComputerXIP1/Computer-Science-XI-Paper-I-2023.pdf" },
  { class: "XI", subject: "Computer Science", year: 2024, file: "pastpapers/ComputerXIP1/Computer-Science-XI-Paper-I-2024.pdf" },
  { class: "XI", subject: "Computer Science", year: 2025, file: "pastpapers/ComputerXIP1/Computer-Science-XI-Paper-I-2025.pdf" },

  // 3. Mathematics XII (HSSC-II)
  { class: "XII", subject: "Mathematics", year: 2021, file: "pastpapers/MathsXIIP1/Mathematics-XII-Paper-I-2021.pdf" },
  { class: "XII", subject: "Mathematics", year: 2022, file: "pastpapers/MathsXIIP1/Mathematics-XII-Paper-I-2022.pdf" },
  { class: "XII", subject: "Mathematics", year: 2023, file: "pastpapers/MathsXIIP1/Mathematics-XII-Paper-I-2023.pdf" },
  { class: "XII", subject: "Mathematics", year: 2024, file: "pastpapers/MathsXIIP1/Mathematics-XII-Paper-I-2024.pdf" },
  { class: "XII", subject: "Mathematics", year: 2025, file: "pastpapers/MathsXIIP1/Mathematics-XII-Paper-I-2025.pdf" },

  // 4. Computer Science XII (HSSC-II)
  { class: "XII", subject: "Computer Science", year: 2021, file: "pastpapers/ComputerXIIP1/Computer-Science-XII-Paper-I-2021.pdf" },
  { class: "XII", subject: "Computer Science", year: 2022, file: "pastpapers/ComputerXIIP1/Computer-Science-XII-Paper-I-2022.pdf" },
  { class: "XII", subject: "Computer Science", year: 2023, file: "pastpapers/ComputerXIIP1/Computer-Science-XII-Paper-I-2023.pdf" },
  { class: "XII", subject: "Computer Science", year: 2024, file: "pastpapers/ComputerXIIP1/Computer-Science-XII-Paper-I-2024.pdf" },
  { class: "XII", subject: "Computer Science", year: 2025, file: "pastpapers/ComputerXIIP1/Computer-Science-XII-Paper-I-2025.pdf" },
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
  const filterClass = flags.class;
  const filterSubject = flags.subject;
  const filterYear = flags.year ? parseInt(flags.year, 10) : undefined;

  let items = BATCH;
  if (filterClass) {
    items = items.filter((it) => it.class.toUpperCase() === filterClass.toUpperCase());
  }
  if (filterSubject) {
    items = items.filter((it) => it.subject.toLowerCase() === filterSubject.toLowerCase());
  }
  if (filterYear) {
    items = items.filter((it) => it.year === filterYear);
  }

  console.log("=========================================================================");
  console.log("🚀 Starting Batch Ingestion of Class XI & XII (Mathematics, Computer Science)");
  console.log(`Targeting ${items.length} papers`);
  console.log("=========================================================================\n");

  const results: Array<{
    class: string;
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
    console.log(`[${i + 1}/${items.length}] Processing Class ${item.class} ${item.subject} ${item.year} Paper 1`);
    console.log(`File: ${fullPath}`);
    console.log(`-------------------------------------------------------------------------`);

    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${fullPath}`);
      results.push({
        class: item.class,
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
         WHERE class = $1 AND subject = $2 AND year = $3 AND paper_number = 1 AND status = 'COMPLETED'`,
        [item.class, item.subject, item.year],
      );
      if (existing.length > 0 && existing[0].total_questions > 0) {
        console.log(`⏩ Skipping Class ${item.class} ${item.subject} ${item.year} (already completed with ${existing[0].total_questions} questions)`);
        results.push({
          class: item.class,
          subject: item.subject,
          year: item.year,
          status: "SKIPPED",
          questions: existing[0].total_questions,
        });
        continue;
      }
    }

    try {
      const cmd = `npx tsx scripts/auto-import-paper.ts --pdf "${fullPath}" --class ${item.class} --subject "${item.subject}" --year ${item.year} --paper 1 --publish`;
      console.log(`Executing: ${cmd}\n`);
      execSync(cmd, { stdio: "inherit", cwd: process.cwd() });

      // Verify in DB
      const { rows } = await db.query(
        `SELECT id, total_questions, status FROM past_papers 
         WHERE class = $1 AND subject = $2 AND year = $3 AND paper_number = 1`,
        [item.class, item.subject, item.year],
      );

      if (rows.length > 0) {
        console.log(
          `\n🎉 Verification Passed: Class ${item.class} ${item.subject} ${item.year} saved with ${rows[0].total_questions} questions (ID: ${rows[0].id})`,
        );
        results.push({
          class: item.class,
          subject: item.subject,
          year: item.year,
          status: "SUCCESS",
          questions: rows[0].total_questions,
        });
      } else {
        results.push({ class: item.class, subject: item.subject, year: item.year, status: "SUCCESS_NO_VERIFY" });
      }
    } catch (err: any) {
      console.error(`❌ Failed to process ${item.class} ${item.subject} ${item.year}:`, err?.message || err);
      results.push({
        class: item.class,
        subject: item.subject,
        year: item.year,
        status: "FAILED",
        error: err?.message || String(err),
      });
    }

    // Cooldown between papers
    if (i < items.length - 1) {
      console.log(`\n⏳ Cooling down for 4s before next paper...`);
      await new Promise((r) => setTimeout(r, 4000));
    }
  }

  console.log("\n=========================================================================");
  console.log("📊 BATCH INGESTION SUMMARY: CLASS XI & XII (MATHEMATICS, COMPUTER SCIENCE)");
  console.log("=========================================================================");
  console.table(results);
  process.exit(0);
}

run().catch((err) => {
  console.error("Batch error:", err);
  process.exit(1);
});
