/**
 * batch-import-paper1-remaining.ts
 *
 * Ingests the remaining 30 AKUEB Paper I (MCQ) papers that were missing:
 * - IX Business Studies (2021-2025), IX Civics (2022,2023,2025)
 * - IX Principles of Accounting (2021-2025), IX Urdu (2022-2025)
 * - X Business Studies (2021-2025), X Principles of Accounting (2021-2025)
 * - XII Ethics (2023-2025)
 *
 * Usage:
 *   npx tsx scripts/batch-import-paper1-remaining.ts [--sleep 5000] [--limit N] [--subject "Business Studies"]
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { db } from "@/lib/db";

interface Item {
  class: string;
  subject: string;
  year: number;
  pdf: string;
}

const BASE = "pastpapers/downloads/RemainingP1";

const BATCH: Item[] = [
  // IX Business Studies (2021-2025)
  ...[2021, 2022, 2023, 2024, 2025].map((y) => ({ class: "IX", subject: "Business Studies", year: y, pdf: `${BASE}/IX_BusinessStudies/Business-Studies-IX-Paper-I-${y}.pdf` })),
  // IX Civics (2022, 2023, 2025)
  ...[2022, 2023, 2025].map((y) => ({ class: "IX", subject: "Civics", year: y, pdf: `${BASE}/IX_Civics/Civics-IX-Paper-I-${y}.pdf` })),
  // IX Principles of Accounting (2021-2025)
  ...[2021, 2022, 2023, 2024, 2025].map((y) => ({ class: "IX", subject: "Principles of Accounting", year: y, pdf: `${BASE}/IX_Accounting/Principles-of-Accounting-IX-Paper-I-${y}.pdf` })),
  // IX Urdu (2022-2025)
  ...[2022, 2023].map((y) => ({ class: "IX", subject: "Urdu", year: y, pdf: `${BASE}/IX_Urdu/Urdu-IX-Paper-I-${y}.pdf` })),
  ...[2024, 2025].map((y) => ({ class: "IX", subject: "Urdu", year: y, pdf: `${BASE}/IX_Urdu/Urdu-Compulsory-IX-Paper-I-${y}.pdf` })),
  // X Business Studies (2021-2025)
  ...[2021, 2022, 2023, 2024, 2025].map((y) => ({ class: "X", subject: "Business Studies", year: y, pdf: `${BASE}/X_BusinessStudies/Business-Studies-X-Paper-I-${y}.pdf` })),
  // X Principles of Accounting (2021-2025)
  ...[2021, 2022, 2023, 2024, 2025].map((y) => ({ class: "X", subject: "Principles of Accounting", year: y, pdf: `${BASE}/X_Accounting/Principles-of-Accounting-X-Paper-I-${y}.pdf` })),
  // XII Ethics (2023-2025)
  { class: "XII", subject: "Ethics", year: 2023, pdf: `${BASE}/XII_Ethics/Ethics-English-XII-Paper-I-2023.pdf` },
  { class: "XII", subject: "Ethics", year: 2024, pdf: `${BASE}/XII_Ethics/Ethics-XII-Paper-I-2024-English.pdf` },
  { class: "XII", subject: "Ethics", year: 2025, pdf: `${BASE}/XII_Ethics/Ethics-English-XII-Paper-I-2025.pdf` },
];

function parseArgs(argv: string[]) {
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) flags[key] = argv[++i];
      else flags[key] = "true";
    }
  }
  return flags;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const sleepMs = flags.sleep ? parseInt(flags.sleep, 10) : 4000;
  const limit = flags.limit ? parseInt(flags.limit, 10) : undefined;
  const subjectFilter = flags.subject;
  const force = flags.force === "true";

  let items = BATCH;
  if (subjectFilter) items = items.filter((i) => i.subject.toLowerCase().includes(subjectFilter.toLowerCase()));
  if (limit) items = items.slice(0, limit);

  const results: Array<{ target: string; status: string; questions?: number; error?: string }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const fullPath = path.resolve(process.cwd(), item.pdf);
    console.log(`\n--------------------------------------------------------------------------`);
    console.log(`[${i + 1}/${items.length}] Class ${item.class} ${item.subject} ${item.year} Paper 1`);
    console.log(`--------------------------------------------------------------------------`);

    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${fullPath}`);
      results.push({ target: `${item.class} ${item.subject} ${item.year}`, status: "FAILED", error: "File not found" });
      continue;
    }

    if (!force) {
      const { rows } = await db.query(
        `SELECT total_questions, status FROM past_papers WHERE class = $1 AND board = $2 AND subject = $3 AND year = $4 AND paper_number = 1`,
        [item.class, "AKUEB", item.subject, item.year],
      );
      if (rows.length > 0 && rows[0].total_questions > 0) {
        console.log(`⏩ [SKIP] Already ingested: ${item.subject} ${item.year} (${rows[0].total_questions} questions)`);
        results.push({ target: `${item.class} ${item.subject} ${item.year}`, status: "SKIPPED", questions: rows[0].total_questions });
        continue;
      }
    }

    try {
      const cmd = `npx tsx scripts/auto-import-paper.ts --pdf "${fullPath}" --class ${item.class} --subject "${item.subject}" --year ${item.year} --paper 1 --publish`;
      console.log(`Executing: ${cmd}\n`);
      execSync(cmd, { stdio: "inherit", cwd: process.cwd() });

      const { rows } = await db.query(
        `SELECT total_questions, status FROM past_papers WHERE class = $1 AND board = $2 AND subject = $3 AND year = $4 AND paper_number = 1`,
        [item.class, "AKUEB", item.subject, item.year],
      );
      console.log(`\n🎉 Success! ${item.subject} ${item.year}: ${rows[0]?.total_questions} questions, status ${rows[0]?.status}`);
      results.push({ target: `${item.class} ${item.subject} ${item.year}`, status: "SUCCESS", questions: rows[0]?.total_questions });
    } catch (err: any) {
      console.error(`❌ Failed: ${item.class} ${item.subject} ${item.year}:`, err.message);
      results.push({ target: `${item.class} ${item.subject} ${item.year}`, status: "FAILED", error: err.message });
    }

    if (i < items.length - 1 && sleepMs > 0) {
      console.log(`\n💤 Sleeping ${sleepMs}ms between files...`);
      await new Promise((r) => setTimeout(r, sleepMs));
    }
  }

  console.log("\n=========================================================================");
  console.log("📊 BATCH INGESTION SUMMARY");
  console.log("=========================================================================");
  console.table(results);

  await db.pool.end();
}

main().catch(async (err) => {
  console.error("Fatal Error:", err);
  await db.pool.end();
  process.exit(1);
});