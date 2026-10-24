/**
 * batch-import-all.ts
 *
 * Sequentially imports all subject syllabi into PostgreSQL database
 * and activates their subject entries in the subjects catalog.
 */

import "dotenv/config";
import path from "path";
import fs from "fs";
import { importSyllabus } from "./auto-import-syllabus";

interface BatchItem {
  pdf: string;
  subject: string;
  classHint?: string;
}

const batchList: BatchItem[] = [
  // 1. Principles of Accounting (SSC & HSSC)
  { pdf: "tmp/syllabi/Principles of Accounting IX-X Syllabus 2022.pdf", subject: "Principles of Accounting" },
  { pdf: "tmp/syllabi/Principles of Accounting XI-XI Syllabus 2022.pdf", subject: "Principles of Accounting" },

  // 2. Principles of Commerce (HSSC-I / XI)
  { pdf: "tmp/syllabi/Principles of Commerce HSSC Syllabus 2022.pdf", subject: "Principles of Commerce", classHint: "XI" },

  // 3. Principles of Economics (HSSC-I / XI)
  { pdf: "tmp/syllabi/Principles of Economics XI Syllabus.pdf", subject: "Principles of Economics", classHint: "XI" },

  // 4. Business Mathematics (HSSC-I / XI)
  { pdf: "tmp/syllabi/Business Mathematics and Business Statistics HSSC I Syllabus 2022.pdf", subject: "Business Mathematics", classHint: "XI" },

  // 5. Business Statistics (HSSC-II / XII)
  { pdf: "tmp/syllabi/Business Mathematics and Business Statistics HSSC II Syllabus 2022.pdf", subject: "Business Statistics", classHint: "XII" },

  // 6. Commercial Geography (HSSC-II / XII)
  { pdf: "tmp/syllabi/Commercial Geography XII Syllabus 2022 (H2).pdf", subject: "Commercial Geography", classHint: "XII" },

  // 7. Banking (HSSC-II / XII)
  { pdf: "tmp/syllabi/Banking XII Syllabus 2022 (H2).pdf", subject: "Banking", classHint: "XII" },

  // 8. Civics (SSC & HSSC)
  { pdf: "tmp/syllabi/Civics IX-X Syllabus 2022.pdf", subject: "Civics" },
  { pdf: "tmp/syllabi/Civics HSSC Syllabus Final.pdf", subject: "Civics" },

  // 9. Business Studies (SSC)
  { pdf: "tmp/syllabi/Business Studies IX-X Syllabus 2022 (S2).pdf", subject: "Business Studies" },

  // 10. Ethics (SSC & HSSC)
  { pdf: "tmp/syllabi/Ethics SSC-English Syllabus 2025.pdf", subject: "Ethics" },
  { pdf: "tmp/syllabi/Ethics HSSC II Syllabus.pdf", subject: "Ethics", classHint: "XII" },

  // 11. Islamiat (HSSC)
  { pdf: "tmp/syllabi/Islamiyat (English) HSSC Syllabus 2025.pdf", subject: "Islamiat" },

  // 12. General Science (SSC)
  { pdf: "tmp/syllabi/General Science IX-X Syllabus Final.pdf", subject: "General Science" },
];

async function runBatch() {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Batch Ingestion of ${batchList.length} Syllabi`);
  console.log(`======================================================\n`);

  const results: Array<{ subject: string; pdf: string; success: boolean; curriculums?: number; chapters?: number; error?: string }> = [];

  for (let i = 0; i < batchList.length; i++) {
    const item = batchList[i];
    console.log(`\n[${i + 1}/${batchList.length}] Processing ${item.subject} (${path.basename(item.pdf)}) ...`);

    try {
      const res = await importSyllabus({
        pdfInput: item.pdf,
        subject: item.subject,
        classLevelHint: item.classHint,
      });

      const totalChapters = res.reduce((acc, c) => acc + c.chaptersCount, 0);
      results.push({
        subject: item.subject,
        pdf: path.basename(item.pdf),
        success: true,
        curriculums: res.length,
        chapters: totalChapters,
      });
      console.log(`✅ [${i + 1}/${batchList.length}] SUCCESS: ${item.subject} -> ${res.length} Curriculums, ${totalChapters} Chapters`);
    } catch (err: any) {
      console.error(`❌ [${i + 1}/${batchList.length}] FAILED: ${item.subject} (${path.basename(item.pdf)}):`, err.message);
      results.push({
        subject: item.subject,
        pdf: path.basename(item.pdf),
        success: false,
        error: err.message,
      });
    }

    // Small delay between documents to prevent rate spikes
    if (i < batchList.length - 1) {
      console.log(`⏳ Waiting 3s before next syllabus...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log(`\n======================================================`);
  console.log(`📊 BATCH INGESTION SUMMARY`);
  console.log(`======================================================`);
  console.table(results);

  process.exit(0);
}

runBatch().catch((err) => {
  console.error("Batch script fatal error:", err);
  process.exit(1);
});
