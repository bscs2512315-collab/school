import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { z } from "zod";
import { randomUUID } from "crypto";

/**
 * @openapi
 * /api/admin/curriculum/{id}/chapters:
 *   post:
 *     summary: Add a chapter to curriculum
 *     description: Add a chapter with either PDF upload or plain text. AI will analyze the content.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Curriculum ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [chapterNumber, chapterName]
 *             properties:
 *               chapterNumber:
 *                 type: integer
 *               chapterName:
 *                 type: string
 *               content:
 *                 type: string
 *                 description: Plain text content (if not uploading PDF)
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF file for this chapter (optional if content is provided)
 *     responses:
 *       201:
 *         description: Chapter added and analyzed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Curriculum not found
 *   get:
 *     summary: Get all chapters for a curriculum
 *     description: Retrieve all chapters for a specific curriculum
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Curriculum ID
 *     responses:
 *       200:
 *         description: Chapters retrieved successfully
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Curriculum not found
 */
const addChapterSchema = z.object({
  chapterNumber: z.coerce.number().int().positive(),
  chapterName: z.string().min(1),
});

/**
 * POST /api/admin/curriculum/[id]/chapters
 * Add a chapter to curriculum
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const { id: curriculumId } = await params;
    
    // Verify curriculum exists
    const { rows: curriculums } = await db.query(
      `SELECT id FROM curriculums WHERE id = $1`,
      [curriculumId],
    );

    if (curriculums.length === 0) {
      return errorResponse("Curriculum not found", 404);
    }

    // Support both JSON and formData
    let chapterNumber: string;
    let chapterName: string;
    
    const contentType = request.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const body = await request.json();
      chapterNumber = body.chapterNumber?.toString();
      chapterName = body.chapterName;
    } else {
      const formData = await request.formData();
      chapterNumber = formData.get("chapterNumber") as string;
      chapterName = formData.get("chapterName") as string;
    }

    // Validate
    const validatedData = addChapterSchema.parse({
      chapterNumber,
      chapterName,
    });

    // Check if chapter number already exists for this curriculum
    const { rows: existing } = await db.query(
      `SELECT id FROM chapters WHERE curriculum_id = $1 AND chapter_number = $2`,
      [curriculumId, validatedData.chapterNumber],
    );

    if (existing.length > 0) {
      return errorResponse(
        `Chapter ${validatedData.chapterNumber} already exists for this curriculum`,
        409,
      );
    }

    // Save chapter (no content required)
    const chapterId = randomUUID();
    await db.query(
      `INSERT INTO chapters (id, curriculum_id, chapter_number, chapter_name)
       VALUES ($1, $2, $3, $4)`,
      [
        chapterId,
        curriculumId,
        validatedData.chapterNumber,
        validatedData.chapterName,
      ],
    );

    // Update curriculum updated_at
    await db.query(
      `UPDATE curriculums SET updated_at = NOW() WHERE id = $1`,
      [curriculumId],
    );

    return successResponse(
      {
        id: chapterId,
        chapterNumber: validatedData.chapterNumber,
        chapterName: validatedData.chapterName,
      },
      "Chapter added successfully",
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
    console.error("Add chapter error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      500,
    );
  }
}

/**
 * GET /api/admin/curriculum/[id]/chapters
 * Get all chapters for a curriculum
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const { id: curriculumId } = await params;

    // Verify curriculum exists
    const { rows: curriculums } = await db.query(
      `SELECT id FROM curriculums WHERE id = $1`,
      [curriculumId],
    );

    if (curriculums.length === 0) {
      return errorResponse("Curriculum not found", 404);
    }

    // Get all chapters
    const { rows: chapters } = await db.query<{
      id: string;
      chapter_number: number;
      chapter_name: string;
      description: string | null;
      content: string | null;
      content_type: string | null;
      analyzed_content: string | null;
      created_at: Date;
      updated_at: Date;
      is_analyzed: boolean;
    }>(
      `SELECT 
        id,
        chapter_number,
        chapter_name,
        description,
        content,
        content_type,
        analyzed_content,
        created_at,
        updated_at,
        CASE 
          WHEN analyzed_content IS NOT NULL THEN true 
          ELSE false 
        END as is_analyzed
       FROM chapters 
       WHERE curriculum_id = $1
       ORDER BY chapter_number ASC`,
      [curriculumId],
    );

    const chaptersWithDetails = chapters.map((chapter) => {
      let analyzedContent = null;
      if (chapter.analyzed_content) {
        try {
          analyzedContent = JSON.parse(chapter.analyzed_content as string);
        } catch (e) {
          console.error("Failed to parse analyzed_content:", e);
        }
      }

      return {
        id: chapter.id,
        chapterNumber: chapter.chapter_number,
        chapterName: chapter.chapter_name,
        description: chapter.description,
        content: chapter.content,
        contentType: chapter.content_type,
        isAnalyzed: chapter.is_analyzed,
        analyzedContent,
        createdAt: chapter.created_at,
        updatedAt: chapter.updated_at,
      };
    });

    return successResponse(
      chaptersWithDetails,
      "Chapters retrieved successfully",
    );
  } catch (error) {
    console.error("Get chapters error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

