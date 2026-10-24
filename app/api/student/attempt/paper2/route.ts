import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createNotification } from "@/lib/notifications";
import { scheduleNovaPaper2Grading } from "@/lib/ai/nova-paper2-grade";
import {
  getPaper2GradingMode,
  PAPER2_GRADING_MODE,
} from "@/lib/settings/paper2-grading-mode";
import { verifyAuth } from "@/lib/auth-utils";

/**
 * POST /api/student/attempt/paper2
 * Submit a Paper II exam attempt with image-based answers.
 * AI mode: Nova grades asynchronously. Manual mode: queues for admin review.
 */
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


    const { rows: paperDetails } = await db.query(
      `SELECT subject, board FROM past_papers WHERE id = $1`,
      [paperId],
    );
    const subject = paperDetails[0]?.subject || "Unknown Subject";
    const isSindhBoard = Boolean(paperDetails[0]?.board?.toLowerCase().includes("sindh"));

    let paperTotalMarks = 0;
    if (isSindhBoard) {
      const { rows: qRows } = await db.query<{
        id: string;
        marks: number;
        question_number: number;
        question_part: string | null;
      }>(
        `SELECT id, marks, question_number, question_part
         FROM questions
         WHERE past_paper_id = $1 AND question_type IN ('CRQ', 'ERQ')
         ORDER BY question_number ASC, created_at ASC`,
        [paperId],
      );

      let i = 0;
      while (i < qRows.length) {
        const q = qRows[i];
        const nextQ = qRows[i + 1];
        const nextIsOr =
          nextQ &&
          ((nextQ.question_part || "").toUpperCase().includes("OR") &&
            (nextQ.question_number === q.question_number || !nextQ.question_number));

        if (nextIsOr) {
          paperTotalMarks += Math.max(q.marks || 0, nextQ.marks || 0);
          i += 2;
        } else {
          paperTotalMarks += q.marks || 0;
          i += 1;
        }
      }
    } else {
      const { rows: markRows } = await db.query<{ total_marks: string }>(
        `SELECT COALESCE(SUM(marks), 0)::text AS total_marks
         FROM questions
         WHERE past_paper_id = $1 AND question_type IN ('CRQ', 'ERQ')`,
        [paperId],
      );
      paperTotalMarks = parseInt(markRows[0]?.total_marks || "0", 10);
    }

    const attemptId = randomUUID();
    const gradingMode = await getPaper2GradingMode();
    const initialStatus =
      gradingMode === PAPER2_GRADING_MODE.AI ? "pending" : "pending_manual";

    await db.query(
      `INSERT INTO exam_attempts (id, user_id, paper_id, subject, score, total_marks, time_taken, answers_data, grading_status, paper_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        attemptId,
        userId,
        paperId,
        subject,
        0,
        paperTotalMarks,
        timeTaken || 0,
        JSON.stringify(answers),
        initialStatus,
        "paper2",
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
            message: `A new Paper II submission for ${subject} requires manual grading.`,
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
  } catch (error: unknown) {
    console.error("Paper II Attempt Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit Paper II attempt" },
      { status: 500 },
    );
  }
}
