import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import {
  ensureCustomQuizTable,
  getAccessibleQuiz,
  mapCustomQuizRow,
  validateCustomQuizPayload,
} from "@/lib/custom-quiz";

/**
 * GET /api/student/custom-quizzes/[id]
 * Fetch a single custom quiz (with questions). Accessible to the owner or a
 * student the quiz has been shared with. `isOwner` tells the client whether
 * edit/delete/share controls should show.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const { id } = await params;

  try {
    await ensureCustomQuizTable();

    const access = await getAccessibleQuiz(id, user.userId);
    if (!access) {
      return errorResponse("Quiz not found", 404);
    }

    return successResponse({ ...access.quiz, isOwner: access.isOwner });
  } catch (error) {
    console.error("Fetch custom quiz error:", error);
    return errorResponse("Failed to load quiz", 500);
  }
}

/**
 * PUT /api/student/custom-quizzes/[id]
 * Update a custom quiz owned by the student.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const { id } = await params;

  let payload;
  try {
    payload = validateCustomQuizPayload(await request.json());
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Invalid quiz data", 400);
  }

  try {
    await ensureCustomQuizTable();

    const { rows } = await db.query(
      `UPDATE custom_quizzes
       SET title = $1,
           description = $2,
           subject = $3,
           questions = $4::jsonb,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND student_id = $6
       RETURNING *`,
      [
        payload.title,
        payload.description ?? null,
        payload.subject ?? null,
        JSON.stringify(payload.questions),
        id,
        user.userId,
      ],
    );

    if (rows.length === 0) {
      return errorResponse("Quiz not found", 404);
    }

    return successResponse(mapCustomQuizRow(rows[0] as never), "Quiz updated");
  } catch (error) {
    console.error("Update custom quiz error:", error);
    return errorResponse("Failed to update quiz", 500);
  }
}

/**
 * DELETE /api/student/custom-quizzes/[id]
 * Delete a custom quiz owned by the student.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const { id } = await params;

  try {
    await ensureCustomQuizTable();

    const { rowCount } = await db.query(
      `DELETE FROM custom_quizzes WHERE id = $1 AND student_id = $2`,
      [id, user.userId],
    );

    if (!rowCount) {
      return errorResponse("Quiz not found", 404);
    }

    return successResponse(null, "Quiz deleted");
  } catch (error) {
    console.error("Delete custom quiz error:", error);
    return errorResponse("Failed to delete quiz", 500);
  }
}
