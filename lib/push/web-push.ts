import webpush from "web-push";
import {
  getUserPushSubscriptions,
  deletePushSubscriptionByEndpoint,
} from "./push-subscriptions";

let vapidConfigured = false;

function initVapid() {
  if (vapidConfigured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "Missing VAPID environment variables: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, or VAPID_SUBJECT"
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

/**
 * Send a web push notification to a specific push subscription
 */
export async function sendPushToSubscription(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: PushNotificationPayload
): Promise<boolean> {
  initVapid();

  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  };

  const formattedPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/badge-96.png",
    tag: payload.tag || "exboard-notification",
    data: {
      url: payload.url || "/",
      ...payload.data,
    },
  });

  try {
    await webpush.sendNotification(pushSubscription, formattedPayload);
    return true;
  } catch (error: unknown) {
    const webPushError = error as { statusCode?: number };

    if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
      await deletePushSubscriptionByEndpoint(sub.endpoint).catch(() => {});
    }

    console.error("WebPush dispatch error:", error);
    return false;
  }
}

/**
 * Send web push notification to all active devices/subscriptions of a user
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ sent: number; total: number }> {
  try {
    const subscriptions = await getUserPushSubscriptions(userId);

    if (!subscriptions || subscriptions.length === 0) {
      return { sent: 0, total: 0 };
    }

    const results = await Promise.allSettled(
      subscriptions.map((sub) => sendPushToSubscription(sub, payload))
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value === true
    ).length;

    return {
      sent: successful,
      total: subscriptions.length,
    };
  } catch (err) {
    console.error("Failed to send push notifications to user:", err);
    return { sent: 0, total: 0 };
  }
}