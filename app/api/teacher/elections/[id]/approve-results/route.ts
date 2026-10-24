import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole, ElectionStatus } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import {
  ensureElectionSchema,
  getElectionForTeacher,
  getElectionStatus,
  mapElectionEvent,
} from "@/lib/teacher/election-schema";
import { getRequestOrigin } from "@/lib/site";
import type { ElectionRow } from "@/lib/teacher/election-schema";
import { cleanFinishedElectionImages } from "@/lib/services/election-cleanup-service";

/**
 * POST /api/teacher/elections/:id/approve-results
 * Teacher approves final election results (only after the election ends).
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
    const existing = await getElectionForTeacher(id, user.userId);
    if (!existing) return errorResponse("Election not found", 404);

    if (getElectionStatus(existing.starts_at, existing.ends_at) !== ElectionStatus.ENDED) {
      return errorResponse("Results can only be approved after the election ends", 400);
    }

    if (existing.results_approved_at) {
      return errorResponse(
        "Results for this election are already approved",
        409,
      );
    }

    await ensureElectionSchema();
    const { rows } = await db.query<ElectionRow>(
      `UPDATE election_events
       SET results_approved_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND teacher_id = $2
       RETURNING *,
         (SELECT COUNT(*)::int FROM election_candidates c WHERE c.election_id = election_events.id) AS candidate_count,
         (SELECT COUNT(*)::int FROM election_votes v WHERE v.election_id = election_events.id AND v.discarded_at IS NULL) AS vote_count`,
      [id, user.userId],
    );

    // Auto-clean candidate and voter images in the background to free Cloudinary credits
    cleanFinishedElectionImages({ electionId: id }).catch((cleanupErr) => {
      console.warn("Background election image cleanup notice:", cleanupErr?.message || cleanupErr);
    });

    return successResponse(
      mapElectionEvent(rows[0], getRequestOrigin(req)),
      "Results approved",
    );
  } catch (error) {
    console.error("Approve election results error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
