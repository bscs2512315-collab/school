import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push/web-push";

// ── Types ────────────────────────────────────────────────────────────────────────
export type NotificationType =
  | "FOLLOW"
  | "CHALLENGE_INVITE"
  | "CHALLENGE_STARTED"
  | "PAPER_GRADED"
  | "CLASSROOM_INVITE"
  | "TEACHER_PAPER_ASSIGNED"
  | "PAPER_SUBMITTED"
  | "PAPER_AWAITING_APPROVAL"
  | "PAPER_RESULT_APPROVED"
  | "DAILY_REMINDER"
  | "LEADERBOARD_ALERT";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

// ── Create Notification ──────────────────────────────────────────────────────────
export async function createNotification(params: CreateNotificationParams) {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        params.userId,
        params.type,
        params.title,
        params.message,
        params.link || null,
        params.metadata ? JSON.stringify(params.metadata) : null,
      ],
    );

    // Non-blocking Web Push notification dispatch
    void sendPushToUser(params.userId, {
      title: params.title,
      body: params.message,
      url: params.link,
      data: params.metadata,
    }).catch((err) => {
      console.error("Background push dispatch error:", err);
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    // Don't throw — notifications should never block the main flow
  }
}

// ── Get Notifications ────────────────────────────────────────────────────────────
export async function getNotifications(userId: string, limit = 30, offset = 0) {
  const { rows } = await db.query<{
    notifications: Array<Record<string, unknown>>;
    total: number;
    unread_count: number;
  }>(
    `SELECT
       COALESCE((
         SELECT jsonb_agg(page)
         FROM (
           SELECT * FROM notifications
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3
         ) page
       ), '[]'::jsonb) AS notifications,
       (SELECT COUNT(*)::int FROM notifications WHERE user_id = $1) AS total,
       (SELECT COUNT(*)::int FROM notifications WHERE user_id = $1 AND is_read = false) AS unread_count`,
    [userId, limit, offset],
  );
  const notifications = rows[0]?.notifications ?? [];
  const total = rows[0]?.total ?? 0;
  return {
    notifications,
    unreadCount: rows[0]?.unread_count ?? 0,
    total,
    hasMore: offset + notifications.length < total,
  };
}

// ── Mark Read ────────────────────────────────────────────────────────────────────
export async function markNotificationsRead(
  userId: string,
  notificationIds?: string[],
) {
  if (notificationIds && notificationIds.length > 0) {
    const placeholders = notificationIds.map((_, i) => `$${i + 2}`).join(",");
    await db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND id IN (${placeholders})`,
      [userId, ...notificationIds],
    );
  } else {
    await db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1`,
      [userId],
    );
  }
}
// ── Delete Notification ──────────────────────────────────────────────────────────
export async function deleteNotification(
  userId: string,
  notificationId: string,
) {
  await db.query(`DELETE FROM notifications WHERE user_id = $1 AND id = $2`, [
    userId,
    notificationId,
  ]);
}
