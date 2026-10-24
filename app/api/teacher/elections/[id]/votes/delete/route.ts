import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import {
  getElectionForTeacher,
  invalidateAnalyticsCache,
  invalidateElectionCache,
} from "@/lib/teacher/election-schema";

/**
 * POST /api/teacher/elections/:id/votes/delete
 * Permanently deletes voter ballots from the election.
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
      voterRollNumber?: unknown;
    } | null;

    if (!body) {
      return errorResponse("Invalid request body", 400);
    }

    const voteIds = Array.isArray(body.voteIds)
      ? body.voteIds.filter((item): item is string => typeof item === "string")
      : [];
    const voterRoll =
      typeof body.voterRollNumber === "string"
        ? body.voterRollNumber.trim().toLowerCase()
        : "";

    if (voteIds.length === 0 && !voterRoll) {
      return errorResponse("Select at least one vote or roll number to delete", 400);
    }

    let deletedCount = 0;

    if (voteIds.length > 0) {
      const { rowCount } = await db.query(
        `DELETE FROM election_votes
         WHERE election_id = $1
           AND id = ANY($2::uuid[])`,
        [id, voteIds],
      );
      deletedCount += Number(rowCount ?? 0);
    } else if (voterRoll) {
      const { rowCount } = await db.query(
        `DELETE FROM election_votes
         WHERE election_id = $1
           AND voter_roll_normalized = $2`,
        [id, voterRoll],
      );
      deletedCount += Number(rowCount ?? 0);
    }

    invalidateAnalyticsCache(election.slug);
    invalidateElectionCache(election.slug);
    invalidateElectionCache(id);

    return successResponse(
      { deleted: deletedCount },
      "Vote(s) deleted permanently",
    );
  } catch (error) {
    console.error("Delete election votes error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
