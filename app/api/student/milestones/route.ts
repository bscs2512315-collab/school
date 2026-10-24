import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/student/milestones
 * Gets all milestones dynamically locked/unlocked based on the user's points
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    // Determine the user's total points currently
    const { rows: userRows } = await db.query(
      `SELECT points FROM users WHERE id = $1`,
      [user.userId],
    );

    if (userRows.length === 0) {
      return errorResponse("User not found", 404);
    }

    const currentPoints = userRows[0].points || 0;

    // Fetch all milestones and append 'unlocked' status mapped to user points
    const { rows: milestoneRows } = await db.query(
      `SELECT * FROM milestones ORDER BY points_required ASC`,
    );

    const mapped = milestoneRows.map((m) => ({
      ...m,
      unlocked: currentPoints >= m.points_required,
      progress: Math.min(
        100,
        (currentPoints / (m.points_required || 1)) * 100,
      ).toFixed(0),
    }));

    return successResponse(mapped);
  } catch (error) {
    console.error("Fetch student milestones error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
