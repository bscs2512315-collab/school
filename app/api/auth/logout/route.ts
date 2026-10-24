import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { db } from "@/lib/db";

/**
 * POST /api/auth/logout
 * Server-side logout: increments user's token_version to invalidate all active JWTs,
 * and clears the session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user?.userId) {
      const response = errorResponse("Unauthorized", 401);
      response.cookies.set("exboard_token", "", {
        path: "/", expires: new Date(0), httpOnly: true,
        secure: process.env.NODE_ENV === "production", sameSite: "lax",
      });
      return response;
    }
    await db.query(
        "UPDATE users SET token_version = COALESCE(token_version, 1) + 1, updated_at = NOW() WHERE id = $1",
        [user.userId],
      );

    const response = successResponse({ loggedOut: true }, "Logged out successfully");

    // Clear server cookie
    response.cookies.set("exboard_token", "", {
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return errorResponse("Could not revoke session", 503);
  }
}
