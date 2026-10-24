import { db } from "@/lib/db";

let tableMigrated = false;

export async function ensurePushSubscriptionsTable() {
  if (tableMigrated) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
    `);
    tableMigrated = true;
  } catch (error) {
    console.error("Failed to ensure push_subscriptions table:", error);
    throw error;
  }
}

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function savePushSubscription(params: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}): Promise<void> {
  await ensurePushSubscriptionsTable();

  let endpoint: URL;
  try { endpoint = new URL(params.endpoint); } catch { throw new Error("Invalid push endpoint"); }
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password ||
      params.endpoint.length > 2048 || params.p256dh.length > 512 || params.auth.length > 512) {
    throw new Error("Invalid push subscription");
  }
  const { rows: countRows } = await db.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM push_subscriptions WHERE user_id = $1", [params.userId],
  );
  if (Number(countRows[0]?.count) >= 20) throw new Error("Push subscription limit reached");

  const result = await db.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (endpoint)
     DO UPDATE SET
       p256dh = EXCLUDED.p256dh,
       auth = EXCLUDED.auth,
       user_agent = EXCLUDED.user_agent,
       updated_at = NOW()
     WHERE push_subscriptions.user_id = EXCLUDED.user_id;`,
    [
      params.userId,
      params.endpoint,
      params.p256dh,
      params.auth,
      params.userAgent || null,
    ]
  );
  if (result.rowCount === 0) throw new Error("Push endpoint belongs to another account");
}

export async function deletePushSubscriptionByEndpoint(
  endpoint: string,
  userId?: string,
): Promise<void> {
  await ensurePushSubscriptionsTable();
  if (userId) {
    await db.query(
      `DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2`,
      [endpoint, userId],
    );
  } else {
    await db.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [endpoint]);
  }
}

export async function deletePushSubscriptionsForUser(userId: string): Promise<void> {
  await ensurePushSubscriptionsTable();
  await db.query(`DELETE FROM push_subscriptions WHERE user_id = $1`, [userId]);
}

export async function getUserPushSubscriptions(userId: string): Promise<
  Array<{
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }>
> {
  await ensurePushSubscriptionsTable();
  const { rows } = await db.query<{
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }>(
    `SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
    [userId]
  );
  return rows;
}
