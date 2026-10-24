import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/challenges/[id]
 * Get challenge details, participants, and paper (only if ACTIVE/COMPLETED and user has ACCEPTED)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    // Get challenge
    const { rows: challenges } = await db.query(
      `SELECT c.*, u.name as creator_name, u.username as creator_username, u.profile_image as creator_image
       FROM challenges c
       JOIN users u ON u.id = c.creator_id
       WHERE c.id = $1`,
      [id],
    );

    if (challenges.length === 0) {
      return errorResponse("Challenge not found", 404);
    }

    const challenge = challenges[0] as any;

    // Check user is participant
    const { rows: myParticipation } = await db.query(
      "SELECT * FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2",
      [id, user.userId],
    );

    if (myParticipation.length === 0) {
      return errorResponse("You are not part of this challenge", 403);
    }

    // Get all participants
    const { rows: participants } = await db.query(
      `SELECT cp.*, u.name, u.username, u.profile_image
       FROM challenge_participants cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.challenge_id = $1
       ORDER BY 
         CASE WHEN cp.status = 'COMPLETED' THEN 0 ELSE 1 END,
         cp.score DESC NULLS LAST,
         cp.time_taken ASC NULLS LAST`,
      [id],
    );

    // Check if challenge should auto-start (5 min timeout)
    if (challenge.status === "WAITING") {
      const createdAt = new Date(challenge.created_at).getTime();
      const now = Date.now();
      const waitMs = (challenge.max_wait_minutes || 5) * 60 * 1000;
      const acceptedCount = participants.filter(
        (p: any) => p.status === "ACCEPTED",
      ).length;

      // Auto-start if timeout OR all invited accepted
      const allResponded = participants.every(
        (p: any) => p.status !== "INVITED",
      );
      if (
        (now - createdAt >= waitMs && acceptedCount >= 2) ||
        (allResponded && acceptedCount >= 2)
      ) {
        await db.query(
          "UPDATE challenges SET status = 'ACTIVE', started_at = NOW() WHERE id = $1",
          [id],
        );
        challenge.status = "ACTIVE";
        challenge.started_at = new Date().toISOString();
      }
    }

    // Only include paper data if challenge is ACTIVE or COMPLETED and user accepted
    const myStatus = myParticipation[0].status;
    let myStartedAt = myParticipation[0].started_at;

    // Initialize individual startedAt if challenge is ACTIVE and participant hasn't started yet
    if (
      challenge.status === "ACTIVE" &&
      myStatus === "ACCEPTED" &&
      !myStartedAt
    ) {
      const { rows: updatedRows } = await db.query(
        "UPDATE challenge_participants SET started_at = NOW() WHERE challenge_id = $1 AND user_id = $2 RETURNING started_at",
        [id, user.userId],
      );
      myStartedAt = updatedRows[0]?.started_at;
    }

    const showPaper =
      (challenge.status === "ACTIVE" || challenge.status === "COMPLETED") &&
      (myStatus === "ACCEPTED" || myStatus === "COMPLETED");

    const paperData =
      showPaper && challenge.paper_data
        ? typeof challenge.paper_data === "string"
          ? JSON.parse(challenge.paper_data)
          : challenge.paper_data
        : null;

    // Strip correct answers from paper data if challenge is ACTIVE.
    // This prevents participants from harvesting the answer key mid-challenge.
    if (paperData && challenge.status === "ACTIVE") {
      paperData.questions = paperData.questions.map((q: any) => {
        const cleaned = { ...q };
        // Remove directly-attached answer fields.
        delete cleaned.correctAnswer;
        delete cleaned.correctOptionId;
        delete cleaned.correct_option;
        delete cleaned.isCorrect;
        delete cleaned.correct;
        // Remove the answer marker from each MCQ option.
        if (Array.isArray(cleaned.mcqOptions)) {
          cleaned.mcqOptions = cleaned.mcqOptions.map((opt: any) => {
            if (opt && typeof opt === "object") {
              const safe = { ...opt };
              delete safe.correctAnswer;
              delete safe.correctOptionId;
              delete safe.isCorrect;
              delete safe.correct;
              return safe;
            }
            return opt;
          });
        }
        return cleaned;
      });
    }

    return successResponse({
      id: challenge.id,
      subject: challenge.subject,
      classLevel: challenge.class_level,
      board: challenge.board,
      paperType: challenge.paper_type,
      status: challenge.status,
      createdAt: challenge.created_at,
      startedAt: challenge.started_at,
      myStartedAt,
      maxWaitMinutes: challenge.max_wait_minutes,
      creatorName: challenge.creator_name,
      creatorUsername: challenge.creator_username,
      creatorImage: challenge.creator_image,
      isCreator: challenge.creator_id === user.userId,
      myStatus,
      paper: paperData,
      participants: participants.map((p: any) => ({
        userId: p.user_id,
        name: p.name,
        username: p.username,
        profileImage: p.profile_image,
        status: p.status,
        score: p.score,
        totalMarks: p.total_marks,
        percentage: p.percentage ? parseFloat(p.percentage) : null,
        timeTaken: p.time_taken,
        startedAt: p.started_at,
      })),
    });
  } catch (error) {
    console.error("Get challenge error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
