import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * PUT /api/admin/subjects/[id]
 * Update a subject (rename / toggle active)
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
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return errorResponse("Subject name is required", 400);
    }

    // Prevent renaming into an existing (other) subject's name.
    const { rows: clash } = await db.query(
      `SELECT id FROM subjects WHERE LOWER(name) = LOWER($1) AND id <> $2`,
      [name, id],
    );
    if (clash.length > 0) {
      return errorResponse("A subject with this name already exists", 409);
    }

    const category =
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim()
        : null;

    const { rows } = await db.query(
      `UPDATE subjects
       SET name = $1, category = $2, coming_soon = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, name, category, coming_soon, is_active, created_at, updated_at`,
      [
        name,
        category,
        Boolean(body.comingSoon),
        body.isActive === undefined ? true : Boolean(body.isActive),
        id,
      ],
    );

    if (rows.length === 0) {
      return errorResponse("Subject not found", 404);
    }

    return successResponse(rows[0], "Subject updated successfully");
  } catch (error) {
    console.error("Update subject error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * DELETE /api/admin/subjects/[id]
 * Delete a subject
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
      `DELETE FROM subjects WHERE id = $1`,
      [id],
    );

    if (rowCount === 0) {
      return errorResponse("Subject not found", 404);
    }

    return successResponse({ deleted: true }, "Subject deleted successfully");
  } catch (error) {
    console.error("Delete subject error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
