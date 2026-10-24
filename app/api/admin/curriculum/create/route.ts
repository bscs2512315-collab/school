import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { z } from "zod";
import { Class, Board, Subject } from "@/types/enums";
import { randomUUID } from "crypto";

/**
 * @openapi
 * /api/admin/curriculum/create:
 *   post:
 *     summary: Create a new curriculum (metadata only)
 *     description: Create a curriculum entry with class, board, and subject. Chapters will be added separately.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [class, board, subject]
 *             properties:
 *               class:
 *                 type: string
 *                 enum: [IX, X, XI, XII]
 *               board:
 *                 type: string
 *                 enum: [AKUEB, Sindh Board, Punjab Board, KPK Board, Balochistan Board, Federal Board]
 *               subject:
 *                 type: string
 *                 enum: [English, Urdu, Mathematics, Pakistan Studies, Islamiat, Physics, Chemistry, Biology]
 *     responses:
 *       201:
 *         description: Curriculum created successfully
 *       400:
 *         description: Validation error or curriculum already exists
 *       401:
 *         description: Unauthorized - Admin access required
 */
const chapterSchema = z.object({
  chapterNumber: z.number().int().positive(),
  chapterName: z.string().min(1),
});

const createSchema = z.object({
  class: z.nativeEnum(Class),
  board: z.nativeEnum(Board),
  subject: z.nativeEnum(Subject),
  chapters: z.array(chapterSchema).min(1, "At least one chapter is required"),
});

/**
 * POST /api/admin/curriculum/create
 * Create a new curriculum (metadata only)
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const body = await request.json();
    const validatedData = createSchema.parse(body);

    // Check if curriculum already exists
    let existing;
    try {
      const result = await db.query(
        `SELECT id FROM curriculums WHERE class = $1 AND board = $2 AND subject = $3`,
        [validatedData.class, validatedData.board, validatedData.subject],
      );
      existing = result.rows;
    } catch (dbError: any) {
      console.error("Database query error:", dbError);
      if (dbError.message?.includes("socket") || dbError.message?.includes("TLS")) {
        return errorResponse(
          "Database connection error. Please try again in a moment.",
          503,
        );
      }
      throw dbError;
    }

    if (existing.length > 0) {
      return errorResponse(
        "Curriculum for this class, board, and subject already exists",
        409,
      );
    }

    // Create curriculum
    const curriculumId = randomUUID();
    try {
      await db.query(
        `INSERT INTO curriculums (id, class, board, subject, uploaded_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [curriculumId, validatedData.class, validatedData.board, validatedData.subject, admin.userId],
      );
    } catch (dbError: any) {
      console.error("Database insert error:", dbError);
      if (dbError.message?.includes("socket") || dbError.message?.includes("TLS")) {
        return errorResponse(
          "Database connection error. Please try again in a moment.",
          503,
        );
      }
      throw dbError;
    }

    // Create chapters
    const chapterIds: string[] = [];
    for (const chapter of validatedData.chapters) {
      const chapterId = randomUUID();
      try {
        await db.query(
          `INSERT INTO chapters (id, curriculum_id, chapter_number, chapter_name)
           VALUES ($1, $2, $3, $4)`,
          [
            chapterId,
            curriculumId,
            chapter.chapterNumber,
            chapter.chapterName,
          ],
        );
        chapterIds.push(chapterId);
      } catch (dbError: any) {
        console.error("Database chapter insert error:", dbError);
        if (dbError.message?.includes("socket") || dbError.message?.includes("TLS")) {
          return errorResponse(
            "Database connection error while saving chapters. Please try again in a moment.",
            503,
          );
        }
        throw dbError;
      }
    }

    return successResponse(
      {
        id: curriculumId,
        class: validatedData.class,
        board: validatedData.board,
        subject: validatedData.subject,
        chaptersCount: validatedData.chapters.length,
      },
      `Curriculum created successfully with ${validatedData.chapters.length} chapter(s).`,
      201,
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
    console.error("Create curriculum error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      500,
    );
  }
}

