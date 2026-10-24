import { verifyJWT } from "@/lib/auth";
import { errorResponse } from "@/lib/response-handlers";
import { UserRole } from "@/types/enums";
import { db } from "@/lib/db";
import { getCurrentTokenUser } from "@/lib/security/auth-account";
import type { NextRequest } from "next/server";

const ALLOWED_ROLES = new Set<string>([
  UserRole.STUDENT,
  UserRole.SCHOOL,
  UserRole.TEACHER,
  UserRole.ADMIN,
  UserRole.QA,
  "student",
  "school",
  "teacher",
  "admin",
  "qa",
  "QA",
]);

/**
 * Middleware to verify authenticated app users (student, teacher, school, admin)
 */
export async function verifyUserAuth(request: NextRequest): Promise<{
  userId: string;
  email: string;
  role: string;
} | null> {
  let token: string | undefined;
  const authHeader = request.headers.get("authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    token = request.cookies.get("exboard_token")?.value;
  }

  if (!token) {
    return null;
  }

  let payload;
  try {
    payload = await verifyJWT(token);
  } catch (error: any) {
    if (
      error?.message?.includes("timed out") ||
      error?.message?.includes("expired")
    ) {
      throw error;
    }
    return null;
  }

  if (!payload?.userId || !payload.role || !ALLOWED_ROLES.has(payload.role)) {
    return null;
  }

  return await getCurrentTokenUser(payload);
}

/**
 * Helper to get user from request
 */
export async function getUserFromRequest(
  request: NextRequest,
): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    return await verifyUserAuth(request);
  } catch (error: any) {
    if (
      error?.message?.includes("timed out") ||
      error?.message?.includes("expired")
    ) {
      throw error;
    }
    console.error("Error in getUserFromRequest:", error);
    throw error;
  }
}
