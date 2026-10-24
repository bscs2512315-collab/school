import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { formatMathToUnicode } from "@/lib/utils/math-notation";

/**
 * GET /api/student/history/[id]
 * Fetch details for a specific exam attempt
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
    const { rows: attempts } = await db.query(
      `SELECT 
                a.id, a.paper_id, a.teacher_paper_id, a.score, a.total_marks,
                a.time_taken, a.answers_data, a.created_at,
                a.images_archived_at,
                COALESCE(a.grading_status, 'graded') AS grading_status,
                COALESCE(a.paper_type, 'paper1') AS paper_type,
                COALESCE(tp.title, a.subject, p.subject) AS title,
                COALESCE(tp.subject, a.subject, p.subject) AS subject,
                COALESCE(tp.board, p.board) AS board,
                COALESCE(tp.class_level, p.class) AS class_level,
                p.year,
                CASE
                  WHEN tp.paper_type IS NOT NULL
                    THEN CASE WHEN tp.paper_type::text LIKE '%2%' THEN 2 ELSE 1 END
                  ELSE p.paper_number
                END AS paper_number,
                tp.classroom_id,
                tp.questions_snapshot
             FROM exam_attempts a
             LEFT JOIN past_papers p ON a.paper_id = p.id
             LEFT JOIN teacher_papers tp ON a.teacher_paper_id = tp.id
             WHERE a.id = $1 AND a.user_id = $2`,
      [id, user.userId],
    );

    if (attempts.length === 0) {
      return errorResponse("Attempt not found", 404);
    }

    const attempt = attempts[0];
    const answersData =
      typeof attempt.answers_data === "string"
        ? JSON.parse(attempt.answers_data)
        : attempt.answers_data || {};
    const questionIds = Object.keys(answersData);
    let enrichedAnswers = { ...answersData };
    const isTeacherPaper = Boolean(attempt.teacher_paper_id);
    const isReleased = attempt.grading_status === "graded";

    if (isTeacherPaper) {
      const snapshot =
        typeof attempt.questions_snapshot === "string"
          ? JSON.parse(attempt.questions_snapshot)
          : attempt.questions_snapshot;

      if (Array.isArray(snapshot)) {
        for (const question of snapshot) {
          const questionId = String(question.id);
          const answer = enrichedAnswers[questionId];
          if (!answer || typeof answer !== "object") continue;

          const existing = answer as Record<string, unknown>;
          enrichedAnswers[questionId] = {
            ...existing,
            questionText: String(question.questionText ?? ""),
            questionNumber: Number(question.questionNumber) || 0,
            questionPart: question.questionPart ?? null,
            imageUrl:
              typeof question.imageUrl === "string"
                ? question.imageUrl
                : (existing.imageUrl ?? null),
            correctAnswer:
              existing.correctAnswer ?? question.correctAnswer ?? null,
            options: Array.isArray(question.mcqOptions)
              ? question.mcqOptions
              : ((existing.options as unknown[]) ?? []),
            maxMarks: Number(question.marks) || Number(existing.maxMarks) || 1,
          };
        }
      }
    } else if (questionIds.length > 0) {
      const placeholders = questionIds.map((_, i) => `$${i + 1}`).join(",");
      const { rows: questionDetails } = await db.query(
        `SELECT q.id, q.question_text, q.image_url, q.question_number, q.question_part, q.mcq_data,
                COALESCE(ch.chapter_name, q.chapter_name) as "chapterName"
         FROM questions q
         LEFT JOIN chapters ch ON q.chapter_id = ch.id
         WHERE q.id IN (${placeholders})`,
        questionIds,
      );

      questionDetails.forEach((q) => {
        if (enrichedAnswers[q.id]) {
          let mcqData: { correctAnswer?: string; options?: Array<{ id: string; text: string }> } | null = null;
          if (q.mcq_data) {
            try {
              mcqData = typeof q.mcq_data === "string" ? JSON.parse(q.mcq_data) : q.mcq_data;
            } catch {}
          }
          const existing = enrichedAnswers[q.id] as Record<string, unknown>;
          const correctAnswer = existing.correctAnswer || mcqData?.correctAnswer || null;
          const options = mcqData?.options || [];
          enrichedAnswers[q.id] = {
            ...existing,
            questionText: q.question_text,
            imageUrl: q.image_url,
            questionNumber: q.question_number,
            questionPart: q.question_part,
            chapterName: q.chapterName,
            correctAnswer,
            options,
          };
        }
      });
    }

    if (isTeacherPaper && !isReleased) {
      enrichedAnswers = Object.fromEntries(
        Object.entries(enrichedAnswers).map(([questionId, value]) => {
          const answer =
            value && typeof value === "object"
              ? (value as Record<string, unknown>)
              : {};
          return [
            questionId,
            {
              imageUrl:
                typeof answer.imageUrl === "string" ? answer.imageUrl : null,
              imageUrls: Array.isArray(answer.imageUrls)
                ? answer.imageUrls.filter(
                    (url): url is string => typeof url === "string",
                  )
                : typeof answer.imageUrl === "string"
                  ? [answer.imageUrl]
                  : [],
              questionText:
                typeof answer.questionText === "string"
                  ? answer.questionText
                  : "",
              questionNumber: Number(answer.questionNumber) || 0,
              questionPart: answer.questionPart ?? null,
              imagesArchived: Boolean(answer.imagesArchived),
            },
          ];
        }),
      );
    }

    const sanitizedAnswers = Object.fromEntries(
      Object.entries(enrichedAnswers).map(([key, val]) => {
        if (val && typeof val === "object") {
          const v = val as Record<string, unknown>;
          return [
            key,
            {
              ...v,
              feedback:
                typeof v.feedback === "string"
                  ? formatMathToUnicode(v.feedback)
                  : v.feedback,
            },
          ];
        }
        return [key, val];
      }),
    );

    return successResponse({
      ...attempt,
      subject: attempt.subject || "Examination Attempt",
      score: isReleased || !isTeacherPaper ? attempt.score || 0 : null,
      total_marks: attempt.total_marks || 0,
      answers_data: sanitizedAnswers,
      paperDetails: {
        year:
          attempt.year && String(attempt.year).trim() !== "N/A"
            ? attempt.year
            : null,
        board:
          attempt.board && String(attempt.board).trim() !== "N/A"
            ? attempt.board
            : null,
        class_level: attempt.class_level || null,
        paper_number: attempt.paper_number || 1,
      },
    });
  } catch (error) {
    console.error("Fetch attempt details error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
