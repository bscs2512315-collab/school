import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ensureCustomQuizTable } from "@/lib/custom-quiz";
import { createNotification } from "@/lib/notifications";
import type { QuizShareResult } from "@/types/custom-quiz";

/**
 * POST /api/student/custom-quizzes/[id]/share
 * Owner shares (challenges) friends with a quiz by username. Each recipient
 * gets a share row + an in-app notification linking to the solve page.
 * Body: { usernames: string[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const { id } = await params;

  let usernames: string[];
  try {
    const body = await request.json();
    usernames = Array.isArray(body?.usernames)
      ? body.usernames.map((u: unknown) => String(u).trim()).filter(Boolean)
      : [];
  } catch {
    return errorResponse("Invalid request body", 400);
  }

  if (usernames.length === 0) {
    return errorResponse("Add at least one friend to challenge", 400);
  }

  try {
    await ensureCustomQuizTable();

    // Only the owner can share their quiz.
    const { rows: quizRows } = await db.query(
      `SELECT id, title FROM custom_quizzes WHERE id = $1 AND student_id = $2`,
      [id, user.userId],
    );
    if (quizRows.length === 0) {
      return errorResponse("Quiz not found", 404);
    }
    const quizTitle = quizRows[0].title as string;

    const { rows: senderRows } = await db.query(
      `SELECT name FROM users WHERE id = $1`,
      [user.userId],
    );
    const senderName = senderRows[0]?.name || "A friend";

    const result: QuizShareResult = { invited: [], notFound: [], alreadyShared: [] };

    for (const username of usernames) {
      const { rows: targetRows } = await db.query(
        `SELECT id, name, username FROM users WHERE username = $1 AND id != $2`,
        [username, user.userId],
      );
      if (targetRows.length === 0) {
        result.notFound.push(username);
        continue;
      }

      const target = targetRows[0];
      const insert = await db.query(
        `INSERT INTO custom_quiz_shares (quiz_id, owner_id, shared_with_id, status)
         VALUES ($1, $2, $3, 'PENDING')
         ON CONFLICT (quiz_id, shared_with_id) DO NOTHING
         RETURNING id`,
        [id, user.userId, target.id],
      );

      if (insert.rowCount === 0) {
        result.alreadyShared.push(username);
        continue;
      }

      result.invited.push(username);

      createNotification({
        userId: target.id,
        type: "CHALLENGE_INVITE",
        title: "Quiz Challenge! ⚔️",
        message: `${senderName} challenged you with the quiz "${quizTitle}"`,
        link: `/student/custom-quizzes/${id}/solve`,
        metadata: { quizId: id, ownerId: user.userId },
      }).catch((err) => console.error("Failed to send quiz share notification:", err));
    }

    return successResponse(result, "Quiz shared");
  } catch (error) {
    console.error("Share custom quiz error:", error);
    return errorResponse("Failed to share quiz", 500);
  }
}
