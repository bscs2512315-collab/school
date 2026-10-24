import { errorResponse, successResponse } from "@/lib/response-handlers";
import { isReservedElectionSlug } from "@/lib/elections/slug";
import {
  getCachedElectionAnalytics,
  getElectionBySlug,
  mapElectionEvent,
} from "@/lib/teacher/election-schema";

/**
 * GET /api/elections/:slug/analytics
 * Public live tallies — vote counts and percentages only. No voter PII.
 * Uses 5-second in-memory and Edge caching to protect DB under high concurrent load.
 */
export async function GET(
  _req: Request,
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

    const event = mapElectionEvent(row);

    if (!event.resultsApprovedAt && event.showLiveResults === false) {
      const res = successResponse({
        totalVotes: 0,
        updatedAt: new Date().toISOString(),
        tallies: [],
        liveResultsHidden: true,
      });
      res.headers.set(
        "Cache-Control",
        "public, s-maxage=5, stale-while-revalidate=10",
      );
      return res;
    }

    const analytics = await getCachedElectionAnalytics(normalized, event.id);

    const res = successResponse(analytics);
    res.headers.set(
      "Cache-Control",
      "public, s-maxage=5, stale-while-revalidate=10",
    );
    return res;
  } catch (error) {
    console.error("Public election analytics error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
