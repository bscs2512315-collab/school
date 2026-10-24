import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { parsePaperIIData } from "@/lib/bot/paper-ii-data";

/**
 * GET /api/admin/questions
 * Get all questions from the question bank (all past papers)
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const classFilter = searchParams.get("class");
    const boardFilter = searchParams.get("board");
    const subjectFilter = searchParams.get("subject");
    const questionTypeFilter = searchParams.get("questionType");
    const paperNumberFilter = searchParams.get("paperNumber");
    const search = searchParams.get("search")?.trim() || "";
    const chapterIdFilter = searchParams.get("chapterId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereConditions: string[] = [];
    const queryParams: (string | number)[] = [];
    let paramIndex = 1;

    if (classFilter) {
      whereConditions.push(`pp.class = $${paramIndex}`);
      queryParams.push(classFilter);
      paramIndex++;
    }

    if (boardFilter) {
      whereConditions.push(`pp.board = $${paramIndex}`);
      queryParams.push(boardFilter);
      paramIndex++;
    }

    if (subjectFilter) {
      whereConditions.push(`pp.subject = $${paramIndex}`);
      queryParams.push(subjectFilter);
      paramIndex++;
    }

    if (questionTypeFilter) {
      whereConditions.push(`q.question_type = $${paramIndex}`);
      queryParams.push(questionTypeFilter);
      paramIndex++;
    }

    if (paperNumberFilter) {
      whereConditions.push(`COALESCE(pp.paper_number, 1) = $${paramIndex}`);
      queryParams.push(parseInt(paperNumberFilter, 10));
      paramIndex++;
    }

    if (search) {
      whereConditions.push(
        `(q.question_text ILIKE $${paramIndex} OR q.chapter_name ILIKE $${paramIndex} OR pp.subject ILIKE $${paramIndex})`,
      );
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (chapterIdFilter) {
      whereConditions.push(`q.chapter_id = $${paramIndex}`);
      queryParams.push(chapterIdFilter);
      paramIndex++;
    }

    const chapterNameFilter = searchParams.get("chapterName");
    if (chapterNameFilter) {
      whereConditions.push(`q.chapter_name = $${paramIndex}`);
      queryParams.push(chapterNameFilter);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM questions q
      INNER JOIN past_papers pp ON q.past_paper_id = pp.id
      ${whereClause}
    `;
    const { rows: countRows } = await db.query(countQuery, queryParams);
    const total = parseInt((countRows[0] as { total: string }).total);

    // Get questions with pagination
    queryParams.push(limit, offset);
    const questionsQuery = `
      SELECT 
        q.id,
        q.past_paper_id,
        q.question_number,
        q.question_part,
        q.question_text,
        q.question_type,
        q.chapter_id,
        q.chapter_name,
        q.marks,
        q.mcq_data,
        q.image_url,
        q.paper_ii_data,
        q.is_verified,
        q.created_at,
        q.updated_at,
        pp.class,
        pp.board,
        pp.subject,
        pp.year,
        pp.file_name,
        COALESCE(pp.paper_number, 1) as paper_number
      FROM questions q
      INNER JOIN past_papers pp ON q.past_paper_id = pp.id
      ${whereClause}
      ORDER BY pp.year DESC, pp.class, pp.subject, q.question_number, q.question_part
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const { rows: questions } = await db.query(questionsQuery, queryParams);

    // Transform questions
    const transformedQuestions = questions.map((q: any) => {
      let mcqOptions = null;
      let correctAnswer = null;
      if (q.mcq_data) {
        try {
          const mcqData = typeof q.mcq_data === 'string' ? JSON.parse(q.mcq_data) : q.mcq_data;
          mcqOptions = mcqData.options || null;
          correctAnswer = mcqData.correctAnswer || null;
        } catch (e) {
          console.error("Failed to parse mcq_data:", e);
        }
      }

      return {
        id: q.id,
        pastPaperId: q.past_paper_id,
        questionNumber: q.question_number,
        questionPart: q.question_part || null,
        questionText: q.question_text,
        questionType: q.question_type || null,
        chapterId: q.chapter_id || null,
        chapterName: q.chapter_name || null,
        marks: q.marks || null,
        mcqOptions,
        correctAnswer,
        imageUrl: q.image_url || null,
        paperIIData: parsePaperIIData(q.paper_ii_data),
        isVerified: q.is_verified || false,
        createdAt: q.created_at,
        updatedAt: q.updated_at,
        pastPaper: {
          class: q.class,
          board: q.board,
          subject: q.subject,
          year: q.year,
          fileName: q.file_name,
          paperNumber: q.paper_number || 1,
        },
      };
    });

    return successResponse(
      {
        questions: transformedQuestions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Questions retrieved successfully",
    );
  } catch (error) {
    console.error("Get questions error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * DELETE /api/admin/questions/[id]
 * Delete a question from the question bank
 */
export async function DELETE(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("id");

    if (!questionId) {
      return errorResponse("Question ID is required", 400);
    }

    // Verify question exists and get past_paper_id
    const { rows: questionRows } = await db.query(
      `SELECT id, past_paper_id FROM questions WHERE id = $1`,
      [questionId],
    );

    if (questionRows.length === 0) {
      return errorResponse("Question not found", 404);
    }

    const pastPaperId = (questionRows[0] as { past_paper_id: string }).past_paper_id;

    // Delete the question
    await db.query(`DELETE FROM questions WHERE id = $1`, [questionId]);

    // Update past paper total_questions count
    if (pastPaperId) {
      const { rows: countRows } = await db.query(
        `SELECT COUNT(*) as total FROM questions WHERE past_paper_id = $1`,
        [pastPaperId],
      );
      const totalQuestions = parseInt((countRows[0] as { total: string }).total);
      
      await db.query(
        `UPDATE past_papers SET total_questions = $1 WHERE id = $2`,
        [totalQuestions, pastPaperId],
      );
    }

    return successResponse(null, "Question deleted successfully");
  } catch (error) {
    console.error("Delete question error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

