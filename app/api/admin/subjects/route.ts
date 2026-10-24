import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/admin/subjects
 * Gets all subjects (including inactive)
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const { rows } = await db.query(
      `SELECT id, name, category, coming_soon, is_active, created_at, updated_at
       FROM subjects ORDER BY category NULLS FIRST, name ASC`,
    );
    return successResponse(rows);
  } catch (error) {
    console.error("Fetch subjects error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * POST /api/admin/subjects
 * Create a new subject
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return errorResponse("Subject name is required", 400);
    }

    const { rows: existing } = await db.query(
      `SELECT id FROM subjects WHERE LOWER(name) = LOWER($1)`,
      [name],
    );
    if (existing.length > 0) {
      return errorResponse("A subject with this name already exists", 409);
    }

    const category =
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim()
        : null;

    const { rows } = await db.query(
      `INSERT INTO subjects (name, category, coming_soon, is_active) VALUES ($1, $2, $3, $4)
       RETURNING id, name, category, coming_soon, is_active, created_at, updated_at`,
      [
        name,
        category,
        Boolean(body.comingSoon),
        body.isActive === undefined ? true : Boolean(body.isActive),
      ],
    );

    return successResponse(rows[0], "Subject created successfully", 201);
  } catch (error) {
    console.error("Create subject error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
