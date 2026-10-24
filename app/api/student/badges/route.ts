import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { getCompleteStudentAchievements } from "@/lib/gamification/badges";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/student/badges
 * Returns full gamification achievements (Performance Badges + Student of the Year/Month/Week Honors + Active Contests).
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const data = await getCompleteStudentAchievements(user.userId);
    return successResponse(data);
  } catch (error) {
    console.error("Fetch student badges error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
