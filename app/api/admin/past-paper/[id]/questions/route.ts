import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { z } from "zod";
import { PastPaperStatus } from "@/types/admin";

/**
 * @openapi
 * /api/admin/past-paper/{id}/questions:
 *   get:
 *     summary: Get all questions for a past paper
 *     description: Retrieve all questions extracted from a past paper, along with available chapters for editing
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Past paper ID
 *     responses:
 *       200:
 *         description: Questions and chapters retrieved successfully
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
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     chapters:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Past paper not found
 *   post:
 *     summary: Save/update questions after admin review
 *     description: Save questions with admin-reviewed chapter mappings. Replaces all existing questions.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Past paper ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questions]
 *             properties:
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [questionNumber, questionText]
 *                   properties:
 *                     questionNumber:
 *                       type: integer
 *                     questionText:
 *                       type: string
 *                     questionType:
 *                       type: string
 *                     chapterId:
 *                       type: string
 *                       nullable: true
 *                     chapterName:
 *                       type: string
 *                       nullable: true
 *     responses:
 *       200:
 *         description: Questions saved successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Past paper not found
 */
const saveQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      questionNumber: z.number(),
      questionPart: z.string().nullable().optional(),
      questionText: z.string(),
      questionType: z.string().optional(),
      chapterId: z.string().nullable().optional(),
      chapterName: z.string().nullable().optional(),
    }),
  ),
});

/**
 * GET /api/admin/past-paper/[id]/questions
 * Get all questions for a past paper
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

    // Get questions
    const { rows: questions } = await db.query(
      `SELECT q.*, c.chapter_name as chapter_name_full
       FROM questions q
       LEFT JOIN chapters c ON q.chapter_id = c.id
       WHERE q.past_paper_id = $1
       ORDER BY q.question_number`,
      [id],
    );

    // Transform questions from snake_case to camelCase
    const transformedQuestions = questions.map((q: any) => ({
      id: q.id,
      pastPaperId: q.past_paper_id,
      questionNumber: q.question_number,
      questionPart: q.question_part || null,
      questionText: q.question_text,
      questionType: q.question_type || null,
      chapterId: q.chapter_id || null,
      chapterName: q.chapter_name || q.chapter_name_full || null,
      aiConfidence: q.ai_confidence ? parseFloat(q.ai_confidence) : null,
      isVerified: q.is_verified || false,
      verifiedBy: q.verified_by || null,
      createdAt: q.created_at,
      updatedAt: q.updated_at,
    }));

    // Get available chapters for editing
    const { rows: pastPaper } = await db.query(
      `SELECT class, board, subject FROM past_papers WHERE id = $1`,
      [id],
    );

    let chapters: Array<{ id: string; chapterName: string }> = [];
    if (pastPaper.length > 0) {
      const { rows: curriculumRows } = await db.query(
        `SELECT id FROM curriculums 
         WHERE class = $1 AND board = $2 AND subject = $3
         LIMIT 1`,
        [pastPaper[0].class, pastPaper[0].board, pastPaper[0].subject],
      );

      if (curriculumRows.length > 0) {
        const { rows: chapterRows } = await db.query(
          `SELECT id, chapter_name FROM chapters WHERE curriculum_id = $1`,
          [curriculumRows[0].id],
        );
        chapters = chapterRows.map((ch) => ({
          id: ch.id,
          chapterName: ch.chapter_name,
        }));
      }
    }

    return successResponse(
      {
        questions: transformedQuestions,
        chapters,
      },
      "Questions retrieved successfully",
    );
  } catch (error) {
    console.error("Get questions error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * POST /api/admin/past-paper/[id]/questions
 * Save/update questions after admin review
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
    const { id } = await params;
    const body = await request.json();
    const validatedData = saveQuestionsSchema.parse(body);

    // Verify past paper exists
    const { rows: pastPaper } = await db.query(
      `SELECT id FROM past_papers WHERE id = $1`,
      [id],
    );

    if (pastPaper.length === 0) {
      return errorResponse("Past paper not found", 404);
    }

    // Delete existing questions
    await db.query(`DELETE FROM questions WHERE past_paper_id = $1`, [id]);

    // Insert updated questions
    for (const question of validatedData.questions) {
      await db.query(
        `INSERT INTO questions (id, past_paper_id, question_number, question_part, question_text, question_type, chapter_id, chapter_name, is_verified, verified_by)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          question.questionNumber,
          question.questionPart || null,
          question.questionText,
          question.questionType || null,
          question.chapterId || null,
          question.chapterName || null,
          true,
          admin.userId,
        ],
      );
    }

    // Update past paper
    await db.query(
      `UPDATE past_papers SET status = $1, total_questions = $2 WHERE id = $3`,
      [PastPaperStatus.COMPLETED, validatedData.questions.length, id],
    );

    return successResponse(
      {
        saved: validatedData.questions.length,
      },
      "Questions saved successfully",
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
    console.error("Save questions error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

