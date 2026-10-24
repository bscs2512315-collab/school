import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendOTPEmail } from "@/lib/email";
import { successResponse, errorResponse, handleApiError } from "@/lib/response-handlers";
import { randomUUID } from "crypto";
import { UserRole, OtpType, Board } from "@/types/enums";
import { OTP_CONFIG } from "@/constants";
import { generateOTP, hashOTP } from "@/lib/security/otp";
import { allowPublicSignup, allowPublicSignupAttempt } from "@/lib/security/rate-limit";
import { passwordSchema } from "@/lib/auth/password-policy";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const teacherRegisterSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    subjects: z.array(z.string()).min(1, "At least one subject is required"),
    classes: z.array(z.string()).min(1, "At least one class is required"),
    schoolId: z.string().optional(),
    schoolName: z.string().min(1, "School name is required"),
    board: z.nativeEnum(Board),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  try {
    if (!(await allowPublicSignupAttempt(req))) {
      return errorResponse("Too many signup attempts. Please try again in an hour.", 429);
    }
    const body = await req.json();
    const validatedData = teacherRegisterSchema.parse(body);

    // Check if email already exists
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

    // Insert user with TEACHER role
    await db.query(
      `INSERT INTO users (
        id, email, password, name, username, 
        subjects, classes, school_id, school_name, board,
        role, otp_code, otp_expiry, is_verified, otp_purpose
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        userId,
        validatedData.email,
        hashedPassword,
        validatedData.name,
        validatedData.username,
        validatedData.subjects,
        validatedData.classes,
        // The frontend's fallback school list uses the school name as a
        // placeholder id before /api/schools resolves, which isn't a valid
        // uuid — the school_id column is uuid-typed, so anything else must
        // be dropped to null instead of crashing the insert.
        validatedData.schoolId && UUID_PATTERN.test(validatedData.schoolId)
          ? validatedData.schoolId
          : null,
        validatedData.schoolName,
        validatedData.board,
        UserRole.TEACHER,
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
    }

    return successResponse(
      { email: validatedData.email },
      "Teacher registration initiated. Verification OTP sent.",
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.map((p) => String(p)),
        code: issue.code,
      }));
      return errorResponse(errorDetails, 400);
    }
    console.error("Teacher Registration error:", error);
    return handleApiError(error, "Internal Server Error");
  }
}
