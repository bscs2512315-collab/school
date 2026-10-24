import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/response-handlers";
import {
  ensureLightningSchema,
  finalizeLightningGameRewards,
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

    const { action, userId: bodyUserId } = body;
    const currentUserId = auth?.userId || bodyUserId;

    if (!action) {
      return errorResponse("Action parameter is required (start, reveal, leaderboard, next_question, finish)", 400);
    }

    await ensureLightningSchema();

    const { rows: sessionRows } = await db.query<{
      id: string;
      creator_id: string;
      status: string;
      phase: string;
      current_question_index: number;
      paper_data: LightningQuestion[];
    }>(`SELECT * FROM lightning_sessions WHERE id = $1`, [sessionId]);

    if (sessionRows.length === 0) {
      return errorResponse("Session not found", 404);
    }

    const session = sessionRows[0];
    const isHost = session.creator_id === currentUserId;

    // Check host authorization: Host can control all game flow; auto-timed reveal, leaderboard, and next_question are permitted
    const isAutoAction = action === "reveal" || action === "leaderboard" || action === "next_question" || action === "finish" || action === "podium";
    if (!isHost && !isAutoAction && currentUserId) {
      return errorResponse("Only the host can control game flow", 403);
    }

    const questions: LightningQuestion[] = session.paper_data || [];
    const totalQuestions = questions.length;
    const clientExpectedIndex = typeof body.expectedQuestionIndex === "number" ? body.expectedQuestionIndex : undefined;

    if (action === "start") {
      await db.query(
        `UPDATE lightning_sessions 
         SET status = 'ACTIVE', 
             phase = 'QUESTION', 
             current_question_index = 0, 
             current_question_started_at = NOW(), 
             updated_at = NOW() 
         WHERE id = $1 AND status != 'ACTIVE'`,
        [sessionId],
      );

      return successResponse({
        action: "start",
        status: "ACTIVE",
        phase: "QUESTION",
        currentQuestionIndex: 0,
      });
    }

    if (action === "reveal") {
      // Idempotency: If client expects index N, but server is already ahead, ignore!
      if (clientExpectedIndex !== undefined && session.current_question_index > clientExpectedIndex) {
        return successResponse({
          action: "reveal",
          phase: session.phase,
          currentQuestionIndex: session.current_question_index,
          idempotent: true,
        });
      }

      const targetIndex = clientExpectedIndex ?? session.current_question_index;
      await db.query(
        `UPDATE lightning_sessions 
         SET phase = 'REVEAL', updated_at = NOW() 
         WHERE id = $1 AND phase = 'QUESTION' AND current_question_index = $2`,
        [sessionId, targetIndex],
      );

      return successResponse({
        action: "reveal",
        phase: "REVEAL",
        currentQuestionIndex: targetIndex,
      });
    }

    if (action === "leaderboard") {
      // Idempotency: If client expects index N, but server is already ahead, ignore!
      if (clientExpectedIndex !== undefined && session.current_question_index > clientExpectedIndex) {
        return successResponse({
          action: "leaderboard",
          phase: session.phase,
          currentQuestionIndex: session.current_question_index,
          idempotent: true,
        });
      }

      const targetIndex = clientExpectedIndex ?? session.current_question_index;
      await db.query(
        `UPDATE lightning_sessions 
         SET phase = 'LEADERBOARD', updated_at = NOW() 
         WHERE id = $1 AND phase = 'REVEAL' AND current_question_index = $2`,
        [sessionId, targetIndex],
      );

      return successResponse({
        action: "leaderboard",
        phase: "LEADERBOARD",
        currentQuestionIndex: targetIndex,
      });
    }

    if (action === "next_question") {
      // Idempotency: If client expects index N, but server is already at N+1 in QUESTION phase, don't increment again!
      if (clientExpectedIndex !== undefined && session.current_question_index > clientExpectedIndex) {
        return successResponse({
          action: "next_question",
          phase: session.phase,
          currentQuestionIndex: session.current_question_index,
          idempotent: true,
        });
      }

      // If already in QUESTION phase for the current index and not coming from LEADERBOARD, return current state
      if (session.phase === "QUESTION" && clientExpectedIndex === session.current_question_index) {
        return successResponse({
          action: "next_question",
          phase: "QUESTION",
          currentQuestionIndex: session.current_question_index,
          idempotent: true,
        });
      }

      const nextIndex = session.current_question_index + 1;

      if (nextIndex >= totalQuestions) {
        // Last question reached -> go to podium
        await db.query(
          `UPDATE lightning_sessions 
           SET status = 'COMPLETED', phase = 'PODIUM', updated_at = NOW() 
           WHERE id = $1 AND status != 'COMPLETED'`,
          [sessionId],
        );

        await finalizeLightningGameRewards(sessionId);

        return successResponse({
          action: "finish",
          status: "COMPLETED",
          phase: "PODIUM",
          completed: true,
        });
      }

      const updateRes = await db.query<{ current_question_index: number }>(
        `UPDATE lightning_sessions 
         SET phase = 'QUESTION', 
             current_question_index = $2, 
             current_question_started_at = NOW(), 
             updated_at = NOW() 
         WHERE id = $1 AND phase = 'LEADERBOARD' AND current_question_index = $3
         RETURNING current_question_index`,
        [sessionId, nextIndex, session.current_question_index],
      );

      const resolvedIndex = updateRes.rows.length > 0 ? updateRes.rows[0].current_question_index : session.current_question_index;

      return successResponse({
        action: "next_question",
        phase: "QUESTION",
        currentQuestionIndex: resolvedIndex,
      });
    }

    if (action === "finish" || action === "podium") {
      await db.query(
        `UPDATE lightning_sessions 
         SET status = 'COMPLETED', phase = 'PODIUM', updated_at = NOW() 
         WHERE id = $1`,
        [sessionId],
      );

      await finalizeLightningGameRewards(sessionId);

      return successResponse({
        action: "finish",
        status: "COMPLETED",
        phase: "PODIUM",
      });
    }

    return errorResponse(`Unknown action: ${action}`, 400);
  } catch (error: unknown) {
    console.error("Error executing lightning session action:", error);
    const errObj = error as { message?: string };
    return errorResponse(errObj?.message || "Internal server error executing action", 500);
  }
}
