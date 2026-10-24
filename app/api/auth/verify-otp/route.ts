import { db } from "@/lib/db";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError } from "@/lib/response-handlers";
import { otpMatches } from "@/lib/security/otp";
import { allowAuthRequest, rateLimitDistributed } from "@/lib/security/rate-limit";

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

const MAX_OTP_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

/**
 * @openapi
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify user OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp } = verifyOtpSchema.parse(body);

    // Rate limit per account and trusted IP to prevent OTP brute-forcing.
    if (
      !(await rateLimitDistributed(`otp:verify:${email}`, MAX_OTP_ATTEMPTS, ATTEMPT_WINDOW_MS / 1000)) ||
      !(await allowAuthRequest(req, "otp:verify", MAX_OTP_ATTEMPTS * 5, 3000, ATTEMPT_WINDOW_MS / 1000))
    ) {
      return errorResponse("Too many attempts. Please try again later.", 429);
    }

    const { rows } = await db.query(
      "SELECT id, otp_code, otp_expiry FROM users WHERE email = $1 AND otp_purpose = 'registration'",
      [email],
    );

    // Generic message to avoid user enumeration.
    if (rows.length === 0) {
      return errorResponse("Invalid or expired OTP", 400);
    }

    const user = rows[0] as { otp_code: string; otp_expiry: Date | string };

    if (new Date() > new Date(user.otp_expiry)) {
      return errorResponse("OTP has expired", 400);
    }

    if (!otpMatches(otp, user.otp_code)) {
      return errorResponse("Invalid OTP code", 400);
    }

    // Success - mark as verified and clear OTP
    const updated = await db.query(
      `UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expiry = NULL, otp_purpose = NULL
       WHERE email = $1 AND otp_code = $2 AND otp_expiry > NOW()
         AND is_verified = FALSE AND otp_purpose = 'registration'`,
      [email, user.otp_code],
    );
    if (updated.rowCount !== 1) return errorResponse("Invalid or expired OTP", 400);

    return successResponse(
      { message: "Account verified successfully" },
      "Account verified successfully",
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
    console.error("OTP verification error:", error);
    return handleApiError(error, "Internal Server Error");
  }
}
