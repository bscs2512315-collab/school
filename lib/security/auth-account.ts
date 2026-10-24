import { db } from "@/lib/db";
import type { JWTPayload } from "@/types/auth";

/** A signed JWT is usable only while its account and token version are current. */
export async function getCurrentTokenUser(payload: JWTPayload) {
  if (!payload.userId || !payload.role || !Number.isInteger(payload.tokenVersion)) return null;
  try {
    const { rows } = await db.query<{
      id: string; email: string; role: string; is_verified: boolean; token_version: number | null;
    }>("SELECT id, email, role, is_verified, token_version FROM users WHERE id = $1", [payload.userId]);
    const account = rows[0];
    if (!account || !account.is_verified || account.role !== payload.role ||
        Number(account.token_version ?? 1) !== payload.tokenVersion) return null;
    return { userId: account.id, email: account.email, role: account.role };
  } catch (error) {
    console.error("Database error during token verification in getCurrentTokenUser:", error);
    throw error;
  }
}
