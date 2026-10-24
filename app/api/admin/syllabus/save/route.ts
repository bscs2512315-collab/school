import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { randomUUID } from "crypto";

/**
 * POST /api/admin/syllabus/save
 * Saves a structured syllabus into the database
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const body = await request.json();
    const { classLevel, board, subject, syllabusYear, chapters } = body;

    if (
      !classLevel ||
      !board ||
      !subject ||
      !chapters ||
      !Array.isArray(chapters)
    ) {
      return errorResponse("Missing required fields", 400);
    }

    // Check if curriculum exists or create it
    let curriculumId: string;
    const { rows: existingCurriculums } = await db.query(
      `SELECT id FROM curriculums WHERE class = $1 AND board = $2 AND subject = $3`,
      [classLevel, board, subject],
    );

    if (existingCurriculums.length > 0) {
      curriculumId = existingCurriculums[0].id;
      // Update updated_at
      await db.query(
        `UPDATE curriculums SET updated_at = NOW() WHERE id = $1`,
        [curriculumId],
      );
    } else {
      curriculumId = randomUUID();
      await db.query(
        `INSERT INTO curriculums (id, class, board, subject, uploaded_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [curriculumId, classLevel, board, subject, admin.userId],
      );
    }

    // Process chapters
    for (const chapter of chapters) {
      // Check if chapter exists for this curriculum
      const { rows: existingChapters } = await db.query(
        `SELECT id FROM chapters WHERE curriculum_id = $1 AND chapter_number = $2`,
        [curriculumId, chapter.chapterNumber],
      );

      let chapterId: string;
      const analyzedContent = JSON.stringify({
        subtopics: chapter.subtopics,
        extractedAt: new Date(),
      });

      if (existingChapters.length > 0) {
        chapterId = existingChapters[0].id;
        // Update existing chapter
        await db.query(
          `UPDATE chapters 
           SET chapter_name = $1, analyzed_content = $2, updated_at = NOW()
           WHERE id = $3`,
          [chapter.chapterName, analyzedContent, chapterId],
        );
      } else {
        chapterId = randomUUID();
        // Insert new chapter
        await db.query(
          `INSERT INTO chapters (id, curriculum_id, chapter_number, chapter_name, analyzed_content)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            chapterId,
            curriculumId,
            chapter.chapterNumber,
            chapter.chapterName,
            analyzedContent,
          ],
        );
      }
    }

    return successResponse(
      { curriculumId },
      "Syllabus saved successfully",
      201,
    );
  } catch (error) {
    console.error("Syllabus save error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      500,
    );
  }
}
