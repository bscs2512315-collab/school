import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/student/me
 * Fetch the current student's live profile including points
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized. Please login.", 401);
  }

  try {
    const { rows } = await db.query(
      `SELECT id, name, email, class, school_name, points, role, profile_image,
              COALESCE(
                  (SELECT 'Level ' || level || ': ' || name FROM milestones WHERE points_required <= users.points ORDER BY points_required DESC LIMIT 1),
                  'Level 1: Novice'
              ) as rank
       FROM users WHERE id = $1`,
      [user.userId],
    );

    if (rows.length === 0) {
      return errorResponse("User not found", 404);
    }

    const u = rows[0] as any;

    return successResponse({
      id: u.id,
      name: u.name,
      email: u.email,
      class: u.class,
      schoolName: u.school_name || null,
      points: u.points || 0,
      role: u.role,
      rank: u.rank,
      profileImage: u.profile_image || null,
    });
  } catch (error) {
    console.error("Student me error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
