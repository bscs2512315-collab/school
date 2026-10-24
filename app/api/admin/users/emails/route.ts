import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { successResponse, errorResponse } from "@/lib/response-handlers";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const limit = 10;

    const { rows: schools } = await db.query<{ id: string; name: string; email: string }>(
      `SELECT id, name, email
       FROM users
       WHERE role = 'SCHOOL'
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit],
    );

    const { rows: teachers } = await db.query<{ id: string; name: string; email: string }>(
      `SELECT id, name, email
       FROM users
       WHERE role = 'TEACHER'
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit],
    );

    return successResponse(
      {
        schools,
        teachers,
      },
      "Teacher/School emails retrieved successfully",
    );
  } catch (error) {
    console.error("Admin users emails error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

