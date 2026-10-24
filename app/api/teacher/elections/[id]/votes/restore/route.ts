import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { getElectionForTeacher } from "@/lib/teacher/election-schema";

/**
 * POST /api/teacher/elections/:id/votes/restore
 * Re-includes previously discarded votes so they count in the tallies again.
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
    } | null;
    if (!body || !Array.isArray(body.voteIds) || body.voteIds.length === 0) {
      return errorResponse("Select at least one vote to restore", 400);
    }

    const voteIds = body.voteIds
      .filter((item): item is string => typeof item === "string")
      .slice(0, 500);
    if (voteIds.length === 0) {
      return errorResponse("Select at least one vote to restore", 400);
    }

    const { rowCount } = await db.query(
      `UPDATE election_votes
       SET discarded_at = NULL
       WHERE election_id = $1
         AND id = ANY($2::uuid[])
         AND discarded_at IS NOT NULL`,
      [id, voteIds],
    );

    return successResponse(
      { restored: Number(rowCount ?? 0) },
      "Vote(s) restored",
    );
  } catch (error) {
    console.error("Restore election votes error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}