import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { deleteUploadedFile } from "@/lib/storage/file-upload";

/**
 * @openapi
 * /api/admin/curriculum/{id}:
 *   get:
 *     summary: Get curriculum details
 *     description: Retrieve details of a specific curriculum by ID, including analysis status
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
 *         description: Curriculum details retrieved successfully
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Curriculum not found
 */
/**
 * GET /api/admin/curriculum/[id]
 * Get curriculum details and analysis status
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
    const { id } = await params;
    const { rows } = await db.query(
      `SELECT 
        id, 
        class, 
        board, 
        subject, 
        file_url, 
        file_name, 
        analyzed_content,
        uploaded_by,
        created_at,
        updated_at,
        CASE 
          WHEN analyzed_content IS NOT NULL THEN true 
          ELSE false 
        END as is_analyzed
       FROM curriculums WHERE id = $1`,
      [id],
    );

    if (rows.length === 0) {
      return errorResponse("Curriculum not found", 404);
    }

    const curriculum = rows[0] as {
      id: string;
      class: string;
      board: string;
      subject: string;
      file_name: string | null;
      file_url: string | null;
      analyzed_content: string | null;
      created_at: Date;
      updated_at: Date;
      is_analyzed: boolean;
    };

    // Parse analyzed_content if it exists
    let analyzedContent = null;
    if (curriculum.analyzed_content) {
      analyzedContent =
        typeof curriculum.analyzed_content === "string"
          ? JSON.parse(curriculum.analyzed_content)
          : curriculum.analyzed_content;
    }

    // Get chapters count and chapters
    const { rows: chaptersCount } = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM chapters WHERE curriculum_id = $1`,
      [id],
    );

    // Get all chapters with content
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
      [id],
    );

    const chaptersWithDetails = chapters.map((chapter) => {
      let analyzedContent = null;
      if (chapter.analyzed_content) {
        analyzedContent =
          typeof chapter.analyzed_content === "string"
            ? JSON.parse(chapter.analyzed_content)
            : chapter.analyzed_content;
      }

      return {
        id: chapter.id,
        chapterNumber: chapter.chapter_number,
        chapterName: chapter.chapter_name,
        content: chapter.content,
        contentType: chapter.content_type,
        isAnalyzed: chapter.is_analyzed,
        analyzedContent,
        createdAt: chapter.created_at,
        updatedAt: chapter.updated_at,
      };
    });

    return successResponse(
      {
        ...curriculum,
        analyzedContent,
        chaptersCount: parseInt(chaptersCount[0]?.count || "0", 10),
        isAnalyzed: curriculum.is_analyzed,
        chapters: chaptersWithDetails,
      },
      "Curriculum retrieved successfully",
    );
  } catch (error) {
    console.error("Get curriculum error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * @openapi
 * /api/admin/curriculum/{id}:
 *   delete:
 *     summary: Delete curriculum
 *     description: Delete a curriculum and all associated chapters
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
 *         description: Curriculum deleted successfully
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Curriculum not found
 */
/**
 * DELETE /api/admin/curriculum/[id]
 * Delete curriculum and associated chapters
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const { id } = await params;

    // Get curriculum to find file URL
    const { rows: curriculums } = await db.query(
      `SELECT file_url FROM curriculums WHERE id = $1`,
      [id],
    );

    if (curriculums.length === 0) {
      return errorResponse("Curriculum not found", 404);
    }

    // 1. Set chapter_id to NULL for all questions referencing chapters of this curriculum
    // This prevents foreign key constraint violations during chapter deletion
    await db.query(
      `
      UPDATE questions 
      SET chapter_id = NULL 
      WHERE chapter_id IN (
        SELECT id FROM chapters WHERE curriculum_id = $1
      )
    `,
      [id],
    );

    // 2. Delete associated chapters
    await db.query(`DELETE FROM chapters WHERE curriculum_id = $1`, [id]);

    // 3. Delete the curriculum
    await db.query(`DELETE FROM curriculums WHERE id = $1`, [id]);

    // Delete the file
    try {
      const curriculumToDelete = curriculums[0] as { file_url: string | null };
      if (curriculumToDelete.file_url) {
        await deleteUploadedFile(curriculumToDelete.file_url);
      }
    } catch (fileError) {
      console.error("Failed to delete file:", fileError);
      // Continue even if file deletion fails
    }

    return successResponse(null, "Curriculum deleted successfully");
  } catch (error) {
    console.error("Delete curriculum error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
