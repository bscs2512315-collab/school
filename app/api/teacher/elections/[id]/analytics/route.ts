import { verifyAuth } from "@/lib/auth-utils";
import { errorResponse, successResponse } from "@/lib/response-handlers";
import {
  getElectionAnalytics,
  getElectionForTeacher,
} from "@/lib/teacher/election-schema";
import { UserRole } from "@/types/enums";

/**
 * GET /api/teacher/elections/:id/analytics
 * Live vote counts and percentages for the teacher's election.
 */
export async function GET(
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

    const analytics = await getElectionAnalytics(id);
    return successResponse(analytics);
  } catch (error) {
    console.error("Teacher election analytics error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
