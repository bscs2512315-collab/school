import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { sendPushToUser } from "@/lib/push/web-push";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { db } from "@/lib/db";
import {
  getDailyInactivityNotification,
  getLeaderboardOvertakenNotification,
  type InactivityTemplateKey,
  type ReminderNotification,
} from "@/lib/push/inactivity-reminders";

/**
 * POST /api/notifications/push/test
 * Send a test web push notification to the logged-in user's active subscriptions
 * Body: { template?: InactivityTemplateKey | "overtaken" | "default", opponentName?: string, opponentSchool?: string }
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json().catch(() => ({}));
    const { rows } = await db.query<{ name: string | null; school_name: string | null }>(
      "SELECT name, school_name FROM users WHERE id = $1",
      [user.userId],
    );
    const studentName = rows[0]?.name || "Student";

    let payload: ReminderNotification;
    if (body.template === "overtaken") {
      payload = getLeaderboardOvertakenNotification(
        studentName,
        body.opponentName || "Maheen",
        body.opponentSchool || "Kashaf Nisar",
      );
    } else if (body.template === "default") {
      payload = {
        title: "ExBoard AI 🚀",
        body: "Push notifications are working perfectly on your device!",
        url: "/student/notifications",
        tag: "test-push",
      };
    } else {
      // Pick specified or randomized Roman Urdu daily inactivity reminder
      payload = getDailyInactivityNotification(
        studentName,
        body.template as InactivityTemplateKey | undefined,
      );
    }

    const result = await sendPushToUser(user.userId, {
      title: payload.title,
      body: payload.body,
      url: payload.url,
      tag: payload.tag,
      data: { isTest: true, template: body.template },
    });

    if (result.total === 0) {
      return errorResponse(
        "No active push subscriptions found for your account on this browser. Please enable notifications first.",
        400,
      );
    }

    return successResponse(
      {
        ...result,
        notification: {
          title: payload.title,
          body: payload.body,
        },
      },
      `Test notification sent: "${payload.title}"`,
    );
  } catch (error) {
    console.error("Test push error:", error);
    return errorResponse("Failed to send test push notification", 500);
  }
}
