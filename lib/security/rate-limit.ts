import { db } from "@/lib/db";

/**
 * Normalizes rate limit keys to avoid bypasses through casing or whitespace tricks.
 */
export function normalizeRateLimitKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, "_");
}

/**
 * Extracts client IP safely from request headers.
 */
export function getClientIp(req: Request): string {
  // Netlify sets this from the actual connection; X-Forwarded-For is client controlled.
  const netlifyIp = req.headers.get("x-nf-client-connection-ip")?.trim();
  if (netlifyIp) return netlifyIp;
  if (process.env.NODE_ENV === "production") return "unknown";
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  return "unknown";
}

/** Atomic fixed-window quota shared by every application worker. */
export async function rateLimitDistributed(
  rawKey: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const key = normalizeRateLimitKey(rawKey);
  const { rows } = await db.query<{ hits: number }>(
    `INSERT INTO security_rate_limits (key, hits, expires_at)
     VALUES ($1, 1, NOW() + ($2 * INTERVAL '1 second'))
     ON CONFLICT (key) DO UPDATE SET
       hits = CASE WHEN security_rate_limits.expires_at <= NOW() THEN 1
                   ELSE security_rate_limits.hits + 1 END,
       expires_at = CASE WHEN security_rate_limits.expires_at <= NOW()
                         THEN NOW() + ($2 * INTERVAL '1 second')
                         ELSE security_rate_limits.expires_at END
     RETURNING hits`,
    [key, windowSeconds],
  );
  return rows[0].hits <= limit;
}

export async function allowPublicSignupAttempt(req: Request): Promise<boolean> {
  const ip = getClientIp(req);
  if (ip !== "unknown" && !(await rateLimitDistributed(`signup:attempt:ip:${ip}`, 60, 3600))) {
    return false;
  }
  return rateLimitDistributed("signup:attempt:global", 3000, 3600);
}

/** Keep a site-wide abuse ceiling without treating every unknown IP as one visitor. */
export async function allowAuthRequest(
  req: Request,
  scope: string,
  perIpLimit: number,
  globalLimit: number,
  windowSeconds: number,
): Promise<boolean> {
  const ip = getClientIp(req);
  if (ip !== "unknown" && !(await rateLimitDistributed(`${scope}:ip:${ip}`, perIpLimit, windowSeconds))) {
    return false;
  }
  return rateLimitDistributed(`${scope}:global`, globalLimit, windowSeconds);
}

/** Limit account creation only after payload and uniqueness checks pass. */
export async function allowPublicSignup(req: Request): Promise<boolean> {
  const ip = getClientIp(req);
  // Some deployments do not provide a trusted client IP. Sharing a five-hit
  // "unknown" bucket would lock every visitor out after a few signups.
  if (ip !== "unknown" && !(await rateLimitDistributed(`signup:validated:ip:${ip}`, 5, 3600))) {
    return false;
  }
  return rateLimitDistributed("signup:validated:global", 300, 3600);
}
