import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload } from "@/types/auth";
import { JWT_CONFIG } from "@/constants";

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
  throw new Error(
    "JWT_SECRET environment variable is not set. Refusing to use an insecure default secret.",
  );
}
const secret = new TextEncoder().encode(rawSecret);

export async function signJWT(payload: JWTPayload): Promise<string> {
  const jwt = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || JWT_CONFIG.DEFAULT_EXPIRY)
    .sign(secret);
  return jwt;
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      // Add clock tolerance for time sync issues
      clockTolerance: "1m",
    });
    return payload as unknown as JWTPayload;
  } catch (error: any) {
    // Provide more specific error information
    if (error?.code === "ERR_JWT_EXPIRED" || error?.message?.includes("expired")) {
      console.error("JWT token expired");
      throw new Error("Authentication timed out. Please log in again.");
    }
    if (error?.code === "ERR_JWT_INVALID" || error?.message?.includes("invalid")) {
      console.error("JWT token invalid:", error.message);
      return null;
    }
    console.error("JWT verification error:", error);
    return null;
  }
}
