/**
 * Gemini API Key Rotation and Failover Manager
 *
 * Automatically detects multiple Gemini API keys from environment variables,
 * tracks rate limits / quota exhaustion, and seamlessly rotates to backup keys
 * when one key hits quota limits or fails.
 */

interface KeyState {
  key: string;
  cooldownUntil: number;
  failureCount: number;
  lastUsedAt: number;
}

const keyStates = new Map<string, KeyState>();
let activeKeyIndex = 0;

/**
 * Mask an API key for safe logging (e.g. "AIzaSy...8TA4")
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return "***";
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

/**
 * Collect all available Gemini API keys from environment variables.
 * Supports:
 * - Comma / semicolon / whitespace separated list in `GEMINI_API_KEY`
 * - `GEMINI_API_KEYS`
 * - `GEMINI_API_KEY_FALLBACK`, `GEMINI_API_KEY_SECONDARY`
 * - Numbered keys: `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`, etc.
 */
export function getGeminiApiKeys(): string[] {
  const rawKeys: string[] = [];

  const mainEnv = process.env.GEMINI_API_KEY;
  if (mainEnv) {
    rawKeys.push(...mainEnv.split(/[,;\s\n\r]+/).map((k) => k.trim()));
  }

  const multiEnv = process.env.GEMINI_API_KEYS;
  if (multiEnv) {
    rawKeys.push(...multiEnv.split(/[,;\s\n\r]+/).map((k) => k.trim()));
  }

  const fallbackEnv = process.env.GEMINI_API_KEY_FALLBACK || process.env.GEMINI_API_KEY_SECONDARY;
  if (fallbackEnv) {
    rawKeys.push(...fallbackEnv.split(/[,;\s\n\r]+/).map((k) => k.trim()));
  }

  // Check numbered variables (e.g. GEMINI_API_KEY_2, GEMINI_API_KEY_3)
  for (let i = 1; i <= 10; i++) {
    const numberedKey = process.env[`GEMINI_API_KEY_${i}`];
    if (numberedKey) {
      rawKeys.push(numberedKey.trim());
    }
  }

  // Filter out empty, comments, or malformed entries, and deduplicate preserving order
  const uniqueKeys = Array.from(
    new Set(
      rawKeys.filter(
        (key) =>
          typeof key === "string" &&
          key.length > 5 &&
          !key.startsWith("#") &&
          !key.startsWith("//"),
      ),
    ),
  );

  return uniqueKeys;
}

/**
 * Check if an error message indicates quota exhaustion or rate limit.
 */
export function isQuotaOrRateLimitError(errorMessage: string): boolean {
  const m = errorMessage.toLowerCase();
  return (
    m.includes("429") ||
    m.includes("quota") ||
    m.includes("resource_exhausted") ||
    m.includes("rate limit") ||
    m.includes("rate_limit_exceeded") ||
    m.includes("too many requests") ||
    m.includes("exceeded your current quota") ||
    m.includes("overloaded") ||
    m.includes("503")
  );
}

/**
 * Check if an error message indicates an invalid or unauthorized API key.
 */
export function isAuthOrInvalidKeyError(errorMessage: string): boolean {
  const m = errorMessage.toLowerCase();
  return (
    m.includes("api key invalid") ||
    m.includes("api_key_invalid") ||
    m.includes("api key not valid") ||
    m.includes("permission_denied") ||
    m.includes("invalid api key") ||
    m.includes("api_key_not_found") ||
    (m.includes("api key") && m.includes("invalid"))
  );
}

/**
 * Get all available keys in priority order:
 * First non-cooldown keys (starting from active key index), then any in-cooldown keys.
 */
export function getOrderedApiKeys(): string[] {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) return [];

  const now = Date.now();

  // Initialize state map for new keys
  for (const key of keys) {
    if (!keyStates.has(key)) {
      keyStates.set(key, {
        key,
        cooldownUntil: 0,
        failureCount: 0,
        lastUsedAt: 0,
      });
    }
  }

  // Partition into available vs cooling down
  const available: string[] = [];
  const coolingDown: Array<{ key: string; cooldownUntil: number }> = [];

  for (let i = 0; i < keys.length; i++) {
    const idx = (activeKeyIndex + i) % keys.length;
    const key = keys[idx];
    const state = keyStates.get(key);

    if (!state || state.cooldownUntil <= now) {
      available.push(key);
    } else {
      coolingDown.push({ key, cooldownUntil: state.cooldownUntil });
    }
  }

  // Sort cooling-down keys by earliest expiry
  coolingDown.sort((a, b) => a.cooldownUntil - b.cooldownUntil);

  return [...available, ...coolingDown.map((item) => item.key)];
}

/**
 * Get current primary active API key.
 */
export function getActiveGeminiApiKey(): string {
  const ordered = getOrderedApiKeys();
  if (ordered.length === 0) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }
  return ordered[0];
}

/**
 * Mark a key as having exceeded its quota (triggers temporary cooldown & auto-shift to next key).
 */
export function markKeyQuotaExceeded(key: string, reason?: string): void {
  const state = keyStates.get(key) || {
    key,
    cooldownUntil: 0,
    failureCount: 0,
    lastUsedAt: Date.now(),
  };

  state.failureCount++;
  const isHighDemand = reason && (reason.includes("503") || reason.toLowerCase().includes("high demand") || reason.toLowerCase().includes("overloaded"));
  // 3s cooldown for transient 503 high-demand, 30s for 429 quota limits
  state.cooldownUntil = Date.now() + (isHighDemand ? 3_000 : 30_000);
  state.lastUsedAt = Date.now();
  keyStates.set(key, state);

  const keys = getGeminiApiKeys();
  if (keys.length > 1) {
    // Advance active key index to the next key
    const currentIndex = keys.indexOf(key);
    if (currentIndex !== -1) {
      activeKeyIndex = (currentIndex + 1) % keys.length;
    }
    const nextKey = keys[activeKeyIndex];
    console.warn(
      `[gemini-keys] Key ${maskApiKey(key)} hit quota (${reason || "429"}). Auto-shifting to fallback key ${maskApiKey(nextKey)}...`,
    );
  } else {
    console.warn(
      `[gemini-keys] Key ${maskApiKey(key)} hit quota (${reason || "429"}). Only 1 key configured.`,
    );
  }
}

/**
 * Mark a key as invalid/unauthorized (long cooldown).
 */
export function markKeyInvalid(key: string, reason?: string): void {
  const state = keyStates.get(key) || {
    key,
    cooldownUntil: 0,
    failureCount: 0,
    lastUsedAt: Date.now(),
  };

  state.failureCount++;
  // 1-hour cooldown for invalid keys
  state.cooldownUntil = Date.now() + 3600_000;
  state.lastUsedAt = Date.now();
  keyStates.set(key, state);

  const keys = getGeminiApiKeys();
  if (keys.length > 1) {
    const currentIndex = keys.indexOf(key);
    if (currentIndex !== -1) {
      activeKeyIndex = (currentIndex + 1) % keys.length;
    }
    const nextKey = keys[activeKeyIndex];
    console.warn(
      `[gemini-keys] Key ${maskApiKey(key)} is invalid/unauthorized (${reason || "auth error"}). Switching to key ${maskApiKey(nextKey)}...`,
    );
  }
}

/**
 * Mark a key as successfully responding (clears cooldown and failure count).
 */
export function markKeySuccess(key: string): void {
  const state = keyStates.get(key);
  if (state) {
    state.failureCount = 0;
    state.cooldownUntil = 0;
    state.lastUsedAt = Date.now();
  }
}
