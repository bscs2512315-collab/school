import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { createNotification } from "@/lib/notifications";

/**
 * POST /api/users/[id]/follow — Follow a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized. Please login.", 401);
  }

  const { id } = await params;

  if (id === user.userId) {
    return errorResponse("You cannot follow yourself", 400);
  }

  try {
    // Check if target user exists
    const { rows: targetUser } = await db.query(
      "SELECT id FROM users WHERE id = $1",
      [id],
    );
    if (targetUser.length === 0) {
      return errorResponse("User not found", 404);
    }

    // Insert follow (ignore if already following)
    await db.query(
      `INSERT INTO follows (follower_id, following_id) 
       VALUES ($1, $2) 
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [user.userId, id],
    );

    // Get follower name for notification
    const { rows: followerInfo } = await db.query(
      "SELECT name, username FROM users WHERE id = $1",
      [user.userId],
    );
    const followerName =
      followerInfo[0]?.name || followerInfo[0]?.username || "Someone";

    // Notify the followed user
    createNotification({
      userId: id,
      type: "FOLLOW",
      title: "New Follower",
      message: `${followerName} started following you`,
      link: `/student/friends/${user.userId}`,
      metadata: { followerId: user.userId },
    });

    // Return updated follower count
    const { rows: countRows } = await db.query(
      "SELECT COUNT(*) as count FROM follows WHERE following_id = $1",
      [id],
    );

    return successResponse(
      { followersCount: parseInt(countRows[0].count), isFollowing: true },
      "Followed successfully",
    );
  } catch (error) {
    console.error("Follow user error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * DELETE /api/users/[id]/follow — Unfollow a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized. Please login.", 401);
  }

  const { id } = await params;

  try {
    await db.query(
      "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
      [user.userId, id],
    );

    // Return updated follower count
    const { rows: countRows } = await db.query(
      "SELECT COUNT(*) as count FROM follows WHERE following_id = $1",
      [id],
    );

    return successResponse(
      { followersCount: parseInt(countRows[0].count), isFollowing: false },
      "Unfollowed successfully",
    );
  } catch (error) {
    console.error("Unfollow user error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
