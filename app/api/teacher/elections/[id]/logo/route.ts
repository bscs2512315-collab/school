import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { saveUploadedFile } from "@/lib/storage/file-upload";
import {
  getElectionForTeacher,
  mapElectionEvent,
  type ElectionRow,
} from "@/lib/teacher/election-schema";
import { getRequestOrigin } from "@/lib/site";

/**
 * POST /api/teacher/elections/:id/logo
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

    const form = await req.formData();
    const file = form.get("logo") ?? form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return errorResponse("Logo image is required", 400);
    }

    const uploaded = await saveUploadedFile(file, "elections");
    const { rows } = await db.query<ElectionRow>(
      `UPDATE election_events
       SET logo_url = $1, updated_at = NOW()
       WHERE id = $2 AND teacher_id = $3
       RETURNING *,
         (SELECT COUNT(*)::int FROM election_candidates c WHERE c.election_id = election_events.id) AS candidate_count,
         (SELECT COUNT(*)::int FROM election_votes v WHERE v.election_id = election_events.id AND v.discarded_at IS NULL) AS vote_count`,
      [uploaded.fileUrl, id, user.userId],
    );

    return successResponse(
      mapElectionEvent(rows[0], getRequestOrigin(req)),
      "Logo updated",
    );
  } catch (error) {
    console.error("Upload election logo error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Logo upload failed",
      500,
    );
  }
}
