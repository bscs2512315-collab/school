import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

// Lazy migration: create follows table if it doesn't exist
async function ensureFollowsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS follows (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(follower_id, following_id)
    );
  `);
  // Create indexes (IF NOT EXISTS is implicit for CREATE INDEX IF NOT EXISTS)
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);`,
  );
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);`,
  );
}

/**
 * GET /api/users/search?q=<query>&page=1&limit=10
 * Search users by username or name
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized. Please login.", 401);
  }

  try {
    await ensureFollowsTable();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const roleFilter = searchParams.get("role")?.trim().toUpperCase() || "";
    const studentsOnly =
      searchParams.get("studentsOnly") === "true" || roleFilter === "STUDENT";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      20,
      Math.max(1, parseInt(searchParams.get("limit") || "10")),
    );
    const offset = (page - 1) * limit;

    if (!query) {
      return successResponse({ users: [], total: 0, page, limit });
    }

    const searchPattern = `%${query}%`;
    const allUsers = searchParams.get("all") === "true" || roleFilter === "ALL";
    const roleClause = allUsers
      ? ""
      : studentsOnly
        ? "AND u.role = 'STUDENT'"
        : "AND u.role != 'TEACHER'";

    // Count total matches
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) as total FROM users u
       WHERE u.id != $1 AND (u.username ILIKE $2 OR u.name ILIKE $2) ${roleClause}`,
      [user.userId, searchPattern],
    );

    const total = parseInt(countRows[0].total);

    // Get matching users with follow status
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.username, u.profile_image, u.city, u.class, u.points, u.role,
              CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_following
       FROM users u
       LEFT JOIN follows f ON f.follower_id = $1 AND f.following_id = u.id
       WHERE u.id != $1 AND (u.username ILIKE $2 OR u.name ILIKE $2) ${roleClause}
       ORDER BY 
         CASE WHEN u.username ILIKE $3 THEN 0 ELSE 1 END,
         u.name ASC
       LIMIT $4 OFFSET $5`,
      [user.userId, searchPattern, query, limit, offset],
    );

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

    return successResponse({ users, total, page, limit });
  } catch (error) {
    console.error("Search users error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
