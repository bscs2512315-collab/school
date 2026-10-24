import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * PUT /api/admin/milestones/[id]
 * Updates a milestone
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return errorResponse("Unauthorized", 401);
  }

  const { id } = await params;

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
      `UPDATE milestones 
       SET level = $1, name = $2, points_required = $3, icon = $4, color = $5, bg_color = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [
        parseInt(level),
        name,
        parseInt(points_required),
        icon,
        color,
        bg_color,
        id,
      ],
    );

    if (rows.length === 0) {
      return errorResponse("Milestone not found", 404);
    }

    return successResponse(rows[0], "Milestone updated successfully");
  } catch (error) {
    console.error("Update milestone error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * DELETE /api/admin/milestones/[id]
 * Deletes a milestone
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return errorResponse("Unauthorized", 401);
  }

  const { id } = await params;

  try {
    const { rowCount } = await db.query(
      `DELETE FROM milestones WHERE id = $1`,
      [parseInt(id)],
    );

    if (rowCount === 0) {
      return errorResponse("Milestone not found", 404);
    }

    return successResponse({ deleted: true }, "Milestone deleted successfully");
  } catch (error) {
    console.error("Delete milestone error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
