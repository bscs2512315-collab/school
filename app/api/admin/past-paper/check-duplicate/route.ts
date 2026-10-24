import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { z } from "zod";
import { Class, Board, Subject } from "@/types/enums";

/**
 * @openapi
 * /api/admin/past-paper/check-duplicate:
 *   post:
 *     summary: Check if past paper already exists
 *     description: Check if a past paper with the same class, board, subject, and year already exists
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [class, board, subject, year]
 *             properties:
 *               class:
 *                 type: string
 *                 enum: [IX, X, XI, XII]
 *               board:
 *                 type: string
 *               subject:
 *                 type: string
 *               year:
 *                 type: integer
 *                 minimum: 2015
 *     responses:
 *       200:
 *         description: Duplicate check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     exists:
 *                       type: boolean
 *                     pastPaper:
 *                       type: object
 *                       description: Past paper details if exists
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Admin access required
 */
const checkSchema = z.object({
  class: z.nativeEnum(Class),
  board: z.nativeEnum(Board),
  subject: z.nativeEnum(Subject),
  year: z.number().int().min(2015).max(new Date().getFullYear()),
  paperNumber: z.number().int().min(1).max(2),
});

/**
 * POST /api/admin/past-paper/check-duplicate
 * Check if past paper already exists
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const body = await request.json();
    const validatedData = checkSchema.parse(body);

    const { rows } = await db.query(
      `SELECT id, file_name, created_at, status FROM past_papers 
       WHERE class = $1 AND board = $2 AND subject = $3 AND year = $4 AND paper_number = $5`,
      [
        validatedData.class,
        validatedData.board,
        validatedData.subject,
        validatedData.year,
        validatedData.paperNumber,
      ],
    );

    if (rows.length > 0) {
      return successResponse(
        {
          exists: true,
          pastPaper: rows[0],
        },
        "Past paper already exists",
      );
    }

    return successResponse(
      {
        exists: false,
      },
      "Past paper does not exist",
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.map((p) => String(p)),
        code: issue.code,
      }));
      return errorResponse(errorDetails, 400);
    }
    console.error("Check duplicate error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      500,
    );
  }
}
