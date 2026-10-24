import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { deletePushSubscriptionByEndpoint } from "@/lib/push/push-subscriptions";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * POST /api/notifications/push/unsubscribe
 * Unregister a push subscription endpoint
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json();
    const { endpoint } = body;

    if (endpoint) {
      await deletePushSubscriptionByEndpoint(endpoint, user.userId);
    }

    return successResponse({ unsubscribed: true }, "Push subscription removed");
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return errorResponse("Failed to unregister push subscription", 500);
  }
}
