import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { randomUUID } from "crypto";
import { awardStudentProgressPoints } from "@/lib/gamification/award-progress-points";

/**
 * POST /api/challenges/[id]/submit
 * Submit challenge answers (Paper 1 MCQ scoring)
 * Body: { answers: { [questionId]: optionId }, timeTaken: number }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  const { answers, timeTaken } = await request.json();

  try {
    // Verify challenge is ACTIVE
    const { rows: challenges } = await db.query(
      "SELECT * FROM challenges WHERE id = $1",
      [id],
    );

    if (challenges.length === 0)
      return errorResponse("Challenge not found", 404);
    const challenge = challenges[0] as any;

    if (challenge.status !== "ACTIVE") {
      return errorResponse("Challenge is not active", 400);
    }

    // Verify user is ACCEPTED participant
    const { rows: myPart } = await db.query(
      "SELECT * FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2",
      [id, user.userId],
    );

    if (myPart.length === 0)
      return errorResponse("Not part of this challenge", 403);
    if (myPart[0].status === "COMPLETED")
      return errorResponse("You already submitted", 400);
    if (myPart[0].status !== "ACCEPTED")
      return errorResponse("You haven't accepted this challenge", 400);

    // Get paper data
    const paperData =
      typeof challenge.paper_data === "string"
        ? JSON.parse(challenge.paper_data)
        : challenge.paper_data;

    if (!paperData?.generatedPaperId) {
      return errorResponse("Paper data not found", 500);
    }

    // Fetch questions with correct answers from generated paper
    const { rows: genPaper } = await db.query(
      "SELECT question_ids, questions_snapshot FROM generated_papers WHERE id = $1",
      [paperData.generatedPaperId],
    );

    if (genPaper.length === 0)
      return errorResponse("Generated paper not found", 404);

    const snapshotRaw = genPaper[0].questions_snapshot;
    const snapshot =
      typeof snapshotRaw === "string" ? JSON.parse(snapshotRaw) : snapshotRaw;

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

    if (Array.isArray(snapshot) && snapshot.length > 0) {
      for (const q of snapshot) {
        const marks = Number(q.marks) || 1;
        totalMarks += marks;
        const correctAnswer = q.correctAnswer ?? null;
        const selectedAnswer = answers?.[q.id] || null;
        const isCorrect =
          selectedAnswer !== null &&
          correctAnswer !== null &&
          String(selectedAnswer).toUpperCase() === String(correctAnswer).toUpperCase();
        if (isCorrect) score += marks;

        questionResults[q.id] = {
          correct: isCorrect,
          correctAnswer,
          selectedAnswer,
        };
      }
    } else {
      const questionIds =
        typeof genPaper[0].question_ids === "string"
          ? JSON.parse(genPaper[0].question_ids)
          : genPaper[0].question_ids;

      // Fetch questions
      const placeholders = questionIds
        .map((_: string, i: number) => `$${i + 1}`)
        .join(",");
      const { rows: questions } = await db.query(
        `SELECT id, marks, mcq_data FROM questions WHERE id IN (${placeholders})`,
        questionIds,
      );

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
          } catch {}
        }

        const selectedAnswer = answers?.[q.id] || null;
        const isCorrect =
          selectedAnswer !== null &&
          correctAnswer !== null &&
          String(selectedAnswer).toUpperCase() === String(correctAnswer).toUpperCase();
        if (isCorrect) score += marks;

        questionResults[q.id] = {
          correct: isCorrect,
          correctAnswer,
          selectedAnswer,
        };
      }
    }

    const percentage =
      totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

    // Update participant
    await db.query(
      `UPDATE challenge_participants
       SET status = 'COMPLETED', score = $1, total_marks = $2, percentage = $3, time_taken = $4, submitted_at = NOW()
       WHERE challenge_id = $5 AND user_id = $6`,
      [score, totalMarks, percentage, timeTaken || 0, id, user.userId],
    );

    // Award points (same logic as past papers / My Quizzes / classroom exams)
    const { pointsAwarded } = await awardStudentProgressPoints(
      user.userId,
      {
        score,
        totalMarks,
        percentage,
        paperType: "challenge",
        questionCount: Object.keys(questionResults).length,
      },
    );

    // Record in exam_attempts for history
    const attemptId = randomUUID();
    await db.query(
      `INSERT INTO exam_attempts (id, user_id, paper_id, subject, score, total_marks, time_taken, answers_data, grading_status, paper_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        attemptId,
        user.userId,
        null, // No single paper_id for challenges (multi-chapter)
        challenge.subject,
        score,
        totalMarks,
        timeTaken || 0,
        JSON.stringify(questionResults),
        "graded",
        "challenge",
      ],
    );

    // Check if all accepted participants completed → mark challenge complete
    const { rows: allParts } = await db.query(
      "SELECT status FROM challenge_participants WHERE challenge_id = $1 AND status IN ('ACCEPTED', 'COMPLETED')",
      [id],
    );

    const allDone = allParts.every((p: any) => p.status === "COMPLETED");
    if (allDone) {
      await db.query(
        "UPDATE challenges SET status = 'COMPLETED' WHERE id = $1",
        [id],
      );
    }

    return successResponse(
      {
        score,
        totalMarks,
        percentage,
        pointsAwarded,
        questionResults,
      },
      "Challenge submitted!",
    );
  } catch (error) {
    console.error("Submit challenge error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
