import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { awardStudentProgressPoints } from "@/lib/gamification/award-progress-points";
import { verifyAuth } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { paperId, answers, timeTaken } = await req.json();
    const userId = authUser.userId;

    if (!paperId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1. Fetch all MCQ questions for this paper (with correct answers from DB)
    const { rows: questions } = await db.query(
      `SELECT id, marks, mcq_data
       FROM questions
       WHERE past_paper_id = $1 AND question_type = 'MCQ'
       ORDER BY question_number ASC`,
      [paperId],
    );

    // 1.1 Fetch Paper Subject for history
    const { rows: paperDetails } = await db.query(
      `SELECT subject FROM past_papers WHERE id = $1`,
      [paperId],
    );
    const subject = paperDetails[0]?.subject || "Unknown Subject";

    // 2. Score the answers server-side
    let score = 0;
    let totalMarks = 0;
    const questionResults: Record<
      string,
      {
        correct: boolean;
        correctAnswer: string | null;
        selectedAnswer: string | null;
      }
    > = {};

    for (const q of questions) {
      const marks = q.marks || 1;
      totalMarks += marks;

      let correctAnswer: string | null = null;
      if (q.mcq_data) {
        try {
          const mcqData =
            typeof q.mcq_data === "string"
              ? JSON.parse(q.mcq_data)
              : q.mcq_data;
          correctAnswer = mcqData.correctAnswer || null;
        } catch {
          // ignore parse errors
        }
      }

      const selectedAnswer = answers?.[q.id] || null;
      const isCorrect =
        selectedAnswer !== null &&
        correctAnswer !== null &&
        selectedAnswer === correctAnswer;

      if (isCorrect) {
        score += marks;
      }

      questionResults[q.id] = {
        correct: isCorrect,
        correctAnswer,
        selectedAnswer,
      };
    }


    const attemptId = randomUUID();

    const responseQuestionResults: Record<
      string,
      { correct: boolean; correctAnswer: string | null; selectedAnswer: string | null }
    > = {};
    for (const [qid, r] of Object.entries(questionResults)) {
      responseQuestionResults[qid] = {
        correct: r.correct,
        correctAnswer: r.correctAnswer,
        selectedAnswer: r.selectedAnswer,
      };
    }

    // 4. Insert Attempt
    await db.query(
      `INSERT INTO exam_attempts (id, user_id, paper_id, subject, score, total_marks, time_taken, answers_data, paper_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        attemptId,
        userId,
        paperId,
        subject,
        score,
        totalMarks,
        timeTaken || 0,
        JSON.stringify(questionResults),
        "paper1",
      ],
    );

    // 5. Update User Points (Gamification) + rank / milestone
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    const { pointsAwarded } = await awardStudentProgressPoints(userId, {
      score,
      totalMarks,
      percentage,
      paperType: "paper1",
      questionCount: questions.length,
    });

    return NextResponse.json({
      success: true,
      message: "Exam submitted successfully",
      data: {
        attemptId,
        score,
        totalMarks,
        percentage: Math.round(percentage),
        pointsAwarded,
        questionResults: responseQuestionResults,
      },
    });
  } catch (error: any) {
    console.error("Exam Attempt Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit exam attempt" },
      { status: 500 },
    );
  }
}
