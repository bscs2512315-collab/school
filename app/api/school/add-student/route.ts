import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { randomBytes, randomUUID } from "crypto";
import { UserRole } from "@/types/enums";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import type { NextRequest } from "next/server";
import { sendOTPEmail } from "@/lib/email";
import { generateOTP, hashOTP } from "@/lib/security/otp";
import { OTP_CONFIG } from "@/constants";
import { OtpType } from "@/types/enums";

const addStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  registrationId: z.string().min(1, "Registration ID is required"),
});

function generateRandomPassword(length = 10): string {
  // Generate cryptographically secure alphanumeric password
  return randomBytes(length).toString("base64url").slice(0, length);
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate and check if user is a SCHOOL
    const payload = await getUserFromRequest(req);
    if (!payload || payload.role !== UserRole.SCHOOL) {
      return errorResponse("Only schools can add students directly", 403);
    }

    // 2. Get school details to link student
    const { rows: schoolRows } = await db.query(
      "SELECT name, city FROM users WHERE id = $1",
      [payload.userId]
    );

    if (schoolRows.length === 0) return errorResponse("School account not found", 404);
    const school = schoolRows[0];

    // 3. Validate input
    const body = await req.json();
    const validatedData = addStudentSchema.parse(body);

    // Generate credentials
    const password = generateRandomPassword(32);
    const activationCode = generateOTP(OTP_CONFIG.LENGTH);
    const activationExpiry = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60_000);
    const username = validatedData.email.split("@")[0] + "_" + Math.floor(1000 + Math.random() * 9000);

    // 4. Check for existing user
    const { rows: existingUsers } = await db.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [validatedData.email.toLowerCase(), username.toLowerCase()]
    );

    if (existingUsers.length > 0) {
      return errorResponse("Email already exists or generated username is taken. Please try again.", 400);
    }

    // 5. Create student
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    await db.query(
      `INSERT INTO users (id, email, password, name, school_name, city, username, role, is_verified, registered_by_school, registration_id, onboarding_completed, otp_code, otp_expiry, school_id, otp_purpose)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        userId,
        validatedData.email.toLowerCase(),
        hashedPassword,
        validatedData.name,
        school.name,
        school.city,
        username.toLowerCase(),
        UserRole.STUDENT,
        true, // Pre-verified
        true, // Registered by school
        validatedData.registrationId,
        false, // Onboarding not completed
        hashOTP(activationCode),
        activationExpiry,
        payload.userId,
        "reset",
      ]
    );

    // 6. Send welcome email with credentials
    try {
      await sendOTPEmail(validatedData.email, activationCode, OtpType.RESET);
    } catch (emailError) {
      console.error("Failed to send welcome email, but student was created:", emailError);
      // We don't fail the request here, as the student is already created.
      // The recipient can request a fresh reset code if delivery failed.
    }

    return successResponse(
      { 
        id: userId, 
        email: validatedData.email,
        username,
      },
      "Student added. They can use Reset Password to set their password.",
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues.map(i => ({ message: i.message, path: i.path.map(p => String(p)) })), 400);
    }
    console.error("Add student error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
