/**
 * batch-import-paper2.ts
 *
 * Batch Ingestion Runner for Paper 2 (Theory / CRQ / ERQ) across:
 * - Class IX: Mathematics, Chemistry, Physics, Biology, Computer Science (2023-2025)
 * - Class X: Mathematics, Chemistry, Physics, Biology, Computer Science (2023-2025)
 * - Class XI: Mathematics, Chemistry, Physics, Biology, Computer Science (2023-2025)
 * - Class XII: Chemistry, Physics, Biology (2023-2025)
 *
 * Usage:
 *   npx tsx scripts/batch-import-paper2.ts
 *   npx tsx scripts/batch-import-paper2.ts --class IX
 *   npx tsx scripts/batch-import-paper2.ts --class X
 *   npx tsx scripts/batch-import-paper2.ts --class XI
 *   npx tsx scripts/batch-import-paper2.ts --class XII
 *   npx tsx scripts/batch-import-paper2.ts --subject Chemistry
 *   npx tsx scripts/batch-import-paper2.ts --manifest pastpapers/paper2_manifest_ix_xi.json
 *   npx tsx scripts/batch-import-paper2.ts --manifest pastpapers/paper2_manifest_retry.json --sleep 8000
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { importPaper2 } from "./auto-import-paper2";

interface ManifestItem {
  class: string;
  subject: string;
  year: number;
  paperPdf?: string;
  markingPdf?: string;
}

function parseArgs(argv: string[]) {
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        flags[key] = argv[++i];
      } else {
        flags[key] = "true";
      }
    }
  }
  return flags;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const filterClass = flags.class;
  const filterSubject = flags.subject;
  const filterYear = flags.year ? parseInt(flags.year, 10) : undefined;
  const force = flags.force === "true";
  const sleepMs = flags.sleep ? parseInt(flags.sleep, 10) : 3000;
  const manifestFile = flags.manifest || "pastpapers/paper2_manifest.json";

  const manifestPath = path.resolve(process.cwd(), manifestFile);
  if (!fs.existsSync(manifestPath)) {
    console.error(`Error: Manifest not found at ${manifestPath}. Run download_paper2.py first.`);
    process.exit(1);
  }

  const allItems: ManifestItem[] = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  let targets = allItems.filter((item) => {
    if (!item.paperPdf || !fs.existsSync(item.paperPdf)) return false;
    if (filterClass && item.class.toLowerCase() !== filterClass.toLowerCase()) return false;
    if (filterSubject && item.subject.toLowerCase() !== filterSubject.toLowerCase()) return false;
    if (filterYear && item.year !== filterYear) return false;
    return true;
  });

  console.log("==========================================================================");
  console.log("🚀 Starting Batch Ingestion for Paper 2 (Theory / CRQ / ERQ)");
  console.log("==========================================================================");
  console.log(`Total Target Papers to Process: ${targets.length}`);
  if (filterClass) console.log(`Filter Class: ${filterClass}`);
  if (filterSubject) console.log(`Filter Subject: ${filterSubject}`);
  if (filterYear) console.log(`Filter Year: ${filterYear}`);
  console.log("==========================================================================\n");

  const results: Array<{
    target: string;
    status: "SUCCESS" | "FAILED" | "SKIPPED";
    questions: number;
    diagrams: number;
    error?: string;
  }> = [];

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i];
    const label = `[${i + 1}/${targets.length}] Class ${item.class} · ${item.subject} (${item.year}) - Paper II`;
    console.log(`\n--------------------------------------------------------------------------`);
    console.log(`▶️  ${label}`);
    console.log(`--------------------------------------------------------------------------`);

    try {
      const res = await importPaper2({
        classVal: item.class,
        board: "AKUEB",
        subject: item.subject,
        year: item.year,
        pdfPath: path.resolve(process.cwd(), item.paperPdf!),
        markingPdfPath: item.markingPdf && fs.existsSync(item.markingPdf)
          ? path.resolve(process.cwd(), item.markingPdf)
          : undefined,
        publish: true,
        force,
      });

      results.push({
        target: `Class ${item.class} ${item.subject} ${item.year}`,
        status: "SUCCESS",
        questions: res.questionsCount,
        diagrams: res.diagramsCount,
      });

      console.log(`✅ Finished: ${label} (${res.questionsCount} Qs, ${res.diagramsCount} diagrams)`);
    } catch (err: any) {
      console.error(`❌ Failed: ${label}:`, err.message);
      results.push({
        target: `Class ${item.class} ${item.subject} ${item.year}`,
        status: "FAILED",
        questions: 0,
        diagrams: 0,
        error: err.message,
      });
    }

    // Gentle sleep between papers to prevent rate limits
    if (i < targets.length - 1) {
      console.log(`⏳ Waiting ${sleepMs / 1000}s before next paper...`);
      await new Promise((r) => setTimeout(r, sleepMs));
    }
  }

  console.log("\n==========================================================================");
  console.log("📊 BATCH INGESTION SUMMARY REPORT");
  console.log("==========================================================================");
  let totalQuestions = 0;
  let totalDiagrams = 0;
  let successCount = 0;
  let failedCount = 0;

  results.forEach((r) => {
    const icon = r.status === "SUCCESS" ? "✅" : "❌";
    console.log(`${icon} ${r.target.padEnd(35)} : ${r.status} (${r.questions} Qs, ${r.diagrams} diagrams) ${r.error ? `[${r.error}]` : ""}`);
    if (r.status === "SUCCESS") {
      successCount++;
      totalQuestions += r.questions;
      totalDiagrams += r.diagrams;
    } else {
      failedCount++;
    }
  });

  console.log("--------------------------------------------------------------------------");
  console.log(`Total Processed Papers: ${results.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Total Questions Ingested: ${totalQuestions}`);
  console.log(`Total Diagrams Extracted & Hosted: ${totalDiagrams}`);
  console.log("==========================================================================\n");
}

main().catch((err) => {
  console.error("Batch runner fatal error:", err);
  process.exit(1);
});
