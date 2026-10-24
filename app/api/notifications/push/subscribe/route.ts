import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { savePushSubscription } from "@/lib/push/push-subscriptions";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * POST /api/notifications/push/subscribe
 * Register or update a browser push subscription for the authenticated user
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return errorResponse("Invalid push subscription payload", 400);
    }

    const userAgent = request.headers.get("user-agent") || undefined;

    await savePushSubscription({
      userId: user.userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent,
    });

    return successResponse({ subscribed: true }, "Push subscription registered successfully");
  } catch (error) {
    console.error("Push subscribe error:", error);
    return errorResponse("Failed to register push subscription", 500);
  }
}
