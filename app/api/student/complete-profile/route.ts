import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import type { NextRequest } from "next/server";
import { signJWT } from "@/lib/auth";

const completeProfileSchema = z.object({
  fatherName: z.string().min(2, "Father's name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  class: z.string().min(1, "Class is required"),
  stream: z.string().optional(),
  city: z.string().min(1, "City is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const payload = await getUserFromRequest(req);
    if (!payload) return errorResponse("Invalid token", 401);

    // 2. Validate input
    const body = await req.json();
    const validatedData = completeProfileSchema.parse(body);

    // 3. Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // 4. Update user
    const { rowCount } = await db.query(
      `UPDATE users
       SET father_name = $1,
           dob = $2,
           gender = $3,
           class = $4,
           stream = $5,
           city = $6,
           password = $7,
           onboarding_completed = true,
           token_version = COALESCE(token_version, 1) + 1
       WHERE id = $8 AND registered_by_school = true`,
      [
        validatedData.fatherName,
        validatedData.dob,
        validatedData.gender,
        validatedData.class,
        validatedData.stream || null,
        validatedData.city,
        hashedPassword,
        payload.userId
      ]
    );

    // 5. Get updated user to return to frontend
    const { rows: userRows } = await db.query(
      `SELECT id, name, email, role, class, stream, city, school_name, points, registered_by_school, onboarding_completed, token_version
       FROM users WHERE id = $1`,
      [payload.userId]
    );

    const user = userRows[0];
    const token = await signJWT({ userId: user.id, email: user.email, role: user.role, tokenVersion: user.token_version });

    const response = successResponse(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        class: user.class,
        stream: user.stream || null,
        role: user.role,
        city: user.city || "Karachi",
        schoolName: user.school_name,
        points: user.points || 0,
        registeredBySchool: user.registered_by_school,
        onboardingCompleted: user.onboarding_completed,
      }, 
      "Profile completed successfully. Welcome to your dashboard!", 
      200
    );
    response.cookies.set("exboard_token", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues.map(i => ({ message: i.message, path: i.path.map(p => String(p)) })), 400);
    }
    console.error("Complete profile error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
