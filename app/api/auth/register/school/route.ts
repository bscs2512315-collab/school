import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendOTPEmail } from "@/lib/email";
import { successResponse, errorResponse, handleApiError } from "@/lib/response-handlers";
import { randomUUID } from "crypto";
import { UserRole, OtpType } from "@/types/enums";
import { OTP_CONFIG } from "@/constants";
import { generateOTP, hashOTP } from "@/lib/security/otp";
import { allowPublicSignup, allowPublicSignupAttempt } from "@/lib/security/rate-limit";
import { passwordSchema } from "@/lib/auth/password-policy";

const schoolRegisterSchema = z
  .object({
    schoolName: z.string().min(2, "School name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 characters"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    city: z.string().min(1, "City is required"),
    studentCount: z.string().optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * @openapi
 * /api/auth/register/school:
 *   post:
 *     summary: Register a new school/organization with OTP verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [schoolName, email, phone, address, password, confirmPassword]
 *             properties:
 *               schoolName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               studentCount:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration initiated
 *       400:
 *         description: Validation error or user exists
 *       500:
 *         description: Internal server error
 */
export async function POST(req: Request) {
  try {
    if (!(await allowPublicSignupAttempt(req))) {
      return errorResponse("Too many signup attempts. Please try again in an hour.", 429);
    }
    const body = await req.json();
    const validatedData = schoolRegisterSchema.parse(body);

    // Lazy migration for city column
    try {
      await db.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'city') THEN
            ALTER TABLE users ADD COLUMN city VARCHAR(255) DEFAULT 'Karachi';
          END IF;
        END $$;
      `);
    } catch (dbError) {
      console.error("Migration error (school):", dbError);
    }

    const { rows: existingUsers } = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [validatedData.email],
    );

    if (existingUsers.length > 0) {
      return errorResponse("User already exists with this email", 400);
    }

    if (!(await allowPublicSignup(req))) {
      return errorResponse("Signup is temporarily limited. Please try again in an hour.", 429);
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const userId = randomUUID();

    // Generate OTP
    const otp = generateOTP(OTP_CONFIG.LENGTH);
    const otpExpiry = new Date(
      Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000,
    );

    // Insert user with SCHOOL role and extra fields
    // Note: class is set to NULL for schools as it's not applicable
    await db.query(
      `INSERT INTO users (id, email, password, name, school_name, phone, address, city, student_count, role, class, otp_code, otp_expiry, is_verified, otp_purpose)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        userId,
        validatedData.email,
        hashedPassword,
        validatedData.schoolName, // Using schoolName as 'name' as well for generic display
        validatedData.schoolName,
        validatedData.phone,
        validatedData.address,
        validatedData.city,
        validatedData.studentCount || null,
        UserRole.SCHOOL,
        null, // class is not applicable for schools
        hashOTP(otp),
        otpExpiry,
        false,
        "registration",
      ],
    );

    // Send OTP Email
    try {
      await sendOTPEmail(validatedData.email, otp, OtpType.REGISTRATION);
      console.log(`OTP email sent successfully to ${validatedData.email}`);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // Log the full error for debugging
      if (emailError instanceof Error) {
        console.error("Email error details:", {
          message: emailError.message,
          stack: emailError.stack,
        });
      }
      // We still registered the user, but they might need a resend
      // In production, you might want to return an error or queue a retry
    }

    return successResponse(
      { email: validatedData.email },
      "Registration initiated. Verification OTP sent.",
      201,
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
    console.error("School Registration error:", error);
    return handleApiError(error, "Internal Server Error");
  }
}
