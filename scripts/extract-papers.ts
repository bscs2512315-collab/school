/**
 * Batch past-paper extraction (Gemini free tier).
 *
 * Walks a manifest of PDFs, runs the SAME multimodal extraction + shared insert
 * path as the in-app flow, and writes questions as UNVERIFIED so they land in
 * the admin review UI. Designed to be re-run: papers that already have
 * questions are skipped, so a nightly run naturally resumes where a quota-
 * exhausted run left off.
 *
 * Usage:
 *   npx tsx scripts/extract-papers.ts <manifest.json> [--dir=./papers] [--force] [--delay=4000]
 *
 * manifest.json:
 *   [
 *     { "file": "bio-xi-2025-p1.pdf", "class": "XI", "board": "AKUEB",
 *       "subject": "Biology", "year": 2025, "paperNumber": 1 },
 *     ...
 *   ]
 *
 * Notes:
 * - `file` is resolved relative to --dir (default: manifest's own folder).
 * - The subject's curriculum/chapters must already be seeded, or chapter
 *   mapping has nothing to match against.
 * - Requires DATABASE_URL and GEMINI_API_KEY in .env.
 */

// Load env BEFORE importing anything that reads process.env at module load
// (e.g. @/lib/db constructs its pool eagerly from DATABASE_URL).
import "dotenv/config";

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { parsePDF } from "@/lib/pdf/parser";
import { extractQuestions } from "@/lib/ai/past-paper-extract";
import { normalizeScientificNotation } from "@/lib/scientific-notation/normalize";
import {
  insertExtractedQuestions,
  type ExtractedQuestionInput,
} from "@/lib/past-paper/insert-extracted";
import { PastPaperStatus } from "@/types/admin";

interface ManifestEntry {
  file: string;
  class: string;
  board: string;
  subject: string;
  year: number;
  paperNumber: number;
}

interface ChapterRow {
  id: string;
  chapter_number: number;
  chapter_name: string;
  content: string | null;
}

const QUOTA_MARKERS = ["429", "quota", "rate limit", "Quota exceeded"];

function isQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return QUOTA_MARKERS.some((m) => msg.toLowerCase().includes(m.toLowerCase()));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      flags[key] = value === undefined ? true : value;
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

/** Mirror of the chapter matching used by the in-app upload route. */
function matchChapterId(
  chapters: ChapterRow[],
  suggested: string | undefined | null,
): { id: string | null; name: string | null } {
  if (!suggested) return { id: null, name: null };
  const lower = suggested.toLowerCase();

  let match = chapters.find((c) => c.chapter_name.toLowerCase() === lower);
  if (!match) {
    match = chapters.find(
      (c) =>
        c.chapter_name.toLowerCase().includes(lower) ||
        lower.includes(c.chapter_name.toLowerCase()),
    );
  }
  return {
    id: match?.id ?? null,
    name: match?.chapter_name ?? suggested,
  };
}

async function getAdminUserId(): Promise<string | null> {
  try {
    const { rows } = await db.query<{ id: string }>(
      `SELECT id FROM users WHERE role = 'ADMIN' ORDER BY created_at ASC LIMIT 1`,
    );
    return rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function processEntry(
  entry: ManifestEntry,
  baseDir: string,
  uploadedBy: string | null,
  force: boolean,
): Promise<"created" | "skipped" | "failed" | "quota"> {
  const label = `${entry.subject} ${entry.class}/${entry.board} ${entry.year} P${entry.paperNumber}`;
  const filePath = path.isAbsolute(entry.file)
    ? entry.file
    : path.join(baseDir, entry.file);

  if (!fs.existsSync(filePath)) {
    console.error(`  ✗ ${label}: file not found (${filePath})`);
    return "failed";
  }

  // Resume logic: does this paper already exist / already have questions?
  const { rows: existingRows } = await db.query<{ id: string; count: string }>(
    `SELECT p.id, COUNT(q.id) AS count
     FROM past_papers p
     LEFT JOIN questions q ON q.past_paper_id = p.id
     WHERE p.class = $1 AND p.board = $2 AND p.subject = $3 AND p.year = $4 AND p.paper_number = $5
     GROUP BY p.id`,
    [entry.class, entry.board, entry.subject, entry.year, entry.paperNumber],
  );
  const existing = existingRows[0];

  if (existing && Number(existing.count) > 0 && !force) {
    console.log(`  ⏭  ${label}: already has ${existing.count} questions — skipping`);
    return "skipped";
  }

  // Load curriculum chapters for mapping.
  const { rows: chapterRows } = await db.query<ChapterRow>(
    `SELECT ch.id, ch.chapter_number, ch.chapter_name, ch.content
     FROM chapters ch
     JOIN curriculums c ON ch.curriculum_id = c.id
     WHERE c.class = $1 AND c.board = $2 AND c.subject = $3
     ORDER BY ch.chapter_number ASC`,
    [entry.class, entry.board, entry.subject],
  );

  if (chapterRows.length === 0) {
    console.warn(
      `  ⚠  ${label}: no curriculum chapters found — extracting without chapter mapping`,
    );
  }

  // Read + prepare the PDF.
  const buffer = fs.readFileSync(filePath);
  const pdfText = normalizeScientificNotation(await parsePDF(buffer));
  const pdfInput = { data: buffer.toString("base64"), mimeType: "application/pdf" };

  const curriculumChapters = chapterRows.map((ch) => ({
    chapterNumber: ch.chapter_number,
    chapterName: ch.chapter_name,
    description: ch.content ? ch.content.substring(0, 200) : undefined,
  }));

  // Extract (multimodal). Let quota errors bubble so the caller can stop cleanly.
  let aiQuestions;
  try {
    aiQuestions = await extractQuestions(
      pdfText,
      curriculumChapters,
      entry.paperNumber,
      pdfInput,
    );
  } catch (error) {
    if (isQuotaError(error)) return "quota";
    console.error(`  ✗ ${label}: extraction failed —`, (error as Error).message);
    return "failed";
  }

  if (!aiQuestions.length) {
    console.warn(`  ⚠  ${label}: 0 questions extracted`);
    return "failed";
  }

  const questions: ExtractedQuestionInput[] = aiQuestions.map((q) => {
    const chapter = matchChapterId(chapterRows, q.suggestedChapter);
    return {
      questionNumber: q.questionNumber,
      questionPart: q.questionPart ?? null,
      questionText: normalizeScientificNotation(q.questionText),
      questionType: q.questionType as ExtractedQuestionInput["questionType"],
      chapterId: chapter.id,
      chapterName: chapter.name,
      mcqOptions: q.mcqOptions?.map((o) => ({
        id: o.id,
        text: normalizeScientificNotation(o.text),
      })),
      correctAnswer: q.correctAnswer ?? null,
    };
  });

  // Ensure a past_papers row exists (create if needed).
  let pastPaperId = existing?.id;
  if (!pastPaperId) {
    pastPaperId = randomUUID();
    await db.query(
      `INSERT INTO past_papers (id, class, board, subject, year, paper_number, file_url, file_name, status, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        pastPaperId,
        entry.class,
        entry.board,
        entry.subject,
        entry.year,
        entry.paperNumber,
        filePath, // local source path; batch backfill doesn't push the PDF to Cloudinary
        path.basename(filePath),
        PastPaperStatus.ANALYZING,
        uploadedBy,
      ],
    );
  }

  // Insert as UNVERIFIED → shows up in the admin review UI.
  await insertExtractedQuestions(pastPaperId, questions, {
    verified: false,
    replaceExisting: true,
    updatePaperStatus: PastPaperStatus.PENDING,
  });

  const withImages = aiQuestions.filter((q) => q.hasImage).length;
  console.log(
    `   ${label}: ${questions.length} questions inserted (unverified)` +
      (withImages ? `, ${withImages} flagged as needing a figure` : ""),
  );
  return "created";
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const manifestPath = positional[0];

  if (!manifestPath) {
    console.error(
      "Usage: npx tsx scripts/extract-papers.ts <manifest.json> [--dir=./papers] [--force] [--delay=4000]",
    );
    process.exit(1);
  }
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in .env");
    process.exit(1);
  }

  const manifest: ManifestEntry[] = JSON.parse(
    fs.readFileSync(manifestPath, "utf-8"),
  );
  const baseDir =
    typeof flags.dir === "string" ? flags.dir : path.dirname(manifestPath);
  const force = Boolean(flags.force);
  const delayMs = typeof flags.delay === "string" ? parseInt(flags.delay) : 4000;

  const uploadedBy = await getAdminUserId();

  console.log(
    `Extracting ${manifest.length} paper(s) from ${baseDir} (delay ${delayMs}ms, force=${force})\n`,
  );

  const summary = { created: 0, skipped: 0, failed: 0 };

  for (let i = 0; i < manifest.length; i++) {
    const entry = manifest[i];
    console.log(`[${i + 1}/${manifest.length}]`);

    let result = await processEntry(entry, baseDir, uploadedBy, force);

    // One backoff-and-retry on quota, then stop cleanly so the next run resumes.
    if (result === "quota") {
      console.warn("  … quota hit, backing off 60s before one retry");
      await sleep(60_000);
      result = await processEntry(entry, baseDir, uploadedBy, force);
      if (result === "quota") {
        console.error(
          "\nGemini quota exhausted. Stopping — re-run later to resume (finished papers are skipped).",
        );
        break;
      }
    }

    if (result === "created") summary.created++;
    else if (result === "skipped") summary.skipped++;
    else summary.failed++;

    if (i < manifest.length - 1 && result === "created") {
      await sleep(delayMs);
    }
  }

  console.log(
    `\nDone. created=${summary.created} skipped=${summary.skipped} failed=${summary.failed}`,
  );
  await db.pool.end();
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
