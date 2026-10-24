import { verifyJWT } from "@/lib/auth";
import { errorResponse } from "@/lib/response-handlers";
import { UserRole } from "@/types/enums";
import type { NextRequest } from "next/server";
import { getCurrentTokenUser } from "@/lib/security/auth-account";

/**
 * Middleware to verify admin authentication
 */
export async function verifyAdminAuth(request: NextRequest): Promise<{
  userId: string;
  email: string;
  role: string;
} | null> {
  const authHeader = request.headers.get("authorization");
  
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : request.cookies.get("exboard_token")?.value;
  if (!token) return null;
  
  let payload;
  try {
    payload = await verifyJWT(token);
  } catch (error: any) {
    // If verifyJWT throws an error (like expired token), re-throw it
    // so the route handler can return the proper error message
    if (error?.message?.includes("timed out") || error?.message?.includes("expired")) {
      throw error; // Re-throw timeout/expiration errors
    }
    console.error("JWT verification failed:", error);
    return null;
  }

  if (!payload || payload.role !== UserRole.ADMIN) {
    return null;
  }

  return await getCurrentTokenUser(payload);
}

/**
 * Wrapper for admin API routes
 */
export function withAdminAuth(
  handler: (
    request: NextRequest,
    context: { userId: string; email: string },
  ) => Promise<Response>,
) {
  return async (request: NextRequest): Promise<Response> => {
    const admin = await verifyAdminAuth(request);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    return handler(request, {
      userId: admin.userId,
      email: admin.email,
    });
  };
}

/**
 * Helper to get admin from request (for use in route handlers)
 * Returns null if unauthorized, throws error if token expired
 */
export async function getAdminFromRequest(
  request: NextRequest,
): Promise<{ userId: string; email: string } | null> {
  try {
    return await verifyAdminAuth(request);
  } catch (error: any) {
    // Re-throw timeout/expiration errors so route handlers can return proper error
    if (error?.message?.includes("timed out") || error?.message?.includes("expired")) {
      throw error;
    }
    // For other errors, return null (unauthorized)
    console.error("Admin auth verification failed:", error);
    return null;
  }
}
