import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { getElectionForTeacher } from "@/lib/teacher/election-schema";

/**
 * POST /api/teacher/elections/:id/votes/discard
 * Marks the given votes as discarded so they are excluded from tallies.
 * Discarded votes can be restored via .../votes/restore.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const election = await getElectionForTeacher(id, user.userId);
    if (!election) return errorResponse("Election not found", 404);

    const body = (await req.json().catch(() => null)) as {
      voteIds?: unknown;
      reason?: unknown;
    } | null;
    if (!body || !Array.isArray(body.voteIds) || body.voteIds.length === 0) {
      return errorResponse("Select at least one vote to discard", 400);
    }

    const voteIds = body.voteIds
      .filter((item): item is string => typeof item === "string")
      .slice(0, 500);
    if (voteIds.length === 0) {
      return errorResponse("Select at least one vote to discard", 400);
    }

    const reason =
      typeof body.reason === "string"
        ? body.reason.trim().slice(0, 500)
        : "";
    if (!reason) {
      return errorResponse("Add a reason for discarding these votes", 400);
    }

    const { rowCount } = await db.query(
      `UPDATE election_votes
       SET discarded_at = NOW(),
           discarded_reason = $3
       WHERE election_id = $1
         AND id = ANY($2::uuid[])
         AND discarded_at IS NULL`,
      [id, voteIds, reason],
    );

    return successResponse(
      { discarded: Number(rowCount ?? 0) },
      "Vote(s) discarded",
    );
  } catch (error) {
    console.error("Discard election votes error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}