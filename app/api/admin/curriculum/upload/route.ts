import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { saveUploadedFile } from "@/lib/storage/file-upload";
import { extractTextFromPDF } from "@/lib/pdf/parser";
import { analyzeCurriculum } from "@/lib/ai/gemini";
import { z } from "zod";
import { Class, Board, Subject } from "@/types/enums";
import { randomUUID } from "crypto";

/**
 * @openapi
 * /api/admin/curriculum/upload:
 *   post:
 *     summary: Upload and analyze curriculum document
 *     description: Upload a curriculum/SLO PDF file. AI will analyze it and extract chapters automatically.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [class, board, subject, file]
 *             properties:
 *               class:
 *                 type: string
 *                 enum: [IX, X, XI, XII]
 *                 description: Class level
 *               board:
 *                 type: string
 *                 enum: [AKUEB, Sindh Board, Punjab Board, KPK Board, Balochistan Board, Federal Board]
 *                 description: Examination board
 *               subject:
 *                 type: string
 *                 enum: [English, Urdu, Mathematics, Pakistan Studies, Islamiat, Physics, Chemistry, Biology]
 *                 description: Subject name
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Curriculum PDF file (max 10MB)
 *     responses:
 *       201:
 *         description: Curriculum uploaded and analyzed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     analyzed:
 *                       type: boolean
 *                     chaptersCount:
 *                       type: number
 *       400:
 *         description: Validation error or curriculum already exists
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
const uploadSchema = z.object({
  class: z.nativeEnum(Class),
  board: z.nativeEnum(Board),
  subject: z.nativeEnum(Subject),
});

/**
 * POST /api/admin/curriculum/upload
 * Upload and analyze curriculum document
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  const userId = admin.userId;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const classValue = formData.get("class") as string;
    const board = formData.get("board") as string;
    const subject = formData.get("subject") as string;

    if (!file) {
      return errorResponse("File is required", 400);
    }

    // Validate form data
    const validatedData = uploadSchema.parse({
      class: classValue,
      board,
      subject,
    });

    // Check if curriculum already exists
    const { rows: existing } = await db.query(
      `SELECT id FROM curriculums WHERE class = $1 AND board = $2 AND subject = $3`,
      [validatedData.class, validatedData.board, validatedData.subject],
    );

    if (existing.length > 0) {
      return errorResponse(
        "Curriculum for this class, board, and subject already exists",
        409,
      );
    }

    // Save file
    const { fileUrl, fileName } = await saveUploadedFile(file, "curriculums");

    // Extract text from PDF
    const pdfText = await extractTextFromPDF(file);

    // Analyze curriculum with AI
    let analyzedContent = null;
    try {
      analyzedContent = await analyzeCurriculum(pdfText);
    } catch (aiError) {
      console.error("AI analysis failed:", aiError);
      // Continue without analysis - can be re-analyzed later
    }

    // Save to database
    const curriculumId = randomUUID();
    await db.query(
      `INSERT INTO curriculums (id, class, board, subject, file_url, file_name, analyzed_content, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        curriculumId,
        validatedData.class,
        validatedData.board,
        validatedData.subject,
        fileUrl,
        fileName,
        analyzedContent ? JSON.stringify(analyzedContent) : null,
        userId,
      ],
    );

    // Save chapters if analysis was successful
    if (analyzedContent?.chapters) {
      for (const chapter of analyzedContent.chapters) {
        await db.query(
          `INSERT INTO chapters (id, curriculum_id, chapter_number, chapter_name, description)
           VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
          [
            curriculumId,
            chapter.chapterNumber || null,
            chapter.chapterName,
            chapter.description || null,
          ],
        );
      }
    }

    return successResponse(
      {
        id: curriculumId,
        analyzed: !!analyzedContent,
        chaptersCount: analyzedContent?.chapters?.length || 0,
      },
      analyzedContent
        ? "Curriculum uploaded and analyzed successfully"
        : "Curriculum uploaded successfully. Analysis will be completed later.",
      201,
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
    console.error("Curriculum upload error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      500,
    );
  }
}
