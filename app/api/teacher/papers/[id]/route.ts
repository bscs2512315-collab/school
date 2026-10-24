import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ensureClassroomSchema } from "@/lib/teacher/classroom-schema";
import { parsePaperVariant } from "@/lib/paper/variant-parser";

interface ChapterMeta {
  id: string;
  chapterNumber: number;
  chapterName: string;
  curriculumId: string;
}

async function resolveChapters(chapterIds: unknown): Promise<ChapterMeta[]> {
  if (!Array.isArray(chapterIds) || chapterIds.length === 0) return [];
  try {
    const validUuids = chapterIds.filter(
      (id) => typeof id === "string" && id.length > 0,
    );
    if (validUuids.length === 0) return [];
    const { rows } = await db.query(
      `SELECT id, chapter_number AS "chapterNumber", chapter_name AS "chapterName", curriculum_id AS "curriculumId"
       FROM chapters
       WHERE id = ANY($1::uuid[])
       ORDER BY chapter_number ASC`,
      [validUuids],
    );
    return rows as ChapterMeta[];
  } catch (err) {
    console.error("Error resolving chapters:", err);
    return [];
  }
}

/**
 * GET /api/teacher/papers/[id]
 * Fetch a teacher paper with its complete questions snapshot, solutions, and aligned syllabus chapters.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    await ensureClassroomSchema();
    const { id: paperId } = await params;

    const { rows } = await db.query(
      `SELECT id, teacher_id, classroom_id, title, description, paper_type, subject, class_level, board,
              chapter_ids, question_ids, questions_snapshot, total_marks, total_questions, due_date, created_at,
              strict_mode, allow_resume
       FROM teacher_papers
       WHERE id = $1 AND teacher_id = $2`,
      [paperId, user.userId],
    );

    if (!rows.length) {
      return errorResponse("Paper not found", 404);
    }

    const row = rows[0];
    const snapshotRaw = row.questions_snapshot;
    const questions =
      typeof snapshotRaw === "string" ? JSON.parse(snapshotRaw) : snapshotRaw || [];

    const chapters = await resolveChapters(row.chapter_ids);

    return successResponse(
      {
        id: row.id,
        classroomId: row.classroom_id,
        title: row.title,
        description: row.description,
        paperType: row.paper_type,
        subject: row.subject,
        classLevel: row.class_level,
        board: row.board,
        totalMarks: row.total_marks,
        totalQuestions: row.total_questions,
        dueDate: row.due_date,
        createdAt: row.created_at,
        chapterIds: row.chapter_ids,
        chapters,
        strictMode:
          row.strict_mode !== null && row.strict_mode !== undefined
            ? Boolean(row.strict_mode)
            : true,
        allowResume: Boolean(row.allow_resume),
        questions,
      },
      "Teacher paper fetched with solutions",
    );
  } catch (error: unknown) {
    console.error("Fetch teacher paper error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}

/**
 * PATCH /api/teacher/papers/[id]
 * Allow teacher to set a custom name (title), align/re-align chapters, and toggle quiz controls (strictMode, allowResume).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    await ensureClassroomSchema();
    const { id: paperId } = await params;
    const body = await req.json();

    const {
      title,
      description,
      chapterIds,
      dueDate,
      strictMode,
      allowResume,
      applyToAllSets,
    } = body;

    // Check paper ownership
    const { rows: existing } = await db.query(
      `SELECT id, teacher_id, classroom_id, title, chapter_ids, questions_snapshot FROM teacher_papers WHERE id = $1 AND teacher_id = $2`,
      [paperId, user.userId],
    );

    if (!existing.length) {
      return errorResponse("Paper not found or access denied", 404);
    }

    const updates: string[] = [];
    const values: unknown[] = [paperId, user.userId];
    let idx = 3;

    if (typeof title === "string" && title.trim().length > 0) {
      updates.push(`title = $${idx++}`);
      values.push(title.trim());
    }

    if (typeof description === "string") {
      updates.push(`description = $${idx++}`);
      values.push(description.trim());
    }

    if (Array.isArray(chapterIds)) {
      updates.push(`chapter_ids = $${idx++}::jsonb`);
      values.push(JSON.stringify(chapterIds));
    }

    if (dueDate !== undefined) {
      updates.push(`due_date = $${idx++}`);
      values.push(dueDate ? new Date(dueDate) : null);
    }

    if (typeof strictMode === "boolean") {
      updates.push(`strict_mode = $${idx++}`);
      values.push(strictMode);
    }

    if (typeof allowResume === "boolean") {
      updates.push(`allow_resume = $${idx++}`);
      values.push(allowResume);
    }

    if (updates.length === 0) {
      return errorResponse("No valid fields provided for update", 400);
    }

    const query = `
      UPDATE teacher_papers
      SET ${updates.join(", ")}
      WHERE id = $1 AND teacher_id = $2
      RETURNING id, classroom_id, title, description, paper_type, subject, class_level, board,
                chapter_ids, question_ids, total_marks, total_questions, due_date, created_at,
                strict_mode, allow_resume
    `;

    const { rows: updatedRows } = await db.query(query, values);
    const updated = updatedRows[0];
    const chapters = await resolveChapters(updated.chapter_ids);

    let affectedPaperIds: string[] = [paperId];
    if (applyToAllSets && existing[0]?.classroom_id && dueDate !== undefined) {
      try {
        const { rows: classroomPapers } = await db.query(
          `SELECT id, title FROM teacher_papers WHERE classroom_id = $1 AND teacher_id = $2`,
          [existing[0].classroom_id, user.userId],
        );
        const currentBase = parsePaperVariant(existing[0].title || "").baseTitle.toLowerCase().trim();
        const matchingIds = classroomPapers
          .filter(
            (p) =>
              parsePaperVariant(p.title || "").baseTitle.toLowerCase().trim() ===
              currentBase,
          )
          .map((p) => p.id);

        if (matchingIds.length > 0) {
          affectedPaperIds = Array.from(new Set([paperId, ...matchingIds]));
          const targetDate = dueDate ? new Date(dueDate) : null;
          await db.query(
            `UPDATE teacher_papers SET due_date = $1 WHERE id = ANY($2::uuid[]) AND teacher_id = $3`,
            [targetDate, matchingIds, user.userId],
          );
        }
      } catch (cascadeErr) {
        console.error("Failed to cascade deadline to variant sets:", cascadeErr);
      }
    }

    return successResponse(
      {
        id: updated.id,
        classroomId: updated.classroom_id,
        title: updated.title,
        description: updated.description,
        paperType: updated.paper_type,
        subject: updated.subject,
        classLevel: updated.class_level,
        board: updated.board,
        totalMarks: updated.total_marks,
        totalQuestions: updated.total_questions,
        dueDate: updated.due_date,
        createdAt: updated.created_at,
        chapterIds: updated.chapter_ids,
        strictMode:
          updated.strict_mode !== null && updated.strict_mode !== undefined
            ? Boolean(updated.strict_mode)
            : true,
        allowResume: Boolean(updated.allow_resume),
        chapters,
        affectedPaperIds,
      },
      "Paper updated successfully",
    );
  } catch (error: unknown) {
    console.error("Update teacher paper error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
