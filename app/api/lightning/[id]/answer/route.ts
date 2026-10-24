import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/response-handlers";
import {
  calculateSpeedScore,
  ensureLightningSchema,
  type LightningQuestion,
} from "@/lib/lightning/lightning-schema";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: sessionId } = await params;
    const auth = await getUserFromRequest(request);
    const body = await request.json();

    const {
      userId: bodyUserId,
      questionIndex,
      selectedOption,
      timeTakenMs = 3000,
    } = body;

    const currentUserId = auth?.userId || bodyUserId;
    if (!currentUserId) {
      return errorResponse("User ID is required to submit answer", 401);
    }

    if (selectedOption === undefined || questionIndex === undefined) {
      return errorResponse("Question index and selected option are required", 400);
    }

    await ensureLightningSchema();

    // Fetch session
    const { rows: sessionRows } = await db.query<{
      id: string;
      creator_id: string;
      creator_role: string;
      status: string;
      phase: string;
      per_question_seconds: number;
      current_question_index: number;
      current_question_started_at: string | null;
      updated_at: string | null;
      paper_data: LightningQuestion[];
    }>(`SELECT * FROM lightning_sessions WHERE id = $1`, [sessionId]);

    if (sessionRows.length === 0) {
      return errorResponse("Lightning Round session not found", 404);
    }

    const session = sessionRows[0];

    // Teachers host the session and cannot attempt questions
    if (
      (session.creator_role === "TEACHER" && session.creator_id === currentUserId) ||
      auth?.role?.toUpperCase() === "TEACHER"
    ) {
      return errorResponse("Teachers host the session and cannot attempt questions", 403);
    }

    if (session.status !== "ACTIVE") {
      return errorResponse("Session is not active", 400);
    }

    if (session.phase !== "QUESTION") {
      // 1.5s buzzer-beater grace period: if the question just transitioned to REVEAL within the last 1500ms,
      // and the answer matches the current question index, gracefully accept it rather than failing the user!
      const updatedAtMs = session.updated_at ? new Date(session.updated_at).getTime() : 0;
      const isWithinGracePeriod =
        session.phase === "REVEAL" &&
        Date.now() - updatedAtMs <= 1500 &&
        Number(questionIndex) === session.current_question_index;

      if (!isWithinGracePeriod) {
        return errorResponse("Answering is currently closed for this question", 400);
      }
    }

    if (Number(questionIndex) !== session.current_question_index) {
      return errorResponse("Question index out of sync", 400);
    }

    const questions: LightningQuestion[] = session.paper_data || [];
    const question = questions[session.current_question_index];
    if (!question) {
      return errorResponse("Question data not found", 404);
    }

    // Check if participant already answered
    const { rows: existingAnswers } = await db.query<{ id: string; points_earned: number }>(
      `SELECT id, points_earned FROM lightning_answers WHERE session_id = $1 AND user_id = $2 AND question_index = $3`,
      [sessionId, currentUserId, session.current_question_index],
    );

    if (existingAnswers.length > 0) {
      return successResponse({
        message: "Answer already recorded",
        alreadyAnswered: true,
        pointsEarned: existingAnswers[0].points_earned,
      });
    }

    // Fetch current participant streak
    const { rows: partRows } = await db.query<{
      id: string;
      streak: number;
      total_points: number;
      highest_streak: number;
      correct_count: number;
    }>(
      `SELECT id, streak, total_points, highest_streak, correct_count 
       FROM lightning_participants 
       WHERE session_id = $1 AND user_id = $2`,
      [sessionId, currentUserId],
    );

    if (partRows.length === 0) {
      return errorResponse("Participant not registered in this session", 403);
    }

    const participant = partRows[0];
    const cleanSelected = String(selectedOption).trim().toUpperCase();
    const correctOption = String(question.correctOptionId || "A").trim().toUpperCase();

    // Check correctness: either matched option letter ('A' === 'A') or matched option ID/text
    const isCorrect =
      cleanSelected === correctOption ||
      question.options.some(
        (o) =>
          (o.id.toUpperCase() === cleanSelected || o.text.trim().toUpperCase() === cleanSelected) &&
          (o.id.toUpperCase() === correctOption || o.text.trim().toUpperCase() === correctOption),
      );

    // Calculate speed score & streaks
    const scoreResult = calculateSpeedScore(
      isCorrect,
      Number(timeTakenMs),
      session.per_question_seconds,
      participant.streak,
    );

    // Record answer
    await db.query(
      `INSERT INTO lightning_answers (
        session_id, user_id, question_index, selected_option, is_correct, time_taken_ms, points_earned, streak_after
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (session_id, user_id, question_index) DO NOTHING`,
      [
        sessionId,
        currentUserId,
        session.current_question_index,
        cleanSelected,
        isCorrect,
        Number(timeTakenMs),
        scoreResult.points,
        scoreResult.newStreak,
      ],
    );

    // Update participant scores
    const newTotalPoints = participant.total_points + scoreResult.points;
    const newHighestStreak = Math.max(participant.highest_streak, scoreResult.newStreak);
    const newCorrectCount = participant.correct_count + (isCorrect ? 1 : 0);

    await db.query(
      `UPDATE lightning_participants 
       SET total_points = $1, 
           streak = $2, 
           highest_streak = $3, 
           correct_count = $4, 
           last_active_at = NOW() 
       WHERE id = $5`,
      [newTotalPoints, scoreResult.newStreak, newHighestStreak, newCorrectCount, participant.id],
    );

    // If all participants have answered, advance to REVEAL immediately without waiting
    const { rows: countRows } = await db.query<{
      participant_count: string;
      answer_count: string;
    }>(
      `SELECT 
         (SELECT COUNT(*) FROM lightning_participants WHERE session_id = $1) AS participant_count,
         (SELECT COUNT(*) FROM lightning_answers WHERE session_id = $1 AND question_index = $2) AS answer_count`,
      [sessionId, session.current_question_index],
    );
    const pCount = parseInt(countRows[0]?.participant_count || "0", 10);
    const aCount = parseInt(countRows[0]?.answer_count || "0", 10);

    if (pCount > 0 && aCount >= pCount) {
      await db.query(
        `UPDATE lightning_sessions 
         SET phase = 'REVEAL', updated_at = NOW() 
         WHERE id = $1 AND phase = 'QUESTION' AND current_question_index = $2`,
        [sessionId, session.current_question_index],
      );
    }

    return successResponse({
      isCorrect,
      pointsEarned: scoreResult.points,
      streakBonus: scoreResult.streakBonus,
      streak: scoreResult.newStreak,
      streakMessage: scoreResult.streakMessage,
      newTotalPoints,
    });
  } catch (error: any) {
    console.error("Error submitting answer to lightning session:", error);
    return errorResponse(error?.message || "Internal server error submitting answer", 500);
  }
}
