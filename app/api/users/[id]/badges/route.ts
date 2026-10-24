import { NextRequest } from "next/server";
import { getCompleteStudentAchievements } from "@/lib/gamification/badges";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/users/[id]/badges
 * Returns full gamification achievements and honors for any public user profile.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return errorResponse("User ID is required", 400);
  }

  try {
    const data = await getCompleteStudentAchievements(id);
    return successResponse(data);
  } catch (error) {
    console.error("Fetch user badges error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
