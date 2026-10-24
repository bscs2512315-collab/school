/**
 * In-Memory Sliding Window Rate Limiter for serverless and Node environments.
 * Prevents brute-force, scraping, and endpoint abuse.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodically clean up stale entries (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      const validTimestamps = record.timestamps.filter((ts) => now - ts < 60000);
      if (validTimestamps.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, { timestamps: validTimestamps });
      }
    }
  }, 300000);
}

export interface RateLimitOptions {
  /** Time window in milliseconds (default: 60000 ms / 1 minute) */
  windowMs?: number;
  /** Maximum number of allowed requests in the window (default: 30) */
  maxRequests?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTimeMs: number;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {},
): RateLimitResult {
  const windowMs = options.windowMs || 60000;
  const maxRequests = options.maxRequests || 30;
  const now = Date.now();

  const record = rateLimitStore.get(identifier) || { timestamps: [] };
  // Filter out timestamps outside the sliding window
  const recentTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (recentTimestamps.length >= maxRequests) {
    const oldest = recentTimestamps[0];
    const resetTimeMs = windowMs - (now - oldest);
    return {
      allowed: false,
      remaining: 0,
      resetTimeMs: Math.max(0, resetTimeMs),
    };
  }

  recentTimestamps.push(now);
  rateLimitStore.set(identifier, { timestamps: recentTimestamps });

  return {
    allowed: true,
    remaining: maxRequests - recentTimestamps.length,
    resetTimeMs: windowMs,
  };
}
