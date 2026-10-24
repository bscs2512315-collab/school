import "dotenv/config";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { db } from "../lib/db";

interface BatchPaper {
  class: "XI" | "XII";
  subject: string;
  year: number;
  file: string;
}

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

async function safeQuery(sql: string, params: any[]) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await db.query(sql, params);
    } catch (err: any) {
      if (attempt < 3) {
        console.warn(`⚠️ DB query failed (${err.message}). Retrying in 3s...`);
        await new Promise((r) => setTimeout(r, 3000));
      } else {
        throw err;
      }
    }
  }
  return { rows: [] };
}

function discoverPapers(): BatchPaper[] {
  const papers: BatchPaper[] = [];
  const baseDirs = [
    { class: "XI" as const, dir: path.resolve(process.cwd(), "pastpapers/downloads/ClassXI_General") },
    { class: "XII" as const, dir: path.resolve(process.cwd(), "pastpapers/downloads/ClassXII_General") },
  ];

  for (const { class: cls, dir } of baseDirs) {
    if (!fs.existsSync(dir)) continue;

    const subfolders = fs.readdirSync(dir, { withFileTypes: true });
    for (const sub of subfolders) {
      if (!sub.isDirectory()) continue;
      const subPath = path.join(dir, sub.name);
      const files = fs.readdirSync(subPath);

      for (const file of files) {
        if (!file.toLowerCase().endsWith(".pdf")) continue;
        const lower = file.toLowerCase();

        // Skip keys, models, e-marking, syllabus, etc.
        if (
          lower.includes("key") ||
          lower.includes("model") ||
          lower.includes("e-marking") ||
          lower.includes("syllabus") ||
          lower.includes("book") ||
          lower.includes("listening") ||
          lower.includes("paper-ii") ||
          lower.includes("paper-2")
        ) {
          continue;
        }

        // Must be Paper 1
        if (
          !lower.includes("paper-i") &&
          !lower.includes("paper-1") &&
          !lower.includes("paper-20") &&
          !lower.includes("paper_i")
        ) {
          continue;
        }

        // Year extraction
        const ym = file.match(/(20\d\d)/);
        if (!ym) continue;
        const year = parseInt(ym[1], 10);
        if (year < 2021 || year > 2025) continue;

        // Subject naming resolution
        let subject = sub.name.replace(/_/g, " ");
        if (sub.name.toLowerCase() === "urdu") {
          subject = "Urdu";
        } else if (sub.name.toLowerCase() === "english") {
          subject = "English";
        } else if (sub.name.toLowerCase().includes("pakistan_studies_urdu") || lower.includes("urdu")) {
          if (sub.name.toLowerCase().includes("pakistan_studies")) subject = "Pakistan Studies (Urdu)";
          if (sub.name.toLowerCase().includes("islamiyat")) subject = "Islamiat (Urdu)";
        } else if (sub.name.toLowerCase().includes("islamiyat_urdu")) {
          subject = "Islamiat (Urdu)";
        } else if (sub.name.toLowerCase().includes("islamiyat")) {
          subject = "Islamiat";
        } else if (sub.name.toLowerCase().includes("pakistan_studies")) {
          subject = "Pakistan Studies";
        }

        papers.push({
          class: cls,
          subject,
          year,
          file: path.relative(process.cwd(), path.join(subPath, file)),
        });
      }
    }
  }

  // Sort papers systematically by class, subject, and year
  papers.sort((a, b) => {
    if (a.class !== b.class) return a.class.localeCompare(b.class);
    if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
    return a.year - b.year;
  });

  return papers;
}

async function run() {
  const flags = parseArgs();
  const filterClass = flags.class as "XI" | "XII" | undefined;
  const filterSubject = flags.subject;
  const filterYear = flags.year ? parseInt(flags.year, 10) : undefined;
  const skipExisting = flags["skip-existing"] !== "false";

  let papers = discoverPapers();

  if (filterClass) {
    papers = papers.filter((p) => p.class.toUpperCase() === filterClass.toUpperCase());
  }
  if (filterSubject) {
    papers = papers.filter((p) => p.subject.toLowerCase().includes(filterSubject.toLowerCase()));
  }
  if (filterYear) {
    papers = papers.filter((p) => p.year === filterYear);
  }

  console.log("=========================================================================");
  console.log("🚀 Starting Batch Ingestion of Class XI & XII Past Papers");
  console.log(`Discovered ${papers.length} eligible Paper 1 PDFs`);
  console.log(`Skip Existing: ${skipExisting}`);
  console.log("=========================================================================\n");

  const results: Array<{
    class: string;
    subject: string;
    year: number;
    status: string;
    questions?: number;
    error?: string;
  }> = [];

  for (let i = 0; i < papers.length; i++) {
    const item = papers[i];
    const fullPath = path.resolve(process.cwd(), item.file);

    console.log(`\n-------------------------------------------------------------------------`);
    console.log(`[${i + 1}/${papers.length}] Class ${item.class} | ${item.subject} | ${item.year}`);
    console.log(`File: ${item.file}`);
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

    if (skipExisting) {
      try {
        const { rows: existing } = await safeQuery(
          `SELECT id, total_questions, status FROM past_papers 
           WHERE class = $1 AND subject = $2 AND year = $3 AND paper_number = 1 AND UPPER(status) = 'COMPLETED'`,
          [item.class, item.subject, item.year],
        );
        if (existing.length > 0 && existing[0].total_questions > 0) {
          console.log(`⏩ [SKIP] Already ingested: Class ${item.class} ${item.subject} ${item.year} (${existing[0].total_questions} questions)`);
          results.push({
            class: item.class,
            subject: item.subject,
            year: item.year,
            status: "SKIPPED",
            questions: existing[0].total_questions,
          });
          continue;
        }
      } catch (err: any) {
        console.warn(`Could not check existing paper: ${err.message}`);
      }
    }

    try {
      const cmd = `npx tsx scripts/auto-import-paper.ts --pdf "${fullPath}" --class "${item.class}" --subject "${item.subject}" --year ${item.year} --paper 1 --publish`;
      console.log(`Executing: ${cmd}\n`);
      execSync(cmd, { stdio: "inherit", cwd: process.cwd() });

      // Verify in DB
      const { rows } = await safeQuery(
        `SELECT id, total_questions, status FROM past_papers 
         WHERE class = $1 AND subject = $2 AND year = $3 AND paper_number = 1`,
        [item.class, item.subject, item.year],
      );

      if (rows.length > 0) {
        console.log(`\n🎉 Verified in DB: ID ${rows[0].id}, ${rows[0].total_questions} questions, status: ${rows[0].status}`);
        results.push({
          class: item.class,
          subject: item.subject,
          year: item.year,
          status: "SUCCESS",
          questions: rows[0].total_questions,
        });
      } else {
        console.warn(`⚠️ Warning: Ingestion finished but paper record not found in DB.`);
        results.push({
          class: item.class,
          subject: item.subject,
          year: item.year,
          status: "UNKNOWN",
        });
      }
    } catch (err: any) {
      console.error(`❌ Ingestion failed for Class ${item.class} ${item.subject} ${item.year}:`, err.message);
      results.push({
        class: item.class,
        subject: item.subject,
        year: item.year,
        status: "FAILED",
        error: err.message,
      });
    }

    // Delay between papers to respect Gemini RPM quotas
    await new Promise((r) => setTimeout(r, 4000));
  }

  console.log("\n=========================================================================");
  console.log("📊 BATCH INGESTION SUMMARY (Class XI & XII)");
  console.log("=========================================================================");
  console.table(results);
}

run().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
