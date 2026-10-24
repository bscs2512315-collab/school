import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { extractTextFromPDF } from "@/lib/pdf/parser";
import { analyzeCurriculum } from "@/lib/ai/gemini";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * @openapi
 * /api/admin/curriculum/{id}/analyze:
 *   post:
 *     summary: Re-analyze curriculum with AI
 *     description: Trigger AI analysis for an uploaded curriculum that wasn't analyzed or needs re-analysis
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
 *         description: Curriculum analyzed successfully
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Curriculum not found
 *       500:
 *         description: Analysis failed
 */
/**
 * POST /api/admin/curriculum/[id]/analyze
 * Re-analyze curriculum with AI
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let admin;
  try {
    admin = await getAdminFromRequest(request);
  } catch (error: any) {
    // Handle timeout/expiration errors
    if (
      error?.message?.includes("timed out") ||
      error?.message?.includes("expired")
    ) {
      return errorResponse(error.message, 401);
    }
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const { id } = await params;

    // Get curriculum details
    const { rows: curriculums } = await db.query(
      `SELECT id, file_url, file_name FROM curriculums WHERE id = $1`,
      [id],
    );

    if (curriculums.length === 0) {
      return errorResponse("Curriculum not found", 404);
    }

    const curriculum = curriculums[0] as {
      id: string;
      file_url: string | null;
      file_name: string | null;
    };

    // Check if this curriculum has a file (old flow) or uses chapter-by-chapter (new flow)
    if (!curriculum.file_url) {
      // New flow: Analyze all chapters' content together
      const { rows: chapters } = await db.query<{ content: string }>(
        `SELECT content FROM chapters WHERE curriculum_id = $1 AND content IS NOT NULL ORDER BY chapter_number`,
        [id],
      );

      if (chapters.length === 0) {
        return errorResponse(
          "This curriculum has no chapters with content. Please add chapters first.",
          400,
        );
      }

      // Combine all chapter content
      const combinedContent = chapters
        .map((ch, idx) => `Chapter ${idx + 1}:\n${ch.content}`)
        .join("\n\n");

      // Analyze combined content
      let analyzedContent = null;
      try {
        // Only attempt analysis if API key is available
        if (!process.env.GEMINI_API_KEY) {
          return errorResponse(
            "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment variables. " +
              "Note: AI analysis is optional - your curriculum will work without it.",
            400,
          );
        }
        analyzedContent = await analyzeCurriculum(combinedContent);
      } catch (aiError) {
        console.error("AI analysis failed:", aiError);
        const errorMessage =
          aiError instanceof Error ? aiError.message : "Unknown error";

        // Return a helpful error message explaining that analysis is optional
        return errorResponse(
          `AI analysis is currently unavailable: ${errorMessage}. ` +
            `Your curriculum is saved and can be used without AI analysis. ` +
            `To enable AI analysis, please check your GEMINI_API_KEY and ensure the Gemini API is enabled in your Google Cloud project.`,
          503, // Service Unavailable - indicates the service (AI) is not available, but the main functionality works
        );
      }

      // Update curriculum with analyzed content
      await db.query(
        `UPDATE curriculums 
         SET analyzed_content = $1, updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(analyzedContent), id],
      );

      return successResponse(
        {
          id,
          analyzed: true,
          chaptersCount: analyzedContent?.chapters?.length || 0,
        },
        "Curriculum analyzed successfully from chapters",
      );
    }

    // Old flow: Read the PDF file
    let fileBuffer: Buffer;

    if (curriculum.file_url.startsWith("http")) {
      // Cloudinary URL: Fetch via HTTP
      const response = await fetch(curriculum.file_url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch file from storage: ${response.statusText}`,
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      // Local file: Read from filesystem
      const relPath = curriculum.file_url.replace(/^\/?(public\/)?/, "");
      const filePath = join(
        process.cwd(),
        "public",
        "uploads",
        relPath.replace(/^uploads\//, ""),
      );
      fileBuffer = await readFile(filePath);
    }

    // Convert buffer to File-like object for extractTextFromPDF
    const file = new File(
      [new Uint8Array(fileBuffer)],
      curriculum.file_name || "curriculum.pdf",
      {
        type: "application/pdf",
      },
    );

    // Extract text from PDF
    const pdfText = await extractTextFromPDF(file);

    // Analyze curriculum with AI
    let analyzedContent = null;
    try {
      // Only attempt analysis if API key is available
      if (!process.env.GEMINI_API_KEY) {
        return errorResponse(
          "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment variables. " +
            "Note: AI analysis is optional - your curriculum will work without it.",
          400,
        );
      }
      analyzedContent = await analyzeCurriculum(pdfText);
    } catch (aiError) {
      console.error("AI analysis failed:", aiError);
      const errorMessage =
        aiError instanceof Error ? aiError.message : "Unknown error";

      // Return a helpful error message explaining that analysis is optional
      return errorResponse(
        `AI analysis is currently unavailable: ${errorMessage}. ` +
          `Your curriculum is saved and can be used without AI analysis. ` +
          `To enable AI analysis, please check your GEMINI_API_KEY and ensure the Gemini API is enabled in your Google Cloud project.`,
        503, // Service Unavailable
      );
    }

    // Update curriculum with analyzed content
    await db.query(
      `UPDATE curriculums 
       SET analyzed_content = $1, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(analyzedContent), id],
    );

    // Delete existing chapters and insert new ones
    await db.query(`DELETE FROM chapters WHERE curriculum_id = $1`, [id]);

    // Save chapters if analysis was successful
    if (analyzedContent?.chapters) {
      for (const chapter of analyzedContent.chapters) {
        await db.query(
          `INSERT INTO chapters (id, curriculum_id, chapter_number, chapter_name, description)
           VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
          [
            id,
            chapter.chapterNumber || null,
            chapter.chapterName,
            chapter.description || null,
          ],
        );
      }
    }

    return successResponse(
      {
        id,
        analyzed: true,
        chaptersCount: analyzedContent?.chapters?.length || 0,
      },
      "Curriculum analyzed successfully",
    );
  } catch (error) {
    console.error("Re-analyze curriculum error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      500,
    );
  }
}
