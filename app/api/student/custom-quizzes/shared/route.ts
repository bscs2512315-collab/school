import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ensureCustomQuizTable } from "@/lib/custom-quiz";
import type { SharedCustomQuiz } from "@/types/custom-quiz";

/**
 * GET /api/student/custom-quizzes/shared
 * List quizzes other students have shared (challenged) with the current user.
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    await ensureCustomQuizTable();

    const { rows } = await db.query(
      `SELECT cq.id, cq.title, cq.description, cq.subject, cq.questions,
              cq.created_at, cq.updated_at,
              s.status AS share_status,
              s.attempt_count, s.best_score, s.last_score, s.last_attempted_at,
              u.name AS owner_name, u.username AS owner_username, u.profile_image AS owner_image
       FROM custom_quiz_shares s
       JOIN custom_quizzes cq ON cq.id = s.quiz_id
       JOIN users u ON u.id = s.owner_id
       WHERE s.shared_with_id = $1
       ORDER BY s.created_at DESC`,
      [user.userId],
    );

    const quizzes: SharedCustomQuiz[] = rows.map((row) => {
      const questions = Array.isArray(row.questions) ? row.questions : [];
      const toNum = (v: string | null) => (v === null ? null : Number(v));
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        subject: row.subject,
        questionCount: questions.length,
        attemptCount: row.attempt_count ?? 0,
        bestScore: toNum(row.best_score),
        lastScore: toNum(row.last_score),
        lastAttemptedAt: row.last_attempted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ownerName: row.owner_name,
        ownerUsername: row.owner_username,
        ownerImage: row.owner_image,
        shareStatus: row.share_status,
      };
    });

    return successResponse(quizzes);
  } catch (error) {
    console.error("List shared custom quizzes error:", error);
    return errorResponse("Failed to load shared quizzes", 500);
  }
}
