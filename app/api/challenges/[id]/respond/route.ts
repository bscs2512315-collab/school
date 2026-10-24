import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * POST /api/challenges/[id]/respond
 * Accept or decline a challenge invite
 * Body: { action: "accept" | "decline" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  const { action } = await request.json();

  if (!["accept", "decline"].includes(action)) {
    return errorResponse("Action must be 'accept' or 'decline'", 400);
  }

  try {
    // Verify participant exists and is INVITED
    const { rows } = await db.query(
      "SELECT * FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2",
      [id, user.userId],
    );

    if (rows.length === 0) {
      return errorResponse("You are not invited to this challenge", 404);
    }

    if (rows[0].status !== "INVITED") {
      return errorResponse(
        `You have already ${rows[0].status.toLowerCase()} this challenge`,
        400,
      );
    }

    // Verify challenge is still WAITING
    const { rows: challenges } = await db.query(
      "SELECT status FROM challenges WHERE id = $1",
      [id],
    );

    if (challenges.length === 0) {
      return errorResponse("Challenge not found", 404);
    }

    if (challenges[0].status !== "WAITING") {
      return errorResponse(
        "This challenge is no longer accepting responses",
        400,
      );
    }

    const newStatus = action === "accept" ? "ACCEPTED" : "DECLINED";
    await db.query(
      "UPDATE challenge_participants SET status = $1 WHERE challenge_id = $2 AND user_id = $3",
      [newStatus, id, user.userId],
    );

    // Notify creator if accepted
    if (action === "accept") {
      const { rows: challengeInfo } = await db.query(
        "SELECT creator_id, subject FROM challenges WHERE id = $1",
        [id],
      );
      if (challengeInfo.length > 0) {
        const { rows: userInfo } = await db.query(
          "SELECT name FROM users WHERE id = $1",
          [user.userId],
        );
        const accepterName = userInfo[0]?.name || "Someone";

        await db
          .query(
            `INSERT INTO notifications (user_id, type, title, message, link, metadata)
           VALUES ($1, 'CHALLENGE_INVITE', $2, $3, $4, $5)`,
            [
              challengeInfo[0].creator_id,
              "Challenge Accepted! ⚔️",
              `${accepterName} accepted your challenge in ${challengeInfo[0].subject}`,
              `/student/challenge/${id}`,
              JSON.stringify({ challengeId: id, accepterId: user.userId }),
            ],
          )
          .catch((err) => console.error("Creator notification failed:", err));
      }
    }

    // Check if all have responded — auto start if all accepted/declined and at least 2 accepted
    const { rows: allParticipants } = await db.query(
      "SELECT status FROM challenge_participants WHERE challenge_id = $1",
      [id],
    );

    const allResponded = allParticipants.every(
      (p: any) => p.status !== "INVITED",
    );
    const acceptedCount = allParticipants.filter(
      (p: any) => p.status === "ACCEPTED",
    ).length;

    if (allResponded && acceptedCount >= 2) {
      await db.query(
        "UPDATE challenges SET status = 'ACTIVE', started_at = NOW() WHERE id = $1",
        [id],
      );
    }

    return successResponse(
      {
        status: newStatus,
        challengeStatus:
          allResponded && acceptedCount >= 2 ? "ACTIVE" : "WAITING",
      },
      action === "accept" ? "Challenge accepted!" : "Challenge declined.",
    );
  } catch (error) {
    console.error("Respond to challenge error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
