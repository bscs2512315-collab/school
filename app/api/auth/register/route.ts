import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendOTPEmail } from "@/lib/email";
import { successResponse, errorResponse, handleApiError } from "@/lib/response-handlers";
import { randomUUID } from "crypto";
import { OtpType } from "@/types/enums";
import { OTP_CONFIG } from "@/constants";
import { generateOTP, hashOTP } from "@/lib/security/otp";
import { allowPublicSignup, allowPublicSignupAttempt } from "@/lib/security/rate-limit";
import { passwordSchema } from "@/lib/auth/password-policy";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    fatherName: z
      .string()
      .min(2, "Father's name must be at least 2 characters"),
    dob: z.string().optional(),
    gender: z.enum(["Male", "Female", "Other"]).or(z.literal("")).optional(),
    email: z.string().email("Invalid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    password: passwordSchema,
    confirmPassword: z.string(),
    class: z.string(),
    stream: z.string().optional(),
    schoolName: z.string().min(1, "School name is required"),
    city: z.string().min(1, "City is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new student with OTP verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, fatherName, email, password, confirmPassword, class, schoolName]
 *             properties:
 *               name:
 *                 type: string
 *               fatherName:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *               class:
 *                 type: string
 *               schoolName:
 *                 type: string
 */
export async function POST(req: Request) {
  try {
    if (!(await allowPublicSignupAttempt(req))) {
      return errorResponse("Too many signup attempts. Please try again in an hour.", 429);
    }
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Lazy migration for columns
    try {
      await db.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'city') THEN
            ALTER TABLE users ADD COLUMN city VARCHAR(255) DEFAULT 'Karachi';
          END IF;
          IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'username') THEN
            ALTER TABLE users ADD COLUMN username VARCHAR(100) UNIQUE;
          END IF;
        END $$;
      `);
    } catch (dbError) {
      console.error("Migration error:", dbError);
    }

    const { rows: existingUsers } = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [validatedData.email],
    );

    if (existingUsers.length > 0) {
      return errorResponse("User already exists with this email", 400);
    }

    // Check username uniqueness
    const { rows: existingUsername } = await db.query(
      "SELECT id FROM users WHERE username = $1",
      [validatedData.username],
    );
    if (existingUsername.length > 0) {
      return errorResponse("This username is already taken", 400);
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

    await db.query(
      `INSERT INTO users (id, email, password, name, father_name, dob, gender, class, stream, school_name, city, username, otp_code, otp_expiry, is_verified, otp_purpose)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        userId,
        validatedData.email,
        hashedPassword,
        validatedData.name,
        validatedData.fatherName,
        validatedData.dob || null,
        validatedData.gender || null,
        validatedData.class,
        validatedData.stream || null,
        validatedData.schoolName,
        validatedData.city,
        validatedData.username,
        hashOTP(otp),
        otpExpiry,
        false,
        "registration",
      ],
    );

    // Send OTP Email
    try {
      await sendOTPEmail(validatedData.email, otp, OtpType.REGISTRATION);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // We still registered the user, but they might need a resend
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
    console.error("Registration error:", error);
    return handleApiError(error, "Internal Server Error");
  }
}
