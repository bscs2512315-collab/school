import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { randomBytes, randomInt, randomUUID } from "crypto";
import { sendOTPEmail } from "@/lib/email";
import { generateOTP, hashOTP } from "@/lib/security/otp";
import { OTP_CONFIG } from "@/constants";
import { OtpType } from "@/types/enums";
import { UserRole } from "@/types/enums";
import { verifyAuth } from "@/lib/auth-utils";

const addTeacherSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subjects: z.array(z.string()).min(1, "At least one subject is required"),
  classes: z.array(z.string()).min(1, "At least one class is required"),
});

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.SCHOOL) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const validatedData = addTeacherSchema.parse(body);

    // Check if email already exists
    const { rows: existingUsers } = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [validatedData.email],
    );

    if (existingUsers.length > 0) {
      return errorResponse("User already exists with this email", 400);
    }

    // Generate a temporary password
    const tempPassword = randomBytes(32).toString("base64url");
    const activationCode = generateOTP(OTP_CONFIG.LENGTH);
    const activationExpiry = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60_000);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const userId = randomUUID();
    
    // Generate username from name
    const baseUsername = validatedData.name.toLowerCase().replace(/\s+/g, '_').slice(0, 15);
    const username = `${baseUsername}_${randomInt(1000, 9999)}`;

    // Get school name
    const { rows: schools } = await db.query("SELECT name FROM users WHERE id = $1", [user.userId]);
    const schoolName = schools[0]?.name || "Your School";

    // Insert teacher
    await db.query(
      `INSERT INTO users (
        id, email, password, name, username, 
        subjects, classes, school_id, school_name, 
        role, is_verified, onboarding_completed, registered_by_school, otp_code, otp_expiry, otp_purpose
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        userId,
        validatedData.email,
        hashedPassword,
        validatedData.name,
        username,
        validatedData.subjects,
        validatedData.classes,
        user.userId,
        schoolName,
        UserRole.TEACHER,
        true,
        false,
        true,
        hashOTP(activationCode),
        activationExpiry,
        "reset",
      ],
    );

    try {
      await sendOTPEmail(validatedData.email, activationCode, OtpType.RESET);
    } catch (error) {
      console.error("Teacher invitation email failed; recipient can request a new reset code:", error);
    }

    return successResponse(
      { 
        id: userId, 
        username, 
        email: validatedData.email
      },
      "Teacher added. They can use Reset Password to set their password.",
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    console.error("Add Teacher error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
