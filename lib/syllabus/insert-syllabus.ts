import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import type { ExtractedCurriculum, ExtractedChapter } from "@/lib/ai/syllabus-extract";

export interface InsertSyllabusOptions {
  uploadedBy?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface InsertSyllabusResult {
  curriculumId: string;
  classLevel: string;
  board: string;
  subject: string;
  chaptersCount: number;
  totalSLOsCount: number;
  isNew: boolean;
}

/**
 * Inserts or updates syllabus curriculum and its chapters in PostgreSQL.
 */
export async function insertOrUpdateCurriculum(
  curriculum: ExtractedCurriculum,
  options?: InsertSyllabusOptions,
): Promise<InsertSyllabusResult> {
  const { classLevel, board, subject, chapters } = curriculum;

  if (!classLevel || !subject) {
    throw new Error(`Invalid curriculum: classLevel=${classLevel}, subject=${subject}`);
  }

  // 1. Check if curriculum already exists
  const { rows: existingCurriculums } = await db.query(
    `SELECT id FROM curriculums WHERE class = $1 AND board = $2 AND subject = $3`,
    [classLevel, board || "AKUEB", subject],
  );

  let curriculumId: string;
  let isNew = false;

  const curriculumAnalyzedContent = JSON.stringify({
    totalChapters: chapters.length,
    updatedAt: new Date().toISOString(),
  });

  if (existingCurriculums.length > 0) {
    curriculumId = existingCurriculums[0].id;
    await db.query(
      `UPDATE curriculums 
       SET analyzed_content = $1,
           file_url = COALESCE($2, file_url),
           file_name = COALESCE($3, file_name),
           updated_at = NOW()
       WHERE id = $4`,
      [curriculumAnalyzedContent, options?.fileUrl || null, options?.fileName || null, curriculumId],
    );
  } else {
    curriculumId = randomUUID();
    isNew = true;
    await db.query(
      `INSERT INTO curriculums (id, class, board, subject, file_url, file_name, analyzed_content, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        curriculumId,
        classLevel,
        board || "AKUEB",
        subject,
        options?.fileUrl || "",
        options?.fileName || `${subject} Class ${classLevel} Syllabus`,
        curriculumAnalyzedContent,
        options?.uploadedBy || null,
      ],
    );
  }

  let totalSLOsCount = 0;

  // 2. Process and Upsert Chapters
  for (const chapter of chapters) {
    const slosCount = chapter.subtopics.reduce((acc, st) => acc + (st.slos?.length || 0), 0);
    totalSLOsCount += slosCount;

    const analyzedContent = JSON.stringify({
      subtopics: chapter.subtopics,
      extractedAt: new Date().toISOString(),
    });

    // Check if chapter already exists by chapter_number
    const { rows: existingChapters } = await db.query(
      `SELECT id FROM chapters WHERE curriculum_id = $1 AND chapter_number = $2`,
      [curriculumId, chapter.chapterNumber],
    );

    if (existingChapters.length > 0) {
      const chapterId = existingChapters[0].id;
      if (chapter.subtopics.length === 0) {
        await db.query(
          `UPDATE chapters 
           SET chapter_name = COALESCE($1, chapter_name), updated_at = NOW()
           WHERE id = $2`,
          [chapter.chapterName, chapterId],
        );
      } else {
        await db.query(
          `UPDATE chapters 
           SET chapter_name = $1, analyzed_content = $2, updated_at = NOW()
           WHERE id = $3`,
          [chapter.chapterName, analyzedContent, chapterId],
        );
      }
    } else {
      const chapterId = randomUUID();
      await db.query(
        `INSERT INTO chapters (id, curriculum_id, chapter_number, chapter_name, analyzed_content)
         VALUES ($1, $2, $3, $4, $5)`,
        [chapterId, curriculumId, chapter.chapterNumber, chapter.chapterName, analyzedContent],
      );
    }
  }

  // 3. Ensure Subject Catalog is active and visible
  try {
    await db.query(
      `INSERT INTO subjects (name, coming_soon, is_active)
       VALUES ($1, false, true)
       ON CONFLICT (name) DO UPDATE
         SET coming_soon = false,
             is_active = true,
             updated_at = NOW()`,
      [subject],
    );
  } catch (err) {
    console.warn(`[insertSyllabus] Subject catalog update notice for "${subject}":`, err);
  }

  return {
    curriculumId,
    classLevel,
    board: board || "AKUEB",
    subject,
    chaptersCount: chapters.length,
    totalSLOsCount,
    isNew,
  };
}

/**
 * Batch insert multiple curriculums.
 */
export async function insertMultipleCurriculums(
  curriculums: ExtractedCurriculum[],
  options?: InsertSyllabusOptions,
): Promise<InsertSyllabusResult[]> {
  const results: InsertSyllabusResult[] = [];
  for (const c of curriculums) {
    const res = await insertOrUpdateCurriculum(c, options);
    results.push(res);
  }
  return results;
}
