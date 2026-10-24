import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { getNotifications, markNotificationsRead } from "@/lib/notifications";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/notifications
 * Get user's notifications
 */
export async function GET(request: NextRequest) {
  const startedAt = performance.now();
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const url = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "15", 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));

    const queryStartedAt = performance.now();
    const data = await getNotifications(user.userId, limit, offset);

    const response = successResponse({
      notifications: data.notifications.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        isRead: n.is_read,
        metadata: n.metadata,
        createdAt: n.created_at,
      })),
      unreadCount: data.unreadCount,
      total: data.total,
      limit,
      offset,
      hasMore: data.hasMore,
    });
    response.headers.set("Server-Timing", `db;dur=${(performance.now() - queryStartedAt).toFixed(1)}, total;dur=${(performance.now() - startedAt).toFixed(1)}`);
    return response;
  } catch (error) {
    console.error("Get notifications error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read
 * Body: { ids?: string[] } — if no ids, marks ALL as read
 */
export async function PATCH(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json().catch(() => ({}));
    await markNotificationsRead(user.userId, body.ids);
    return successResponse(null, "Notifications marked as read");
  } catch (error) {
    console.error("Mark read error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
