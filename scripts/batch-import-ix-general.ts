import "dotenv/config";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { db } from "../lib/db";
import { extractTextFromPDF } from "../lib/pdf/parser";

interface BatchItem {
  class: string;
  subject: string;
  year: number;
  file: string;
  keyFile?: string;
}

const BATCH: BatchItem[] = [
  // 1. Pakistan Studies (English) (2022-2025)
  {
    class: "IX",
    subject: "Pakistan Studies",
    year: 2022,
    file: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-English-IX-Paper-I-2022.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-IX-Keys-2022.pdf",
  },
  {
    class: "IX",
    subject: "Pakistan Studies",
    year: 2023,
    file: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-English-IX-Paper-I-2023.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-IX-Keys-2023.pdf",
  },
  {
    class: "IX",
    subject: "Pakistan Studies",
    year: 2024,
    file: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-English-IX-Paper-I-2024.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-IX-Keys-2024.pdf",
  },
  {
    class: "IX",
    subject: "Pakistan Studies",
    year: 2025,
    file: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-English-IX-Paper-I-2025.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-IX-Keys-2025.pdf",
  },

  // 2. Pakistan Studies (Urdu) (2022-2025)
  {
    class: "IX",
    subject: "Pakistan Studies (Urdu)",
    year: 2022,
    file: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-Urdu-IX-Paper-I-2022.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-IX-Keys-2022.pdf",
  },
  {
    class: "IX",
    subject: "Pakistan Studies (Urdu)",
    year: 2023,
    file: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-Urdu-IX-Paper-I-2023.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-IX-Keys-2023.pdf",
  },
  {
    class: "IX",
    subject: "Pakistan Studies (Urdu)",
    year: 2024,
    file: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-Urdu-IX-Paper-I-2024.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-IX-Keys-2024.pdf",
  },
  {
    class: "IX",
    subject: "Pakistan Studies (Urdu)",
    year: 2025,
    file: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-Urdu-IX-Paper-I-2025.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/Pakistan-Studies-IX-Keys-2025.pdf",
  },

  // 3. English Compulsory (2022-2025)
  {
    class: "IX",
    subject: "English",
    year: 2022,
    file: "pastpapers/downloads/ClassIX_General/English-IX-Paper-I-2022.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/English-IX-Keys-2022.pdf",
  },
  {
    class: "IX",
    subject: "English",
    year: 2023,
    file: "pastpapers/downloads/ClassIX_General/English-IX-Paper-I-2023.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/English-IX-Keys-2023.pdf",
  },
  {
    class: "IX",
    subject: "English",
    year: 2024,
    file: "pastpapers/downloads/ClassIX_General/English-Compulsory-IX-Paper-I-2024.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/English-Compulsory-IX-Keys-2024.pdf",
  },
  {
    class: "IX",
    subject: "English",
    year: 2025,
    file: "pastpapers/downloads/ClassIX_General/English-Compulsory-IX-Paper-I-2025.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/English-Compulsory-IX-Keys-2025.pdf",
  },

  // 4. General Mathematics (2021-2025)
  {
    class: "IX",
    subject: "General Mathematics",
    year: 2021,
    file: "pastpapers/downloads/ClassIX_General/General-Mathematics-IX-Paper-I-2021.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/General-Mathematics-IX-Keys-2021.pdf",
  },
  {
    class: "IX",
    subject: "General Mathematics",
    year: 2022,
    file: "pastpapers/downloads/ClassIX_General/General-Mathematics-IX-Paper-I-2022.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/General-Mathematics-IX-Keys-2022.pdf",
  },
  {
    class: "IX",
    subject: "General Mathematics",
    year: 2023,
    file: "pastpapers/downloads/ClassIX_General/General-Mathematics-IX-Paper-I-2023.pdf",
  },
  {
    class: "IX",
    subject: "General Mathematics",
    year: 2024,
    file: "pastpapers/downloads/ClassIX_General/General-Mathematics-IX-Paper-I-2024.pdf",
  },
  {
    class: "IX",
    subject: "General Mathematics",
    year: 2025,
    file: "pastpapers/downloads/ClassIX_General/General-Mathematics-IX-Paper-I-2025.pdf",
  },

  // 5. Islamiyat (English) (2022, 2023, 2025)
  {
    class: "IX",
    subject: "Islamiat",
    year: 2022,
    file: "pastpapers/downloads/ClassIX_General/Islamiyat-English-IX-Paper-I-2022.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/Islamiyat-IX-Keys-2022.pdf",
  },
  {
    class: "IX",
    subject: "Islamiat",
    year: 2023,
    file: "pastpapers/downloads/ClassIX_General/Islamiyat-English-IX-Paper-I-2023.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/Islamiyat-IX-Keys-2023.pdf",
  },
  {
    class: "IX",
    subject: "Islamiat",
    year: 2025,
    file: "pastpapers/downloads/ClassIX_General/Islamiyat-English-IX-Paper-I-2025.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/Islamiyat-IX-Keys-2025.pdf",
  },

  // 6. Islamiyat (Urdu) (2022-2025)
  {
    class: "IX",
    subject: "Islamiat (Urdu)",
    year: 2022,
    file: "pastpapers/downloads/ClassIX_General/Islamiyat-Urdu-IX-Paper-I-2022.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/Islamiyat-IX-Keys-2022.pdf",
  },
  {
    class: "IX",
    subject: "Islamiat (Urdu)",
    year: 2023,
    file: "pastpapers/downloads/ClassIX_General/Islamiyat-Urdu-IX-Paper-I-2023.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/Islamiyat-IX-Keys-2023.pdf",
  },
  {
    class: "IX",
    subject: "Islamiat (Urdu)",
    year: 2024,
    file: "pastpapers/downloads/ClassIX_General/Islamiyat-Urdu-IX-Paper-I-2024.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/Islamiyat-IX-Keys-2024.pdf",
  },
  {
    class: "IX",
    subject: "Islamiat (Urdu)",
    year: 2025,
    file: "pastpapers/downloads/ClassIX_General/Islamiyat-Urdu-IX-Paper-I-2025.pdf",
    keyFile: "pastpapers/downloads/ClassIX_General/Islamiyat-IX-Keys-2025.pdf",
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
  console.log("🚀 Starting Batch Ingestion of Class IX General & Humanities Past Papers");
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
        `SELECT id, total_questions, status FROM past_papers 
         WHERE class = 'IX' AND subject = $1 AND year = $2 AND paper_number = 1 AND UPPER(status) = 'COMPLETED'`,
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
      console.error(`❌ Failed to ingest Class IX ${item.subject} ${item.year}:`, err.message);
      results.push({
        subject: item.subject,
        year: item.year,
        status: "FAILED",
        error: err.message,
      });
    }
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
