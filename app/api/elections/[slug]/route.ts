import { errorResponse, successResponse } from "@/lib/response-handlers";
import { isReservedElectionSlug } from "@/lib/elections/slug";
import {
  getElectionBySlug,
  listCandidates,
  mapElectionEvent,
  mapPublicElection,
  toPublicCandidate,
} from "@/lib/teacher/election-schema";
import { getRequestOrigin } from "@/lib/site";

/**
 * GET /api/elections/:slug
 * Public election ballot. No login. Does not expose voter records.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const normalized = slug.trim().toLowerCase();
    if (!normalized || isReservedElectionSlug(normalized)) {
      return errorResponse("Election not found", 404);
    }

    const row = await getElectionBySlug(normalized);
    if (!row) return errorResponse("Election not found", 404);

    const event = mapElectionEvent(row, getRequestOrigin(req));
    const candidates = await listCandidates(event.id, false);
    return successResponse(
      mapPublicElection(
        event,
        candidates.map(toPublicCandidate),
      ),
    );
  } catch (error) {
    console.error("Public election error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
