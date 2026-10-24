import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { z } from "zod";

const updateChapterSchema = z.object({
  chapterNumber: z.coerce.number().int().positive(),
  chapterName: z.string().min(1),
});

/**
 * PUT /api/admin/curriculum/[id]/chapters/[chapterId]
 * Update a chapter
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> },
) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const { id: curriculumId, chapterId } = await params;
    const body = await request.json();
    
    const validatedData = updateChapterSchema.parse(body);

    // Verify chapter exists and belongs to curriculum
    const { rows: chapters } = await db.query(
      `SELECT id FROM chapters WHERE id = $1 AND curriculum_id = $2`,
      [chapterId, curriculumId],
    );

    if (chapters.length === 0) {
      return errorResponse("Chapter not found", 404);
    }

    // Check if chapter number conflicts with another chapter
    const { rows: conflicting } = await db.query(
      `SELECT id FROM chapters WHERE curriculum_id = $1 AND chapter_number = $2 AND id != $3`,
      [curriculumId, validatedData.chapterNumber, chapterId],
    );

    if (conflicting.length > 0) {
      return errorResponse(
        `Chapter ${validatedData.chapterNumber} already exists for this curriculum`,
        409,
      );
    }

    // Update chapter
    await db.query(
      `UPDATE chapters 
       SET chapter_number = $1, chapter_name = $2, updated_at = NOW()
       WHERE id = $3`,
      [validatedData.chapterNumber, validatedData.chapterName, chapterId],
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
      "Chapter updated successfully",
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Convert ZodError issues to ApiErrorDetail format
      const errorDetails = error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.map((p) => String(p)),
        code: issue.code,
      }));
      return errorResponse(errorDetails, 400);
    }
    console.error("Update chapter error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * DELETE /api/admin/curriculum/[id]/chapters/[chapterId]
 * Delete a chapter
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> },
) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const { id: curriculumId, chapterId } = await params;

    // Verify chapter exists and belongs to curriculum
    const { rows: chapters } = await db.query(
      `SELECT id FROM chapters WHERE id = $1 AND curriculum_id = $2`,
      [chapterId, curriculumId],
    );

    if (chapters.length === 0) {
      return errorResponse("Chapter not found", 404);
    }

    // Delete chapter
    await db.query(`DELETE FROM chapters WHERE id = $1`, [chapterId]);

    // Update curriculum updated_at
    await db.query(
      `UPDATE curriculums SET updated_at = NOW() WHERE id = $1`,
      [curriculumId],
    );

    return successResponse(null, "Chapter deleted successfully");
  } catch (error) {
    console.error("Delete chapter error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

