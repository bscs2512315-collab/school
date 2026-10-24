import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import {
  ensureCustomQuizTable,
  mapCustomQuizRow,
  validateCustomQuizPayload,
} from "@/lib/custom-quiz";

/**
 * GET /api/student/custom-quizzes
 * List the authenticated student's custom quizzes (without full questions).
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    await ensureCustomQuizTable();

    const { rows } = await db.query(
      `SELECT * FROM custom_quizzes
       WHERE student_id = $1
       ORDER BY created_at DESC`,
      [user.userId],
    );

    const quizzes = rows.map((row) => {
      const { questions, ...summary } = mapCustomQuizRow(row as never);
      void questions;
      return summary;
    });

    return successResponse(quizzes);
  } catch (error) {
    console.error("List custom quizzes error:", error);
    return errorResponse("Failed to load quizzes", 500);
  }
}

/**
 * POST /api/student/custom-quizzes
 * Create a new custom quiz for the authenticated student.
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  let payload;
  try {
    payload = validateCustomQuizPayload(await request.json());
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Invalid quiz data", 400);
  }

  try {
    await ensureCustomQuizTable();

    const { rows } = await db.query(
      `INSERT INTO custom_quizzes (student_id, title, description, subject, questions)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING *`,
      [
        user.userId,
        payload.title,
        payload.description ?? null,
        payload.subject ?? null,
        JSON.stringify(payload.questions),
      ],
    );

    return successResponse(mapCustomQuizRow(rows[0] as never), "Quiz created", 201);
  } catch (error) {
    console.error("Create custom quiz error:", error);
    return errorResponse("Failed to create quiz", 500);
  }
}
