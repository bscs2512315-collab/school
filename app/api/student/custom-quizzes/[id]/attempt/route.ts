import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import {
  ensureCustomQuizTable,
  getAccessibleQuiz,
} from "@/lib/custom-quiz";
import { awardStudentProgressPoints } from "@/lib/gamification/award-progress-points";
import type { CustomQuizAttemptResult } from "@/types/custom-quiz";

/**
 * POST /api/student/custom-quizzes/[id]/attempt
 * Grade a solve attempt for a custom quiz, update its stats, and award points.
 * Works for the owner practising their own quiz and for friends solving a
 * shared quiz. Body: { answers: Record<questionId, optionId> }
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

  let answers: Record<string, string>;
  try {
    const body = await request.json();
    answers =
      body?.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
        ? body.answers
        : {};
  } catch {
    return errorResponse("Invalid request body", 400);
  }

  try {
    await ensureCustomQuizTable();

    const access = await getAccessibleQuiz(id, user.userId);
    if (!access) {
      return errorResponse("Quiz not found", 404);
    }

    const { quiz, isOwner } = access;
    if (quiz.questions.length === 0) {
      return errorResponse("This quiz has no questions", 400);
    }

    const results = quiz.questions.map((question) => {
      const selected = answers[question.id];
      const selectedOptionId =
        typeof selected === "string" &&
        question.options.some((option) => option.id === selected)
          ? selected
          : null;
      return {
        questionId: question.id,
        selectedOptionId,
        correctOptionId: question.correctOptionId,
        isCorrect: selectedOptionId === question.correctOptionId,
      };
    });

    const score = results.filter((result) => result.isCorrect).length;
    const totalQuestions = quiz.questions.length;
    const percentage = Math.round((score / totalQuestions) * 10000) / 100;

    if (isOwner) {
      const bestScore = Math.max(quiz.bestScore ?? 0, percentage);
      await db.query(
        `UPDATE custom_quizzes
         SET attempt_count = attempt_count + 1,
             last_score = $1,
             best_score = $2,
             last_attempted_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND student_id = $4`,
        [percentage, bestScore, id, user.userId],
      );
    } else {
      // Solver is a friend the quiz was shared with — track their own stats
      // on the share row and mark it completed.
      await db.query(
        `UPDATE custom_quiz_shares
         SET status = 'COMPLETED',
             attempt_count = attempt_count + 1,
             last_score = $1,
             best_score = GREATEST(COALESCE(best_score, 0), $1),
             last_attempted_at = CURRENT_TIMESTAMP
         WHERE quiz_id = $2 AND shared_with_id = $3`,
        [percentage, id, user.userId],
      );
    }

    // Award points for solving (gamification), mirroring past-paper attempts.
    const { pointsAwarded } = await awardStudentProgressPoints(user.userId, {
      score,
      totalMarks: totalQuestions,
      percentage,
      paperType: "quiz",
      questionCount: totalQuestions,
    });

    const bestScore = isOwner
      ? Math.max(quiz.bestScore ?? 0, percentage)
      : percentage;

    const attemptResult: CustomQuizAttemptResult = {
      score,
      totalQuestions,
      percentage,
      bestScore,
      pointsAwarded,
      results,
    };

    return successResponse(attemptResult, "Attempt recorded");
  } catch (error) {
    console.error("Submit custom quiz attempt error:", error);
    return errorResponse("Failed to submit attempt", 500);
  }
}
