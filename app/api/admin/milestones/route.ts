import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/admin/milestones
 * Gets all milestones
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const { rows } = await db.query(
      `SELECT * FROM milestones ORDER BY points_required ASC`,
    );
    return successResponse(rows);
  } catch (error) {
    console.error("Fetch milestones error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * POST /api/admin/milestones
 * Create a new milestone
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const { level, name, points_required, icon, color, bg_color } = body;

    if (
      level === undefined ||
      !name ||
      points_required === undefined ||
      !icon ||
      !color ||
      !bg_color
    ) {
      return errorResponse("Missing required fields", 400);
    }

    const { rows } = await db.query(
      `INSERT INTO milestones (level, name, points_required, icon, color, bg_color) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [parseInt(level), name, parseInt(points_required), icon, color, bg_color],
    );

    return successResponse(rows[0], "Milestone created successfully", 201);
  } catch (error) {
    console.error("Create milestone error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
