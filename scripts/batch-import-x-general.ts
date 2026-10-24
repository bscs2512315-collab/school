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
  keyFile?: string;
}

const BATCH: BatchItem[] = [
  // 1. Pakistan Studies (English) X (2022-2025)
  {
    class: "X",
    subject: "Pakistan Studies",
    year: 2022,
    file: "pastpapers/downloads/ClassX_General/Pakistan-Studies-English-X-Paper-I-2022.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Pakistan-Studies-X-Keys-2022.pdf",
  },
  {
    class: "X",
    subject: "Pakistan Studies",
    year: 2023,
    file: "pastpapers/downloads/ClassX_General/Pakistan-Studies-English-X-Paper-I-2023.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Pakistan-Studies-X-Keys-2023.pdf",
  },
  {
    class: "X",
    subject: "Pakistan Studies",
    year: 2024,
    file: "pastpapers/downloads/ClassX_General/Pakistan-Studies-English-X-Paper-I-2024.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Pakistan-Studies-X-Keys-2024.pdf",
  },
  {
    class: "X",
    subject: "Pakistan Studies",
    year: 2025,
    file: "pastpapers/downloads/ClassX_General/Pakistan-Studies-English-X-Paper-I-2025.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Pakistan-Studies-X-Keys-2025.pdf",
  },

  // 2. Pakistan Studies (Urdu) X (2022-2025)
  {
    class: "X",
    subject: "Pakistan Studies (Urdu)",
    year: 2022,
    file: "pastpapers/downloads/ClassX_General/Pakistan-Studies-Urdu-X-Paper-I-2022.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Pakistan-Studies-X-Keys-2022.pdf",
  },
  {
    class: "X",
    subject: "Pakistan Studies (Urdu)",
    year: 2023,
    file: "pastpapers/downloads/ClassX_General/Pakistan-Studies-Urdu-X-Paper-I-2023.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Pakistan-Studies-X-Keys-2023.pdf",
  },
  {
    class: "X",
    subject: "Pakistan Studies (Urdu)",
    year: 2024,
    file: "pastpapers/downloads/ClassX_General/Pakistan-Studies-Urdu-X-Paper-I-2024.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Pakistan-Studies-X-Keys-2024.pdf",
  },
  {
    class: "X",
    subject: "Pakistan Studies (Urdu)",
    year: 2025,
    file: "pastpapers/downloads/ClassX_General/Pakistan-Studies-Urdu-X-Paper-I-2025.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Pakistan-Studies-X-Keys-2025.pdf",
  },

  // 3. English Compulsory X (2022-2025)
  {
    class: "X",
    subject: "English",
    year: 2022,
    file: "pastpapers/downloads/ClassX_General/English-X-Paper-I-2022.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/English-X-Keys-2022.pdf",
  },
  {
    class: "X",
    subject: "English",
    year: 2023,
    file: "pastpapers/downloads/ClassX_General/English-X-Paper-I-2023.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/English-X-Keys-2023.pdf",
  },
  {
    class: "X",
    subject: "English",
    year: 2024,
    file: "pastpapers/downloads/ClassX_General/English-Compulsory-X-Paper-I-2024.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/English-Compulsory-X-Keys-2024.pdf",
  },
  {
    class: "X",
    subject: "English",
    year: 2025,
    file: "pastpapers/downloads/ClassX_General/English-Compulsory-X-Paper-I-2025.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/English-Compulsory-X-Keys-2025.pdf",
  },

  // 4. Urdu Compulsory X (2022-2025)
  {
    class: "X",
    subject: "Urdu",
    year: 2022,
    file: "pastpapers/downloads/ClassX_General/Urdu-X-Paper-I-2022.pdf",
  },
  {
    class: "X",
    subject: "Urdu",
    year: 2023,
    file: "pastpapers/downloads/ClassX_General/Urdu-X-Paper-I-2023.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Urdu-X-Keys-2023.pdf",
  },
  {
    class: "X",
    subject: "Urdu",
    year: 2024,
    file: "pastpapers/downloads/ClassX_General/Urdu-Compulsory-X-Paper-I-2024.pdf",
  },
  {
    class: "X",
    subject: "Urdu",
    year: 2025,
    file: "pastpapers/downloads/ClassX_General/Urdu-Compulsory-X-Paper-I-2025.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Urdu-Compulsory-X-Keys-2025.pdf",
  },

  // 5. Islamiyat (English) X (2022-2025)
  {
    class: "X",
    subject: "Islamiat",
    year: 2022,
    file: "pastpapers/downloads/ClassX_General/Islamiyat-English-X-Paper-I-2022.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Islamiyat-X-Keys-2022.pdf",
  },
  {
    class: "X",
    subject: "Islamiat",
    year: 2023,
    file: "pastpapers/downloads/ClassX_General/Islamiyat-English-X-Paper-I-2023.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Islamiyat-X-Keys-2023.pdf",
  },
  {
    class: "X",
    subject: "Islamiat",
    year: 2024,
    file: "pastpapers/downloads/ClassX_General/Islamiyat-English-X-Paper-I-2024.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Islamiyat-X-Keys-2024.pdf",
  },
  {
    class: "X",
    subject: "Islamiat",
    year: 2025,
    file: "pastpapers/downloads/ClassX_General/Islamiyat-English-X-Paper-I-2025.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Islamiyat-X-Keys-2025.pdf",
  },

  // 6. Islamiyat (Urdu) X (2022-2025)
  {
    class: "X",
    subject: "Islamiat (Urdu)",
    year: 2022,
    file: "pastpapers/downloads/ClassX_General/Islamiyat-Urdu-X-Paper-I-2022.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Islamiyat-X-Keys-2022.pdf",
  },
  {
    class: "X",
    subject: "Islamiat (Urdu)",
    year: 2023,
    file: "pastpapers/downloads/ClassX_General/Islamiyat-Urdu-X-Paper-I-2023.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Islamiyat-X-Keys-2023.pdf",
  },
  {
    class: "X",
    subject: "Islamiat (Urdu)",
    year: 2024,
    file: "pastpapers/downloads/ClassX_General/Islamiyat-Urdu-X-Paper-I-2024.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Islamiyat-X-Keys-2024.pdf",
  },
  {
    class: "X",
    subject: "Islamiat (Urdu)",
    year: 2025,
    file: "pastpapers/downloads/ClassX_General/Islamiyat-Urdu-X-Paper-I-2025.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/Islamiyat-X-Keys-2025.pdf",
  },

  // 7. General Mathematics X (2021-2025)
  {
    class: "X",
    subject: "General Mathematics",
    year: 2021,
    file: "pastpapers/downloads/ClassX_General/General-Mathematics-X-Paper-I-2021.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/General-Mathematics-X-Keys-2021.pdf",
  },
  {
    class: "X",
    subject: "General Mathematics",
    year: 2022,
    file: "pastpapers/downloads/ClassX_General/General-Mathematics-X-Paper-I-2022.pdf",
    keyFile: "pastpapers/downloads/ClassX_General/General-Mathematics-X-Keys-2022.pdf",
  },
  {
    class: "X",
    subject: "General Mathematics",
    year: 2023,
    file: "pastpapers/downloads/ClassX_General/General-Mathematics-X-Paper-I-2023.pdf",
  },
  {
    class: "X",
    subject: "General Mathematics",
    year: 2024,
    file: "pastpapers/downloads/ClassX_General/General-Mathematics-X-Paper-I-2024.pdf",
  },
  {
    class: "X",
    subject: "General Mathematics",
    year: 2025,
    file: "pastpapers/downloads/ClassX_General/General-Mathematics-X-Paper-I-2025.pdf",
  },
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
  console.log("🚀 Starting Batch Ingestion of Class X General & Humanities Past Papers");
  console.log(`Targeting ${items.length} papers`);
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
    console.log(`[${i + 1}/${items.length}] Processing Class X ${item.subject} ${item.year} Paper 1`);
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
      try {
        const { rows: existing } = await safeQuery(
          `SELECT id, total_questions, status FROM past_papers 
           WHERE class = 'X' AND subject = $1 AND year = $2 AND paper_number = 1 AND UPPER(status) = 'COMPLETED'`,
          [item.subject, item.year],
        );
        if (existing.length > 0 && existing[0].total_questions > 0) {
          console.log(`⏩ [SKIP] Already ingested: ${item.subject} ${item.year} (${existing[0].total_questions} questions, status: ${existing[0].status})`);
          results.push({
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
      const cmd = `npx tsx scripts/auto-import-paper.ts --pdf "${fullPath}" --class X --subject "${item.subject}" --year ${item.year} --paper 1 --publish`;
      console.log(`Executing: ${cmd}\n`);
      execSync(cmd, { stdio: "inherit", cwd: process.cwd() });

      // Verify in DB
      const { rows } = await safeQuery(
        `SELECT id, total_questions, status FROM past_papers 
         WHERE class = 'X' AND subject = $1 AND year = $2 AND paper_number = 1`,
        [item.subject, item.year],
      );

      if (rows.length > 0) {
        console.log(`\n🎉 Success! Verified in DB: Paper ID ${rows[0].id}, ${rows[0].total_questions} questions, status: ${rows[0].status}`);
        results.push({
          subject: item.subject,
          year: item.year,
          status: "SUCCESS",
          questions: rows[0].total_questions,
        });
      } else {
        console.warn(`⚠️ Warning: Command completed but paper record was not found in DB.`);
        results.push({
          subject: item.subject,
          year: item.year,
          status: "UNKNOWN",
        });
      }
    } catch (err: any) {
      console.error(`❌ Failed to ingest Class X ${item.subject} ${item.year}:`, err.message);
      results.push({
        subject: item.subject,
        year: item.year,
        status: "FAILED",
        error: err.message,
      });
    }

    // Small delay between papers to respect RPM limits
    await new Promise((r) => setTimeout(r, 4000));
  }

  console.log("\n=========================================================================");
  console.log("📊 BATCH INGESTION SUMMARY");
  console.log("=========================================================================");
  console.table(results);
}

run().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
