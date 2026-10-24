import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { deleteUploadedFile } from "@/lib/storage/file-upload";
import { randomUUID } from "crypto";

/**
 * @openapi
 * /api/admin/past-paper/{id}:
 *   get:
 *     summary: Get past paper details
 *     description: Retrieve details of a specific past paper by ID
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
 *         description: Past paper details
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Past paper not found
 *   delete:
 *     summary: Delete past paper
 *     description: Delete a past paper and all associated questions
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
 *         description: Past paper deleted successfully
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Past paper not found
 */
/**
 * GET /api/admin/past-paper/[id]
 * Get past paper details and its questions
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

    // Get past paper metadata
    const { rows: paperRows } = await db.query(
      `SELECT * FROM past_papers WHERE id = $1`,
      [id],
    );

    if (paperRows.length === 0) {
      return errorResponse("Past paper not found", 404);
    }

    const paper = paperRows[0];

    // Get questions for this paper
    const { rows: questions } = await db.query(
      `SELECT * FROM questions WHERE past_paper_id = $1 ORDER BY question_number, question_part NULLS FIRST`,
      [id],
    );

    // Transform questions (snake_case to camelCase and parse mcq_data)
    console.log(
      "Questions from DB:",
      questions.map((q) => ({
        id: q.id,
        marks: q.marks,
        mcq_data: q.mcq_data ? "present" : "missing",
      })),
    );
    const transformedQuestions = questions.map((q: any) => {
      let mcqOptions = [];
      let correctAnswer = null;

      if (q.mcq_data) {
        try {
          const mcqData =
            typeof q.mcq_data === "string"
              ? JSON.parse(q.mcq_data)
              : q.mcq_data;
          mcqOptions = mcqData.options || [];
          correctAnswer = mcqData.correctAnswer || null;
        } catch (e) {
          console.error("Failed to parse mcq_data:", e);
        }
      }

      return {
        id: q.id,
        questionNumber: q.question_number,
        questionPart: q.question_part,
        questionText: q.question_text,
        questionType: q.question_type,
        chapterId: q.chapter_id,
        chapterName: q.chapter_name,
        marks: q.marks || null,
        mcqOptions,
        correctAnswer,
        imageUrl: q.image_url || null,
      };
    });

    const fullPaper = {
      id: paper.id,
      class: paper.class,
      subject: paper.subject,
      board: paper.board,
      year: paper.year,
      paperNumber: paper.paper_number || 1,
      questions: transformedQuestions,
    };

    return successResponse(
      { pastPaper: fullPaper },
      "Past paper retrieved successfully",
    );
  } catch (error) {
    console.error("Get past paper error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * DELETE /api/admin/past-paper/[id]
 * Delete past paper and associated questions
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

    // Get past paper to get file URL
    const { rows } = await db.query(
      `SELECT file_url FROM past_papers WHERE id = $1`,
      [id],
    );

    if (rows.length === 0) {
      return errorResponse("Past paper not found", 404);
    }

    // Delete file
    await deleteUploadedFile(rows[0].file_url);

    // Delete past paper (cascade will delete questions)
    await db.query(`DELETE FROM past_papers WHERE id = $1`, [id]);

    return successResponse(null, "Past paper deleted successfully");
  } catch (error) {
    console.error("Delete past paper error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * PUT /api/admin/past-paper/[id]
 * Update past paper details and questions
 */
export async function PUT(
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

    // Verify past paper exists
    const { rows: existing } = await db.query(
      `SELECT id FROM past_papers WHERE id = $1`,
      [id],
    );

    if (existing.length === 0) {
      return errorResponse("Past paper not found", 404);
    }

    // Start transaction or just update sequential
    // Update past paper metadata
    await db.query(
      `UPDATE past_papers 
       SET class = $1, subject = $2, year = $3, total_questions = $4, updated_at = NOW()
       WHERE id = $5`,
      [body.class, body.subject, body.year, body.questions?.length || 0, id],
    );

    // If questions are provided, update them
    if (body.questions && Array.isArray(body.questions)) {
      // Delete existing questions
      await db.query(`DELETE FROM questions WHERE past_paper_id = $1`, [id]);

      // Insert updated questions
      for (const question of body.questions) {
        let mcqData = null;
        if (question.questionType === "MCQ" && question.mcqOptions) {
          mcqData = JSON.stringify({
            options: question.mcqOptions,
            correctAnswer: question.correctAnswer,
          });
        }

        const defaultMarks: Record<string, number> = { MCQ: 1, CRQ: 3, ERQ: 5 };
        const marks =
          question.marks || defaultMarks[question.questionType] || 1;

        await db.query(
          `INSERT INTO questions (
            id, past_paper_id, question_number, question_part, question_text, 
            question_type, chapter_id, chapter_name, marks, is_verified, verified_by, mcq_data, image_url
          )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            randomUUID(),
            id,
            question.questionNumber,
            question.questionPart || null,
            question.questionText,
            question.questionType,
            question.chapterId || null,
            question.chapterName || null,
            marks,
            true,
            admin.userId,
            mcqData,
            question.imageUrl || null,
          ],
        );
      }
    }

    return successResponse(null, "Past paper updated successfully");
  } catch (error) {
    console.error("Update past paper error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
