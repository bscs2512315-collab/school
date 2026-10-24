import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/users/[id]/followers?type=followers|following&page=1&limit=20
 * Get followers or following list for a user
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
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "followers";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "20")),
  );
  const offset = (page - 1) * limit;

  try {
    let query: string;
    let countQuery: string;

    if (type === "following") {
      // Users that this user follows
      countQuery = `SELECT COUNT(*) as total FROM follows WHERE follower_id = $1`;
      query = `
        SELECT u.id, u.name, u.username, u.profile_image, u.city, u.class, u.points, u.role,
               CASE WHEN f2.id IS NOT NULL THEN true ELSE false END as is_following
        FROM follows f
        JOIN users u ON u.id = f.following_id
        LEFT JOIN follows f2 ON f2.follower_id = $2 AND f2.following_id = u.id
        WHERE f.follower_id = $1
        ORDER BY f.created_at DESC
        LIMIT $3 OFFSET $4
      `;
    } else {
      // Users who follow this user
      countQuery = `SELECT COUNT(*) as total FROM follows WHERE following_id = $1`;
      query = `
        SELECT u.id, u.name, u.username, u.profile_image, u.city, u.class, u.points, u.role,
               CASE WHEN f2.id IS NOT NULL THEN true ELSE false END as is_following
        FROM follows f
        JOIN users u ON u.id = f.follower_id
        LEFT JOIN follows f2 ON f2.follower_id = $2 AND f2.following_id = u.id
        WHERE f.following_id = $1
        ORDER BY f.created_at DESC
        LIMIT $3 OFFSET $4
      `;
    }

    const { rows: countRows } = await db.query(countQuery, [id]);
    const total = parseInt(countRows[0].total);

    const { rows } = await db.query(query, [id, user.userId, limit, offset]);

    const users = rows.map((u: any) => ({
      id: u.id,
      name: u.name,
      username: u.username || null,
      profileImage: u.profile_image || null,
      city: u.city || null,
      class: u.class || null,
      points: u.points || 0,
      role: u.role,
      isFollowing: u.is_following,
    }));

    return successResponse({ users, total, page, limit, type });
  } catch (error) {
    console.error("Get followers error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
