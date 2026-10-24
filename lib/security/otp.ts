import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { OTP_CONFIG } from "@/constants";

/**
 * Generate a cryptographically-secure numeric OTP using a CSPRNG.
 * Do NOT use Math.random() for security-sensitive values.
 */
export function generateOTP(length: number = OTP_CONFIG.LENGTH): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return randomInt(min, max + 1).toString();
}

/**
 * Constant-time comparison of two OTP strings to avoid timing side-channels.
 * Returns false for empty/mismatched-length inputs.
 */
export function hashOTP(input: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required to hash OTPs");
  return createHmac("sha256", secret).update(input).digest("hex");
}

export function otpMatches(input: string, expected: string | null | undefined): boolean {
  if (!expected || !input) return false;
  const a = Buffer.from(hashOTP(input));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
