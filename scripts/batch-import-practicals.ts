/**
 * batch-import-practicals.ts
 *
 * Batch runner to download, extract, or synthesize all Practical Journals across:
 * - Physics: Class IX, X, XI, XII
 * - Chemistry: Class IX, X, XI, XII
 * - Biology: Class IX, X, XI, XII
 * - Computer Science: Class IX, X, XI, XII
 *
 * Usage:
 *   npx tsx scripts/batch-import-practicals.ts [--filter="Computer Science|Physics"] [--dry-run]
 */

import "dotenv/config";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

interface PracticalTask {
  subject: string;
  classLevel: string;
  pdfFile?: string;
  board?: string;
}

const PRACTICAL_TASKS: PracticalTask[] = [
  // Class IX
  { subject: "Physics", classLevel: "IX" },
  { subject: "Chemistry", classLevel: "IX" },
  { subject: "Biology", classLevel: "IX" },
  { subject: "Computer Science", classLevel: "IX" },

  // Class X
  { subject: "Physics", classLevel: "X" },
  { subject: "Chemistry", classLevel: "X" },
  { subject: "Biology", classLevel: "X" },
  { subject: "Computer Science", classLevel: "X" },

  // Class XI
  { subject: "Physics", classLevel: "XI" },
  { subject: "Chemistry", classLevel: "XI" },
  { subject: "Biology", classLevel: "XI" },
  { subject: "Computer Science", classLevel: "XI" },

  // Class XII
  { subject: "Physics", classLevel: "XII", pdfFile: "588130874-Physics-XII-12th-Grade-Class-Practical-Journal.pdf" },
  { subject: "Chemistry", classLevel: "XII", pdfFile: "1005346564-Akueb-Chemistry-Journal-Complete.pdf" },
  { subject: "Biology", classLevel: "XII" },
  { subject: "Computer Science", classLevel: "XII" },
];

function parseArgs(argv: string[]) {
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const eqIdx = arg.indexOf("=");
      if (eqIdx !== -1) {
        const key = arg.slice(2, eqIdx);
        flags[key] = arg.slice(eqIdx + 1);
      } else {
        const key = arg.slice(2);
        if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
          flags[key] = argv[++i];
        } else {
          flags[key] = "true";
        }
      }
    }
  }
  return flags;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const filter = flags.filter ? new RegExp(flags.filter, "i") : null;
  const isDryRun = flags["dry-run"] === "true" || flags.dryRun === "true";
  const delayMs = parseInt(flags.delay || "2000", 10);

  const tasks = filter
    ? PRACTICAL_TASKS.filter((t) => filter.test(t.subject) || filter.test(t.classLevel))
    : PRACTICAL_TASKS;

  console.log(`\n======================================================`);
  console.log(`🔬 Batch Practical Ingestion (${tasks.length} subject-grade modules)...`);
  console.log(`Mode: ${isDryRun ? "DRY RUN (Verification only)" : "LIVE EXECUTION"}`);
  console.log(`======================================================\n`);

  if (isDryRun) {
    tasks.forEach((t, i) => {
      console.log(`  [${i + 1}/${tasks.length}] 🧪 ${t.subject} (Class ${t.classLevel}) ${t.pdfFile ? `[PDF: ${t.pdfFile}]` : "[Curriculum synthesis]"}`);
    });
    console.log(`\n✅ Dry run verification passed! All ${tasks.length} modules configured.`);
    return;
  }

  const scriptPath = path.resolve(process.cwd(), "scripts/auto-import-practical.ts");

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    console.log(`\n[${i + 1}/${tasks.length}] 🧪 Processing: ${task.subject} (Class ${task.classLevel})`);

    const args = [
      `--subject "${task.subject}"`,
      `--class "${task.classLevel}"`,
      task.pdfFile && fs.existsSync(task.pdfFile) ? `--pdf "${task.pdfFile}"` : "",
    ]
      .filter(Boolean)
      .join(" ");

    try {
      execSync(`npx tsx "${scriptPath}" ${args}`, {
        stdio: "inherit",
        maxBuffer: 50 * 1024 * 1024,
      });
      successful++;
      console.log(`✅ [${i + 1}/${tasks.length}] Successfully processed ${task.subject} Class ${task.classLevel}!`);
    } catch (err: any) {
      failed++;
      console.error(`❌ [${i + 1}/${tasks.length}] Failed to process ${task.subject} Class ${task.classLevel}:`, err.message);
    }

    if (i < tasks.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  console.log(`\n======================================================`);
  console.log(`🏁 Batch Practical Ingestion Finished! Success: ${successful}, Failed: ${failed}`);
  console.log(`======================================================\n`);
}

main().catch(console.error);
