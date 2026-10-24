import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/response-handlers";
import {
  ensureLightningSchema,
  finalizeLightningGameRewards,
  type LightningQuestion,
} from "@/lib/lightning/lightning-schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: sessionId } = await params;
    const auth = await getUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get("userId");
    const currentUserId = auth?.userId || queryUserId || "";

    await ensureLightningSchema();

    const { rows: sessionRows } = await db.query<{
      id: string;
      pin_code: string;
      creator_id: string;
      creator_role: string;
      title: string;
      subject: string;
      class_level: string;
      board: string;
      status: string;
      phase: string;
      source_mode: string;
      per_question_seconds: number;
      current_question_index: number;
      current_question_started_at: string | null;
      paper_data: LightningQuestion[];
      classroom_id: string | null;
      created_at: string;
      updated_at: string;
    }>(`SELECT * FROM lightning_sessions WHERE id = $1`, [sessionId]);

    if (sessionRows.length === 0) {
      return errorResponse("Lightning Round session not found", 404);
    }

    const session = sessionRows[0];
    const isHost = session.creator_id === currentUserId;
    const questions: LightningQuestion[] = session.paper_data || [];
    const totalQuestions = questions.length;
    let qIndex = session.current_question_index;

    // Server-side authoritative auto-progression (Kahoot style)
    // Ensures games never get stuck even if client tabs lag or drop packets
    const now = Date.now();
    if (session.status === "ACTIVE") {
      const updatedAtMs = session.updated_at ? new Date(session.updated_at).getTime() : now;
      const startedAtMs = session.current_question_started_at
        ? new Date(session.current_question_started_at).getTime()
        : now;

      // 1. QUESTION -> REVEAL
      if (session.phase === "QUESTION") {
        // Fetch participant and answer counts
        const { rows: countRows } = await db.query<{
          participant_count: string;
          answer_count: string;
        }>(
          `SELECT 
             (SELECT COUNT(*) FROM lightning_participants WHERE session_id = $1) AS participant_count,
             (SELECT COUNT(*) FROM lightning_answers WHERE session_id = $1 AND question_index = $2) AS answer_count`,
          [sessionId, qIndex],
        );
        const participantCount = parseInt(countRows[0]?.participant_count || "0", 10);
        const answerCount = parseInt(countRows[0]?.answer_count || "0", 10);

        const questionDurationMs = (session.per_question_seconds || 10) * 1000;
        const isTimeExpired = now - startedAtMs >= questionDurationMs;
        const allParticipantsAnswered = participantCount > 0 && answerCount >= participantCount;

        if (isTimeExpired || allParticipantsAnswered) {
          const updateRes = await db.query<{ phase: string; updated_at: string }>(
            `UPDATE lightning_sessions 
             SET phase = 'REVEAL', updated_at = NOW() 
             WHERE id = $1 AND phase = 'QUESTION' AND current_question_index = $2
             RETURNING phase, updated_at`,
            [sessionId, qIndex],
          );
          if (updateRes.rows.length > 0) {
            session.phase = "REVEAL";
            session.updated_at = updateRes.rows[0].updated_at;
          }
        }
      }
      // 2. REVEAL -> LEADERBOARD (Exactly 5 seconds)
      else if (session.phase === "REVEAL") {
        if (now - updatedAtMs >= 5000) {
          const updateRes = await db.query<{ phase: string; updated_at: string }>(
            `UPDATE lightning_sessions 
             SET phase = 'LEADERBOARD', updated_at = NOW() 
             WHERE id = $1 AND phase = 'REVEAL' AND current_question_index = $2
             RETURNING phase, updated_at`,
            [sessionId, qIndex],
          );
          if (updateRes.rows.length > 0) {
            session.phase = "LEADERBOARD";
            session.updated_at = updateRes.rows[0].updated_at;
          }
        }
      }
      // 3. LEADERBOARD -> NEXT QUESTION or PODIUM (Exactly 5 seconds)
      else if (session.phase === "LEADERBOARD") {
        if (now - updatedAtMs >= 5000) {
          if (qIndex + 1 >= totalQuestions) {
            // Last question completed -> PODIUM
            const updateRes = await db.query<{ status: string; phase: string; updated_at: string }>(
              `UPDATE lightning_sessions 
               SET status = 'COMPLETED', phase = 'PODIUM', updated_at = NOW() 
               WHERE id = $1 AND phase = 'LEADERBOARD' AND current_question_index = $2
               RETURNING status, phase, updated_at`,
              [sessionId, qIndex],
            );
            if (updateRes.rows.length > 0) {
              session.status = "COMPLETED";
              session.phase = "PODIUM";
              session.updated_at = updateRes.rows[0].updated_at;
              void finalizeLightningGameRewards(sessionId).catch(console.error);
            }
          } else {
            // Advance to next question
            const nextIdx = qIndex + 1;
            const updateRes = await db.query<{
              phase: string;
              current_question_index: number;
              current_question_started_at: string;
              updated_at: string;
            }>(
              `UPDATE lightning_sessions 
               SET phase = 'QUESTION', 
                   current_question_index = $2, 
                   current_question_started_at = NOW(), 
                   updated_at = NOW() 
               WHERE id = $1 AND phase = 'LEADERBOARD' AND current_question_index = $3
               RETURNING phase, current_question_index, current_question_started_at, updated_at`,
              [sessionId, nextIdx, qIndex],
            );
            if (updateRes.rows.length > 0) {
              session.phase = "QUESTION";
              session.current_question_index = nextIdx;
              session.current_question_started_at = updateRes.rows[0].current_question_started_at;
              session.updated_at = updateRes.rows[0].updated_at;
              qIndex = nextIdx;
            }
          }
        }
      }
    }
    const currentQ = questions[qIndex] || null;

    // Fetch participants sorted by total_points DESC
    const { rows: participants } = await db.query<{
      id: string;
      user_id: string;
      name: string;
      username: string | null;
      profile_image: string | null;
      school_name: string | null;
      school_logo: string | null;
      total_points: number;
      streak: number;
      highest_streak: number;
      correct_count: number;
      is_connected: boolean;
      leaderboard_points: number;
    }>(
      `SELECT 
         lp.id, 
         lp.user_id, 
         lp.name, 
         lp.username, 
         lp.profile_image, 
         lp.total_points, 
         lp.streak, 
         lp.highest_streak, 
         lp.correct_count, 
         lp.is_connected, 
         COALESCE(lp.leaderboard_points, 0) AS leaderboard_points,
         COALESCE(a.name, r.name, u.school_name) AS school_name,
         COALESCE(a.logo_url, r.profile_image) AS school_logo
       FROM lightning_participants lp
       LEFT JOIN users u ON u.id::text = lp.user_id
       LEFT JOIN admin_schools a ON LOWER(TRIM(a.name)) = LOWER(TRIM(u.school_name))
       LEFT JOIN users r ON r.role = 'SCHOOL' AND LOWER(TRIM(r.name)) = LOWER(TRIM(u.school_name))
       WHERE lp.session_id = $1
       ORDER BY lp.total_points DESC, lp.correct_count DESC, lp.created_at ASC`,
      [sessionId],
    );

    // Fetch answers for current question to calculate round points received
    const { rows: currentQAnswers } = await db.query<{
      user_id: string;
      selected_option: string;
      is_correct: boolean;
      points_earned: number;
      streak_after: number;
      time_taken_ms: number;
    }>(
      `SELECT user_id, selected_option, is_correct, points_earned, streak_after, time_taken_ms 
       FROM lightning_answers 
       WHERE session_id = $1 AND question_index = $2`,
      [sessionId, qIndex],
    );

    // Add rank numbers, attach round points received, & normalize camelCase
    const rankedParticipants = participants.map((p, idx) => {
      const roundAns = currentQAnswers.find((a) => a.user_id === p.user_id);
      return {
        id: p.id,
        sessionId,
        userId: p.user_id,
        name: p.name,
        username: p.username,
        profileImage: p.profile_image,
        schoolName: p.school_name || null,
        schoolLogo: p.school_logo || null,
        totalPoints: p.total_points,
        roundPoints: roundAns ? roundAns.points_earned : 0,
        isRoundCorrect: roundAns ? roundAns.is_correct : false,
        streak: p.streak,
        highestStreak: p.highest_streak,
        correctCount: p.correct_count,
        isConnected: p.is_connected,
        leaderboardPoints: p.leaderboard_points || 0,
        rank: idx + 1,
      };
    });

    // Find current user participant
    const currentParticipant =
      rankedParticipants.find((p) => p.userId === currentUserId) || null;

    const rawCurrentUserAnswer =
      currentQAnswers.find((a) => a.user_id === currentUserId) || null;

    const currentUserAnswer = rawCurrentUserAnswer
      ? {
          userId: rawCurrentUserAnswer.user_id,
          selectedOption: rawCurrentUserAnswer.selected_option,
          isCorrect: rawCurrentUserAnswer.is_correct,
          pointsEarned: rawCurrentUserAnswer.points_earned,
          streakAfter: rawCurrentUserAnswer.streak_after,
          timeTakenMs: rawCurrentUserAnswer.time_taken_ms,
          user_id: rawCurrentUserAnswer.user_id,
          selected_option: rawCurrentUserAnswer.selected_option,
          is_correct: rawCurrentUserAnswer.is_correct,
          points_earned: rawCurrentUserAnswer.points_earned,
          streak_after: rawCurrentUserAnswer.streak_after,
          time_taken_ms: rawCurrentUserAnswer.time_taken_ms,
        }
      : null;

    // Calculate answer distribution { 'A': 5, 'B': 2, 'C': 0, 'D': 1 }
    const answerCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    currentQAnswers.forEach((ans) => {
      const opt = ans.selected_option.toUpperCase();
      if (answerCounts[opt] !== undefined) {
        answerCounts[opt] += 1;
      } else {
        answerCounts[opt] = (answerCounts[opt] || 0) + 1;
      }
    });

    // Mask correct answer if game is in QUESTION phase and viewer is not the host
    const shouldHideAnswer = session.phase === "QUESTION" && !isHost;

    let sanitizedQuestion = null;
    if (currentQ) {
      sanitizedQuestion = {
        id: currentQ.id,
        questionNumber: qIndex + 1,
        questionText: currentQ.questionText,
        options: currentQ.options.map((opt, optIdx) => ({
          id: opt.id || String.fromCharCode(65 + optIdx),
          text: opt.text,
        })),
        imageUrl: currentQ.imageUrl,
        marks: currentQ.marks,
        correctOptionId: shouldHideAnswer ? undefined : currentQ.correctOptionId,
        explanation: shouldHideAnswer ? undefined : currentQ.explanation,
      };
    }

    // Extract all diagram URLs across the entire quiz session for silent pre-caching
    const diagramUrls: string[] = questions
      .map((q) => q.imageUrl)
      .filter((url): url is string => typeof url === "string" && url.trim().length > 0);

    // Sliding window of up to 5 upcoming questions (answers strictly masked for players)
    // Allows clients to seamlessly preload questions & diagrams ahead of time without any glitches
    const upcomingQuestions = questions
      .slice(qIndex, qIndex + 5)
      .map((q, offset) => {
        const thisQIndex = qIndex + offset;
        const hideAnswer = (session.phase === "QUESTION" || thisQIndex > qIndex) && !isHost;
        return {
          id: q.id,
          questionNumber: thisQIndex + 1,
          questionText: q.questionText,
          options: q.options.map((opt, optIdx) => ({
            id: opt.id || String.fromCharCode(65 + optIdx),
            text: opt.text,
          })),
          imageUrl: q.imageUrl,
          marks: q.marks,
          correctOptionId: hideAnswer ? undefined : q.correctOptionId,
          explanation: hideAnswer ? undefined : q.explanation,
        };
      });

    return successResponse({
      serverTime: new Date().toISOString(),
      session: {
        id: session.id,
        pinCode: session.pin_code,
        creatorId: session.creator_id,
        creatorRole: session.creator_role,
        title: session.title,
        subject: session.subject,
        classLevel: session.class_level,
        board: session.board,
        status: session.status,
        phase: session.phase,
        sourceMode: session.source_mode,
        perQuestionSeconds: session.per_question_seconds,
        currentQuestionIndex: session.current_question_index,
        totalQuestions,
        currentQuestionStartedAt: session.current_question_started_at,
        updatedAt: session.updated_at,
        classroomId: session.classroom_id,
      },
      isHost,
      question: sanitizedQuestion,
      upcomingQuestions,
      diagramUrls,
      currentUserAnswer,
      totalAnsweredCount: currentQAnswers.length,
      answerDistribution: session.phase !== "QUESTION" || isHost ? answerCounts : null,
      participants: rankedParticipants,
      currentParticipant,
      topLeaderboard: rankedParticipants.slice(0, 5),
    });
  } catch (error: unknown) {
    console.error("Error fetching lightning session state:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
