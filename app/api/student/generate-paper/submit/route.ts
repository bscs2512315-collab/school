import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createNotification } from "@/lib/notifications";
import { scheduleNovaPaper2Grading } from "@/lib/ai/nova-paper2-grade";
import {
  getPaper2GradingMode,
  PAPER2_GRADING_MODE,
} from "@/lib/settings/paper2-grading-mode";
import { awardStudentProgressPoints } from "@/lib/gamification/award-progress-points";
import { verifyAuth } from "@/lib/auth-utils";

/**
 * POST /api/student/generate-paper/submit
 * Submit a generated paper attempt.
 * Paper 1: Scores MCQs instantly, returns results + awards points
 * Paper 2: Creates pending attempt, triggers async Gemini grading
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { generatedPaperId, paperType, subject, answers, timeTaken } =
      await request.json();
    const userId = authUser.userId;

    const requestedType = paperType === 1 || paperType === "1" || paperType === "paper1"
      ? "1" : paperType === 2 || paperType === "2" || paperType === "paper2" ? "2" : null;
    if (!generatedPaperId || !requestedType || !subject) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }


    const attemptId = randomUUID();

    if (requestedType === "1") {
      // ── Paper 1: Instant MCQ scoring ──────────────────────────────────────

      const { rows: genPaper } = await db.query(
        `SELECT gp.question_ids, gp.questions_snapshot, gp.subject, gp.paper_type
         FROM generated_papers gp
         WHERE gp.id = $1
           AND (
             gp.user_id = $2
             OR gp.is_public = true
             OR EXISTS (
               SELECT 1 FROM paper_bank_shares s
               WHERE s.paper_id = gp.id AND s.receiver_id = $2
             )
           )`,
        [generatedPaperId, userId],
      );

      if (genPaper.length === 0) {
        return NextResponse.json(
          { success: false, message: "Generated paper not found or unauthorized" },
          { status: 404 },
        );
      }
      if (!["1", "paper1"].includes(String(genPaper[0].paper_type)) || genPaper[0].subject !== subject) {
        return NextResponse.json({ success: false, message: "Paper details do not match" }, { status: 400 });
      }

      // Increment paper attempt count asynchronously
      void db.query(`UPDATE generated_papers SET attempt_count = COALESCE(attempt_count, 0) + 1 WHERE id = $1`, [generatedPaperId]).catch(() => {});

      const snapshotRaw = genPaper[0].questions_snapshot;
      const snapshot =
        typeof snapshotRaw === "string"
          ? JSON.parse(snapshotRaw)
          : snapshotRaw;

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
            selectedAnswer === correctAnswer;
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
            selectedAnswer === correctAnswer;

          if (isCorrect) score += marks;

          questionResults[q.id] = {
            correct: isCorrect,
            correctAnswer,
            selectedAnswer,
          };
        }
      }

      // Insert attempt
      await db.query(
        `INSERT INTO exam_attempts (id, user_id, paper_id, subject, score, total_marks, time_taken, answers_data, grading_status, paper_type, generated_paper_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          attemptId,
          userId,
          null, // no paper_id for generated papers
          subject,
          score,
          totalMarks,
          timeTaken || 0,
          JSON.stringify(questionResults),
          "graded",
          "paper1",
          generatedPaperId,
        ],
      );

      // Award points + sync rank / milestone
      const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
      const questionCount = Object.keys(questionResults).length;
      const { pointsAwarded } = await awardStudentProgressPoints(userId, {
        score,
        totalMarks,
        percentage,
        paperType: "paper1",
        questionCount,
      });

      return NextResponse.json({
        success: true,
        message: "Paper graded successfully",
        data: {
          attemptId,
          score,
          totalMarks,
          percentage: Math.round(percentage),
          pointsAwarded,
          questionResults,
        },
      });
    } else {
      // ── Paper 2: Nova AI or manual grading ──────────────────────────────────

      const gradingMode = await getPaper2GradingMode();
      const initialStatus =
        gradingMode === PAPER2_GRADING_MODE.AI ? "pending" : "pending_manual";

      const { rows: genPaper } = await db.query(
        `SELECT gp.question_ids, gp.subject, gp.paper_type
         FROM generated_papers gp
         WHERE gp.id = $1
           AND (
             gp.user_id = $2
             OR gp.is_public = true
             OR EXISTS (
               SELECT 1 FROM paper_bank_shares s
               WHERE s.paper_id = gp.id AND s.receiver_id = $2
             )
           )`,
        [generatedPaperId, userId],
      );

      if (genPaper.length === 0) {
        return NextResponse.json(
          { success: false, message: "Generated paper not found or unauthorized" },
          { status: 404 },
        );
      }
      if (!["2", "paper2"].includes(String(genPaper[0].paper_type)) || genPaper[0].subject !== subject) {
        return NextResponse.json({ success: false, message: "Paper details do not match" }, { status: 400 });
      }

      // Increment paper attempt count asynchronously
      void db.query(`UPDATE generated_papers SET attempt_count = COALESCE(attempt_count, 0) + 1 WHERE id = $1`, [generatedPaperId]).catch(() => {});

      const questionIds =
        genPaper.length > 0
          ? typeof genPaper[0].question_ids === "string"
            ? JSON.parse(genPaper[0].question_ids)
            : genPaper[0].question_ids
          : [];

      // Get total marks from questions
      let totalMarks = 0;
      if (questionIds.length > 0) {
        const placeholders = questionIds
          .map((_: string, i: number) => `$${i + 1}`)
          .join(",");
        const { rows } = await db.query(
          `SELECT COALESCE(SUM(marks), 0) as total FROM questions WHERE id IN (${placeholders})`,
          questionIds,
        );
        totalMarks = parseInt(rows[0]?.total || "0", 10);
      }

      await db.query(
        `INSERT INTO exam_attempts (id, user_id, paper_id, subject, score, total_marks, time_taken, answers_data, grading_status, paper_type, generated_paper_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          attemptId,
          userId,
          null,
          subject,
          0,
          totalMarks,
          timeTaken || 0,
          JSON.stringify(answers),
          initialStatus,
          "paper2",
          generatedPaperId,
        ],
      );

      if (gradingMode === PAPER2_GRADING_MODE.AI) {
        scheduleNovaPaper2Grading(attemptId);
      } else {
        try {
          const { rows: admins } = await db.query(
            `SELECT id FROM users WHERE role = 'admin'`,
          );
          for (const admin of admins) {
            await createNotification({
              userId: admin.id,
              type: "PAPER_GRADED",
              title: "New Paper II Submission",
              message: `A generated Paper II for ${subject} requires manual grading.`,
              link: `/admin/review-exams`,
            });
          }
        } catch (notificationError) {
          console.error("Failed to notify admins", notificationError);
        }
      }

      return NextResponse.json({
        success: true,
        message:
          gradingMode === PAPER2_GRADING_MODE.AI
            ? "Paper II submitted. Nova is grading your answers."
            : "Paper II submitted. Pending manual review.",
        data: {
          attemptId,
          status: initialStatus,
        },
      });
    }
  } catch (error: any) {
    console.error("Submit generated paper error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit paper" },
      { status: 500 },
    );
  }
}
