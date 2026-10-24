/**
 * Scheduled Netlify function that self-heals Nova grading.
 * Runs every 5 minutes and pings /api/cron/recover-gradings so any Paper 2
 * attempt stuck in `pending`/`failed` (because the background `after()` task
 * was killed) gets re-queued for grading.
 */
export const config = {
  schedule: "*/5 * * * *",
};

export default async () => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[recover-gradings] CRON_SECRET is not set");
    return;
  }

  const baseUrl =
    process.env.URL || process.env.SITE_URL || "https://www.exboardai.tech";

  try {
    const res = await fetch(`${baseUrl}/api/cron/recover-gradings?cutoffMinutes=3`, {
      method: "POST",
      headers: {
        "x-cron-secret": secret,
      },
      signal: AbortSignal.timeout(10000),
    });
    const text = await res.text();
    console.log(`[recover-gradings] ${res.status}: ${text}`);
  } catch (error) {
    console.error("[recover-gradings] request failed:", error);
  }
};