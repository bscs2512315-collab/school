import { db } from "@/lib/db";
import { z } from "zod";
import { sendOTPEmail } from "@/lib/email";
import { successResponse, errorResponse, handleApiError } from "@/lib/response-handlers";
import { OtpType } from "@/types/enums";
import { OTP_CONFIG } from "@/constants";
import { generateOTP, hashOTP } from "@/lib/security/otp";
import { allowAuthRequest, rateLimitDistributed } from "@/lib/security/rate-limit";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const RESEND_LIMIT = 3;
const RESEND_WINDOW_MS = 15 * 60 * 1000;

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Rate limit OTP requests per account and trusted IP.
    if (
      !(await rateLimitDistributed(`otp:forgot:${email}`, RESEND_LIMIT, RESEND_WINDOW_MS / 1000)) ||
      !(await allowAuthRequest(req, "otp:forgot", RESEND_LIMIT * 5, 1000, RESEND_WINDOW_MS / 1000))
    ) {
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    const { rows } = await db.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    const genericMessage = "If an account exists with this email, a password reset OTP was sent.";

    // Always return a generic success message to avoid user enumeration.
    if (rows.length === 0) {
      return successResponse(
        { message: genericMessage },
        genericMessage,
      );
    }

    const otp = generateOTP(OTP_CONFIG.LENGTH);
    const otpExpiry = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

    await db.query(
      "UPDATE users SET otp_code = $1, otp_expiry = $2, otp_purpose = 'reset' WHERE email = $3",
      [hashOTP(otp), otpExpiry, email],
    );

    await sendOTPEmail(email, otp, OtpType.RESET);

    return successResponse(
      { message: genericMessage },
      genericMessage,
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
    console.error("Forgot password error:", error);
    return handleApiError(error, "Internal Server Error");
  }
}
