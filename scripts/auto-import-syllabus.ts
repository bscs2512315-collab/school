/**
 * auto-import-syllabus.ts
 *
 * Automated CLI script to download, extract, and ingest AKUEB Syllabus & SLOs:
 * - Downloads directly from AKUEB URL or reads from local PDF file.
 * - Extracts structured table & SLO layout using PyMuPDF helper.
 * - Uses Gemini AI to accurately extract Chapters, Subtopics, and SLOs with Cognitive Levels (R, U, A, FA).
 * - Splits multi-grade syllabi (SSC-I/IX & SSC-II/X or HSSC-I/XI & HSSC-II/XII) into separate curriculums.
 * - Upserts into PostgreSQL database (`curriculums` and `chapters`).
 * - Activates the subject in the `subjects` catalog.
 *
 * Usage:
 *   npx tsx scripts/auto-import-syllabus.ts --pdf "https://examinationboard.aku.edu/..." --subject "Mathematics"
 *   npx tsx scripts/auto-import-syllabus.ts --pdf "tmp/syllabi/pak_studies_ssc.pdf" --subject "Pakistan Studies"
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { extractSyllabusFromText, type ExtractedCurriculum } from "@/lib/ai/syllabus-extract";
import { insertMultipleCurriculums, type InsertSyllabusResult } from "@/lib/syllabus/insert-syllabus";
import { db } from "@/lib/db";

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

export function downloadPdf(url: string, destDir: string): string {
  osEnsureDir(destDir);
  const cleanUrl = url.trim();
  const rawFileName = path.basename(decodeURIComponent(new URL(cleanUrl).pathname));
  const fileName = rawFileName.endsWith(".pdf") ? rawFileName : `${rawFileName}.pdf`;
  const destPath = path.join(destDir, fileName);

  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
    console.log(`[Cache] Using cached PDF: ${destPath} (${(fs.statSync(destPath).size / 1024 / 1024).toFixed(2)} MB)`);
    return destPath;
  }

  console.log(`[Download] Fetching ${cleanUrl} ...`);
  const safeUrl = encodeURI(decodeURI(cleanUrl));
  const curlCmd = `curl -k -L -f -C - --speed-limit 1000 --speed-time 15 --retry 5 --retry-delay 2 -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${safeUrl}" -o "${destPath}"`;
  try {
    execSync(curlCmd, { stdio: "inherit" });
  } catch (err) {
    console.warn(`[Download] Resuming/retrying with direct curl...`);
    const curlFallback = `curl -k -L -A "Mozilla/5.0" "${cleanUrl}" -o "${destPath}"`;
    execSync(curlFallback, { stdio: "inherit" });
  }

  if (!fs.existsSync(destPath) || fs.statSync(destPath).size < 1000) {
    throw new Error(`Failed to download PDF or downloaded file is corrupt (${destPath})`);
  }

  console.log(`[Download] Saved to ${destPath} (${(fs.statSync(destPath).size / 1024 / 1024).toFixed(2)} MB)`);
  return destPath;
}

function osEnsureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export interface ImportSyllabusOptions {
  pdfInput: string;
  subject?: string;
  classLevelHint?: string;
  board?: string;
  isDryRun?: boolean;
  force?: boolean;
}

/**
 * Core reusable function to import a single syllabus PDF or URL.
 */
export async function importSyllabus(options: ImportSyllabusOptions): Promise<InsertSyllabusResult[]> {
  const { pdfInput, subject, classLevelHint, board = "AKUEB", isDryRun = false, force = false } = options;

  if (!pdfInput) {
    throw new Error("PDF input is required");
  }

  // Check if subject and class already exist in DB with SLOs
  if (!force && subject && classLevelHint) {
    const { rows } = await db.query(
      `SELECT c.id, count(ch.id) as chapters_count, count(ch.analyzed_content) as slos_count
       FROM curriculums c
       JOIN chapters ch ON ch.curriculum_id = c.id
       WHERE c.class = $1 AND c.subject = $2 AND c.board = $3
       GROUP BY c.id`,
      [classLevelHint, subject, board],
    );
    if (rows.length > 0 && parseInt(rows[0].slos_count, 10) > 0 && parseInt(rows[0].chapters_count, 10) === parseInt(rows[0].slos_count, 10)) {
      console.log(`[Skip] Class ${classLevelHint} ${subject} already has ${rows[0].slos_count} chapters with SLOs in DB. Use --force to re-import.`);
      return [
        {
          curriculumId: rows[0].id,
          classLevel: classLevelHint,
          board,
          subject,
          chaptersCount: parseInt(rows[0].chapters_count, 10),
          totalSLOsCount: 0,
          isNew: false,
        },
      ];
    }
  }

  let resolvedPdfPath = pdfInput;
  if (pdfInput.startsWith("http://") || pdfInput.startsWith("https://")) {
    resolvedPdfPath = downloadPdf(pdfInput, path.resolve(process.cwd(), "tmp/syllabi"));
  } else if (!path.isAbsolute(pdfInput)) {
    resolvedPdfPath = path.resolve(process.cwd(), pdfInput);
  }

  if (!fs.existsSync(resolvedPdfPath)) {
    throw new Error(`File not found: ${resolvedPdfPath}`);
  }

  console.log(`\n======================================================`);
  console.log(`🚀 Processing Syllabus: ${path.basename(resolvedPdfPath)}`);
  console.log(`Subject: ${subject || "Auto-detect"} | Class Hint: ${classLevelHint || "Auto-detect"} | Board: ${board}`);
  console.log(`======================================================\n`);

  // 1. Run Python text extractor
  const pyScript = path.resolve(process.cwd(), "scripts/extract_syllabus_pdf.py");
  const pyCmd = `python3 "${pyScript}" "${resolvedPdfPath}" --json`;
  console.log(`[PyMuPDF] Extracting structured pages and tables...`);
  const rawPyOutput = execSync(pyCmd, { maxBuffer: 30 * 1024 * 1024, encoding: "utf-8" });
  const pyData = JSON.parse(rawPyOutput) as {
    totalPages: number;
    startPage: number;
    endPage: number;
    pages: Array<{ page: number; grade: string | null; content: string }>;
  };

  console.log(`[PyMuPDF] Found ${pyData.pages.length} SLO pages (from page ${pyData.startPage} to ${pyData.endPage} of ${pyData.totalPages}).`);

  // 2. Group pages by grade
  const gradeBuckets: Record<string, string[]> = {};

  for (const p of pyData.pages) {
    const g = p.grade || "DEFAULT";
    if (!gradeBuckets[g]) {
      gradeBuckets[g] = [];
    }
    gradeBuckets[g].push(`--- PAGE ${p.page} ---\n${p.content}`);
  }

  const allCurriculums: ExtractedCurriculum[] = [];

  // 3. Extract each grade section with Gemini AI
  for (const [gradeKey, pageTexts] of Object.entries(gradeBuckets)) {
    const fullGradeText = pageTexts.join("\n\n");
    const targetClass = gradeKey !== "DEFAULT" ? gradeKey : classLevelHint;

    console.log(`\n[Gemini AI] Extracting syllabus for section: ${gradeKey} (${fullGradeText.length} chars)...`);

    // Chunk if large (> 12k chars) to ensure fast and reliable extraction
    if (fullGradeText.length > 12000) {
      console.log(`[Gemini AI] Section is large (${fullGradeText.length} chars), chunking into smaller segments...`);
      const chunks: string[] = [];
      let cur = "";
      for (const pt of pageTexts) {
        if ((cur + pt).length > 10000 && cur.length > 0) {
          chunks.push(cur);
          cur = pt;
        } else {
          cur += "\n\n" + pt;
        }
      }
      if (cur) chunks.push(cur);

      const combinedChaptersMap: Record<number, any> = {};
      let detectedClass = targetClass || "IX";

      for (let i = 0; i < chunks.length; i++) {
        console.log(`[Gemini AI] Processing chunk ${i + 1}/${chunks.length}...`);
        const chunkResult = await extractSyllabusFromText(chunks[i], {
          subject,
          classLevel: detectedClass,
          board,
        });

        for (const cur of chunkResult.curriculums) {
          detectedClass = cur.classLevel;
          for (const ch of cur.chapters) {
            if (!combinedChaptersMap[ch.chapterNumber]) {
              combinedChaptersMap[ch.chapterNumber] = ch;
            } else {
              combinedChaptersMap[ch.chapterNumber].subtopics.push(...ch.subtopics);
            }
          }
        }
      }

      const mergedCurriculum: ExtractedCurriculum = {
        classLevel: detectedClass,
        board,
        subject: subject || "Subject",
        chapters: Object.values(combinedChaptersMap).sort((a, b) => a.chapterNumber - b.chapterNumber),
      };
      allCurriculums.push(mergedCurriculum);
    } else {
      const result = await extractSyllabusFromText(fullGradeText, {
        subject,
        classLevel: targetClass,
        board,
      });
      allCurriculums.push(...result.curriculums);
    }
  }

  // Deduplicate and merge curriculums with the same classLevel
  const mergedByClass: Record<string, ExtractedCurriculum> = {};
  for (const cur of allCurriculums) {
    const key = cur.classLevel;
    if (!mergedByClass[key]) {
      mergedByClass[key] = { ...cur, chapters: [...cur.chapters] };
    } else {
      for (const ch of cur.chapters) {
        const existingCh = mergedByClass[key].chapters.find((c) => c.chapterNumber === ch.chapterNumber);
        if (!existingCh) {
          mergedByClass[key].chapters.push(ch);
        } else if (ch.subtopics && ch.subtopics.length > 0) {
          if (!existingCh.subtopics || existingCh.subtopics.length === 0) {
            existingCh.subtopics = [...ch.subtopics];
          } else {
            existingCh.subtopics.push(...ch.subtopics);
          }
        }
      }
    }
  }
  const finalCurriculums = Object.values(mergedByClass);

  console.log(`\n======================================================`);
  console.log(`✅ Extraction Complete! Total Curriculums: ${finalCurriculums.length}`);
  console.log(`======================================================\n`);

  for (const cur of finalCurriculums) {
    const totalSLOs = cur.chapters.reduce(
      (sum, ch) => sum + (ch.subtopics || []).reduce((subSum, st) => subSum + (st.slos?.length || 0), 0),
      0,
    );
    console.log(`• Class ${cur.classLevel} ${cur.subject}: ${cur.chapters.length} Chapters, ${totalSLOs} SLOs`);
  }

  if (isDryRun) {
    console.log(`\n[Dry Run] Skipping database save.`);
    return finalCurriculums.map((c) => ({
      curriculumId: "dry-run",
      classLevel: c.classLevel,
      board: c.board,
      subject: c.subject,
      chaptersCount: c.chapters.length,
      totalSLOsCount: 0,
      isNew: false,
    }));
  }

  // 4. Insert into Database
  console.log(`\n[Database] Upserting records into PostgreSQL...`);
  const results = await insertMultipleCurriculums(finalCurriculums, {
    fileUrl: pdfInput.startsWith("http") ? pdfInput : undefined,
    fileName: path.basename(resolvedPdfPath),
  });

  console.log(`\n======================================================`);
  console.log(`🎉 Ingestion Summary:`);
  console.table(
    results.map((r) => ({
      ID: r.curriculumId,
      Class: r.classLevel,
      Subject: r.subject,
      Chapters: r.chaptersCount,
      SLOs: r.totalSLOsCount,
      Status: r.isNew ? "Created" : "Updated",
    })),
  );
  console.log(`======================================================\n`);

  return results;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));

  const pdfInput = flags.pdf || flags.file || flags.url;
  const subject = flags.subject;
  const classLevelHint = flags.class || flags.grade;
  const board = flags.board || "AKUEB";
  const isDryRun = flags["dry-run"] === "true";
  const force = flags.force === "true";

  if (!pdfInput) {
    console.error(`
Usage:
  npx tsx scripts/auto-import-syllabus.ts --pdf <url|path> --subject <name> [--class <IX|X|XI|XII>] [--board AKUEB] [--force] [--dry-run]
`);
    process.exit(1);
  }

  await importSyllabus({
    pdfInput,
    subject,
    classLevelHint,
    board,
    isDryRun,
    force,
  });
}

if (process.argv[1] && process.argv[1].endsWith("auto-import-syllabus.ts")) {
  main().catch((err) => {
    console.error("Auto-import error:", err);
    process.exit(1);
  });
}
