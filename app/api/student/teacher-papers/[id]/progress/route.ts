import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ensureClassroomSchema } from "@/lib/teacher/classroom-schema";
import { resolveStudentAssignedPaper } from "@/lib/paper/variant-assignment";

/**
 * PUT /api/student/teacher-papers/[id]/progress
 * Save intermediate attempt progress (answers, question index, time left)
 * when allow_resume is enabled on the teacher paper.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user || (user.role !== UserRole.STUDENT && user.role !== UserRole.QA && user.role !== "QA")) {
      return errorResponse("Unauthorized", 401);
    }

    await ensureClassroomSchema();
    const { id: paperId } = await params;
    const body = await req.json();

    const {
      answers = {},
      currentQuestionIndex = 0,
      timeLeft = 0,
      timeSpent = 0,
    } = body;

    const { rows } = await db.query(
      `SELECT * FROM teacher_papers WHERE id = $1`,
      [paperId],
    );
    if (!rows.length) {
      return errorResponse("Paper not found", 404);
    }

    const resolved = await resolveStudentAssignedPaper(
      user.userId,
      rows[0] as any,
    );
    const paper = resolved.paper as any;

    // Progress saving is permitted for student practice attempts


    const { rows: savedRows } = await db.query(
      `INSERT INTO teacher_paper_progress
         (user_id, teacher_paper_id, answers_data, current_question_index, time_left, time_spent, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'in_progress', NOW())
       ON CONFLICT (user_id, teacher_paper_id)
       DO UPDATE SET
         answers_data = EXCLUDED.answers_data,
         current_question_index = EXCLUDED.current_question_index,
         time_left = EXCLUDED.time_left,
         time_spent = EXCLUDED.time_spent,
         status = 'in_progress',
         updated_at = NOW()
       RETURNING id, updated_at`,
      [
        user.userId,
        paper.id,
        JSON.stringify(answers),
        Math.max(0, Number(currentQuestionIndex) || 0),
        Math.max(0, Number(timeLeft) || 0),
        Math.max(0, Number(timeSpent) || 0),
      ],
    );

    return successResponse(
      {
        progressId: savedRows[0]?.id,
        updatedAt: savedRows[0]?.updated_at,
      },
      "Exam progress saved successfully",
    );
  } catch (error) {
    console.error("Save exam progress error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * DELETE /api/student/teacher-papers/[id]/progress
 * Clear saved progress for the current student and paper.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user || (user.role !== UserRole.STUDENT && user.role !== UserRole.QA && user.role !== "QA")) {
      return errorResponse("Unauthorized", 401);
    }

    await ensureClassroomSchema();
    const { id: paperId } = await params;

    const { rows } = await db.query(
      `SELECT * FROM teacher_papers WHERE id = $1`,
      [paperId],
    );
    if (!rows.length) {
      return errorResponse("Paper not found", 404);
    }

    const resolved = await resolveStudentAssignedPaper(
      user.userId,
      rows[0] as any,
    );
    const paper = resolved.paper as any;

    await db.query(
      `DELETE FROM teacher_paper_progress WHERE user_id = $1 AND teacher_paper_id = $2`,
      [user.userId, paper.id],
    );

    return successResponse(null, "Exam progress cleared");
  } catch (error) {
    console.error("Clear exam progress error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
