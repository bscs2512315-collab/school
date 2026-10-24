import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/student/past-paper/[id]
 * Get past paper details for students
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized. Please login.", 401);
  }

  const { id } = await params;

  try {
    const { rows: papers } = await db.query(
      `SELECT id, class, board, subject, year, paper_number as "paperNumber",
              COALESCE(strict_mode, false) as "strictMode",
              COALESCE(allow_resume, true) as "allowResume"
       FROM past_papers WHERE id = $1`,
      [id],
    );

    if (papers.length === 0) {
      return errorResponse("Past paper not found", 404);
    }

    const paper = papers[0];

    // Fetch questions
    const { rows: questions } = await db.query(
      `SELECT 
        q.id,
        q.question_number as "questionNumber",
        q.question_part as "questionPart",
        q.question_text as "questionText",
        q.question_type as "questionType",
        q.marks,
        q.image_url as "imageUrl",
        q.mcq_data,
        COALESCE(ch.chapter_name, q.chapter_name) as "chapterName"
       FROM questions q
       LEFT JOIN chapters ch ON q.chapter_id = ch.id
       WHERE q.past_paper_id = $1
       ORDER BY q.question_number ASC, q.question_part ASC NULLS FIRST`,
      [id],
    );

    // Combine questions with their options
    const formattedQuestions = questions.map((q) => {
      let mcqOptions = [];
      if (q.mcq_data) {
        try {
          const mcqData =
            typeof q.mcq_data === "string"
              ? JSON.parse(q.mcq_data)
              : q.mcq_data;
          mcqOptions = mcqData.options || [];
        } catch (e) {
          console.error("Failed to parse mcq_data for student:", e);
        }
      }

      const { mcq_data, ...rest } = q;
      if (q.questionType?.toUpperCase() === "MCQ") {
        return {
          ...rest,
          mcqOptions,
        };
      }
      return rest;
    });

    return successResponse({
      ...paper,
      questions: formattedQuestions,
    });
  } catch (error) {
    console.error("Student fetch past paper detail error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
