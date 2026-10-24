import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { randomUUID } from "crypto";
import { createNotification } from "@/lib/notifications";
import { scheduleNovaPaper2Grading } from "@/lib/ai/nova-paper2-grade";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { GradingStatus } from "@/types/enums";
import { awardStudentProgressPoints } from "@/lib/gamification/award-progress-points";
import {
  parsePaperVariant,
  resolveStudentAssignedPaper,
} from "@/lib/paper/variant-assignment";

function attemptOrdinalLabel(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const mod10 = n % 10;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}

/**
 * POST /api/student/teacher-papers/[id]/attempt
 * Submit attempt for a teacher-assigned Paper 1 / Paper 2.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user || (user.role !== UserRole.STUDENT && user.role !== UserRole.QA && user.role !== "QA")) {
      return errorResponse("Unauthorized", 401);
    }

    const { answers, timeTaken } = await req.json();
    const { id: paperId } = await params;

    const { rows } = await db.query(
      `SELECT * FROM teacher_papers WHERE id = $1`,
      [paperId],
    );
    if (!rows.length) return errorResponse("Paper not found", 404);
    const resolved = await resolveStudentAssignedPaper(
      user.userId,
      rows[0] as any,
    );
    const paper = resolved.paper as any;

    // Clear any intermediate draft progress upon final submission
    await db
      .query(
        `DELETE FROM teacher_paper_progress WHERE user_id = $1 AND teacher_paper_id = $2`,
        [user.userId, paper.id],
      )
      .catch((e) => console.error("Error clearing teacher paper progress:", e));

    const paperTypeNum = String(paper.paper_type).includes("2") ? 2 : 1;
    const snapshot =
      typeof paper.questions_snapshot === "string"
        ? JSON.parse(paper.questions_snapshot)
        : paper.questions_snapshot || [];

    const attemptId = randomUUID();

    const { rows: attRows } = await db.query<{ title: string }>(
      `SELECT tp.title
       FROM exam_attempts ea
       JOIN teacher_papers tp ON tp.id = ea.teacher_paper_id
       WHERE ea.user_id = $1 AND tp.classroom_id = $2`,
      [user.userId, paper.classroom_id],
    );
    const priorMatching = attRows.filter(
      (r) =>
        parsePaperVariant(r.title).baseTitle.toLowerCase() ===
        resolved.baseTitle.toLowerCase(),
    );
    const attemptNumber = priorMatching.length + 1;
    const attemptOrdinal = attemptOrdinalLabel(attemptNumber);

    // Check if teacher opted into attempt submission notifications
    let shouldNotifyTeacher = true;
    try {
      if (paper.classroom_id) {
        const { rows: crRows } = await db.query<{ settings: unknown }>(
          `SELECT settings FROM teacher_classrooms WHERE id = $1 LIMIT 1`,
          [paper.classroom_id],
        );
        if (crRows.length > 0 && crRows[0].settings) {
          const s =
            typeof crRows[0].settings === "string"
              ? JSON.parse(crRows[0].settings)
              : crRows[0].settings;
          if (s && typeof s.notifyOnAttemptSubmission === "boolean") {
            shouldNotifyTeacher = s.notifyOnAttemptSubmission;
          }
        }
      }
    } catch {
      // fallback to true
    }

    if (paperTypeNum === 1) {
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

      const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
      const isLate = paper.due_date ? new Date() > new Date(paper.due_date) : false;
      const { pointsAwarded: pointsEarned } = await awardStudentProgressPoints(
        user.userId,
        {
          score,
          totalMarks,
          percentage,
          paperType: "paper1",
          questionCount: snapshot.length,
          isLate,
        },
      );

      await db.query(
        `INSERT INTO exam_attempts
           (id, user_id, paper_id, generated_paper_id, teacher_paper_id, subject, paper_type,
            score, total_marks, answers_data, time_taken, grading_status)
         VALUES ($1,$2,NULL,NULL,$3,$4,'paper1',$5,$6,$7,$8,'graded')`,
        [
          attemptId,
          user.userId,
          paper.id,
          paper.subject,
          score,
          totalMarks,
          JSON.stringify(questionResults),
          timeTaken || 0,
        ],
      );

      const { rows: studentRows } = await db.query<{ name: string | null }>(
        `SELECT name FROM users WHERE id = $1`,
        [user.userId],
      );
      const studentName = studentRows[0]?.name || "A student";

      if (shouldNotifyTeacher) {
        await createNotification({
          userId: String(paper.teacher_id || ""),
          type: "PAPER_RESULT_APPROVED",
          title:
            attemptNumber > 1
              ? `Paper 1 · ${attemptOrdinal} attempt`
              : "Paper 1 result ready",
          message:
            attemptNumber > 1
              ? `${studentName} retook ${paper.title} (${attemptOrdinal} attempt): ${score}/${totalMarks} (${percentage}%).`
              : `${studentName} scored ${score}/${totalMarks} (${percentage}%) on ${paper.title}.`,
          link: FRONTEND_ROUTES.TEACHER_CLASSROOM_RESULTS(
            String(paper.classroom_id || ""),
          ),
          metadata: {
            attemptId,
            teacherPaperId: paper.id,
            classroomId: paper.classroom_id,
            action: "result",
            paperType: 1,
            attemptNumber,
          },
        }).catch(() => {});
      }

      return successResponse(
        {
          attemptId,
          attemptNumber,
          score,
          totalMarks,
          percentage,
          pointsEarned,
          isLate,
          questionResults,
          gradingStatus: "graded",
        },
        "Paper 1 submitted",
      );
    }

    // Paper 2 — always AI-grade first, then teacher reviews/approves
    const gradingStatus = GradingStatus.PENDING_AI;

    await db.query(
      `INSERT INTO exam_attempts
         (id, user_id, paper_id, generated_paper_id, teacher_paper_id, subject, paper_type,
          score, total_marks, answers_data, time_taken, grading_status)
       VALUES ($1,$2,NULL,NULL,$3,$4,'paper2',0,$5,$6,$7,$8)`,
      [
        attemptId,
        user.userId,
        paper.id,
        paper.subject,
        paper.total_marks || 0,
        JSON.stringify(answers || {}),
        timeTaken || 0,
        gradingStatus,
      ],
    );

    try {
      scheduleNovaPaper2Grading(attemptId);
    } catch {
      // async grading is fire-and-forget
    }

    const { rows: studentRows } = await db.query<{ name: string | null }>(
      `SELECT name FROM users WHERE id = $1`,
      [user.userId],
    );
    const studentName = studentRows[0]?.name || "A student";

    if (shouldNotifyTeacher) {
      await createNotification({
        userId: String(paper.teacher_id || ""),
        type: "PAPER_SUBMITTED",
        title:
          attemptNumber > 1
            ? `Paper 2 · ${attemptOrdinal} attempt`
            : "Paper 2 submitted",
        message:
          attemptNumber > 1
            ? `${studentName} retook ${paper.title} (${attemptOrdinal} attempt). Nova is grading now.`
            : `${studentName} submitted ${paper.title}. Nova is grading now.`,
        link: FRONTEND_ROUTES.TEACHER_CLASSROOM_ATTEMPTS(
          String(paper.classroom_id || ""),
        ),
        metadata: {
          attemptId,
          teacherPaperId: paper.id,
          classroomId: paper.classroom_id,
          action: "attempted",
          attemptNumber,
        },
      }).catch(() => {});
    }

    return successResponse(
      {
        attemptId,
        attemptNumber,
        gradingStatus,
        message: "Submitted — Nova is grading, then your teacher will review",
      },
      "Paper 2 submitted",
    );
  } catch (error) {
    console.error("Teacher paper attempt error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
