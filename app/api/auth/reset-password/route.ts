import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError } from "@/lib/response-handlers";
import { otpMatches } from "@/lib/security/otp";
import { allowAuthRequest, rateLimitDistributed } from "@/lib/security/rate-limit";
import { passwordSchema } from "@/lib/auth/password-policy";

const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    otp: z.string().length(6),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const MAX_OTP_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password using OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, password, confirmPassword]
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, password } = resetPasswordSchema.parse(body);

    // Rate limit per account and trusted IP to prevent OTP brute-forcing.
    if (
      !(await rateLimitDistributed(`otp:reset:${email}`, MAX_OTP_ATTEMPTS, ATTEMPT_WINDOW_MS / 1000)) ||
      !(await allowAuthRequest(req, "otp:reset", MAX_OTP_ATTEMPTS * 5, 3000, ATTEMPT_WINDOW_MS / 1000))
    ) {
      return errorResponse("Too many attempts. Please try again later.", 429);
    }

    const { rows } = await db.query(
      "SELECT otp_code, otp_expiry FROM users WHERE email = $1 AND otp_purpose = 'reset'",
      [email],
    );

    // Generic message to avoid user enumeration.
    if (rows.length === 0) {
      return errorResponse("Invalid or expired OTP", 400);
    }

    const user = rows[0] as { otp_code: string; otp_expiry: Date | string };

    if (new Date() > new Date(user.otp_expiry)) {
      return errorResponse("Invalid or expired OTP", 400);
    }

    if (!otpMatches(otp, user.otp_code)) {
      return errorResponse("Invalid or expired OTP", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updated = await db.query(
      `UPDATE users SET password = $1, otp_code = NULL, otp_expiry = NULL, otp_purpose = NULL,
       is_verified = TRUE, token_version = COALESCE(token_version, 1) + 1, updated_at = NOW()
       WHERE email = $2 AND otp_code = $3 AND otp_expiry > NOW() AND otp_purpose = 'reset'`,
      [hashedPassword, email, user.otp_code],
    );
    if (updated.rowCount !== 1) return errorResponse("Invalid or expired OTP", 400);

    return successResponse(
      { message: "Password updated successfully." },
      "Password updated successfully.",
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Convert ZodError issues to ApiErrorDetail format
      const errorDetails = error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.map((p) => String(p)),
        code: issue.code,
      }));
      return errorResponse(errorDetails, 400);
    }
    console.error("Reset password error:", error);
    return handleApiError(error, "Internal Server Error");
  }
}
