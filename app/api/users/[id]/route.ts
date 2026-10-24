import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/users/[id]
 * View a user's public profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized. Please login.", 401);
  }

  const { id } = await params;

  try {
    // Get user profile
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.username, u.email, u.profile_image, u.city, u.class, 
              u.board, COALESCE(a.name, r.name, u.school_name) as school_name, 
              COALESCE(a.logo_url, r.profile_image) as school_logo, u.points, u.role,
              CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_following,
              COALESCE(
                  (SELECT 'Level ' || level || ': ' || name FROM milestones WHERE points_required <= u.points ORDER BY points_required DESC LIMIT 1),
                  'Level 1: Novice'
              ) as rank,
              (
                  SELECT COUNT(*) + 1 FROM users u2
                  WHERE u2.role = 'STUDENT' AND COALESCE(u2.points, 0) > COALESCE(u.points, 0)
              ) as rank_position
       FROM users u
       LEFT JOIN admin_schools a ON LOWER(TRIM(a.name)) = LOWER(TRIM(u.school_name))
       LEFT JOIN users r ON r.role = 'SCHOOL' AND LOWER(TRIM(r.name)) = LOWER(TRIM(u.school_name))
       LEFT JOIN follows f ON f.follower_id = $2 AND f.following_id = u.id
       WHERE u.id = $1`,
      [id, user.userId],
    );

    if (rows.length === 0) {
      return errorResponse("User not found", 404);
    }

    const u = rows[0] as any;

    // Get follower count
    const { rows: followerRows } = await db.query(
      `SELECT COUNT(*) as count FROM follows WHERE following_id = $1`,
      [id],
    );

    // Get following count
    const { rows: followingRows } = await db.query(
      `SELECT COUNT(*) as count FROM follows WHERE follower_id = $1`,
      [id],
    );

    return successResponse({
      id: u.id,
      name: u.name,
      username: u.username || null,
      profileImage: u.profile_image || null,
      city: u.city || null,
      class: u.class || null,
      board: u.board || null,
      schoolName: u.school_name || null,
      schoolLogo: u.school_logo || null,
      points: u.points || 0,
      rank: u.rank || null,
      rankPosition: parseInt(u.rank_position) || 0,
      role: u.role,
      isFollowing: u.is_following,
      followersCount: parseInt(followerRows[0].count),
      followingCount: parseInt(followingRows[0].count),
      isOwnProfile: id === user.userId,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
