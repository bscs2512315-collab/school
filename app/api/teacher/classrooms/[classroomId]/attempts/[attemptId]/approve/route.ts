import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { GradingStatus, UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ensureClassroomSchema, getClassroomSettings } from "@/lib/teacher/classroom-schema";
import { createNotification } from "@/lib/notifications";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { sendGradingResultEmail } from "@/lib/email";
import { awardStudentProgressPoints } from "@/lib/gamification/award-progress-points";

interface GradeInput {
  score: number;
  feedback?: string;
  annotatedImageUrl?: string | null;
  annotatedImageUrls?: string[];
}

function parseRecord(value: unknown): Record<string, Record<string, unknown>> {
  if (!value) return {};
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, Record<string, unknown>>)
      : {};
  } catch {
    return {};
  }
}

/**
 * POST /api/teacher/classrooms/[classroomId]/attempts/[attemptId]/approve
 * Teacher edits AI marks (optional) and approves result → student notified.
 */
export async function POST(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ classroomId: string; attemptId: string }>;
  },
) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    await ensureClassroomSchema();
    const { classroomId: classroomIdParam, attemptId } = await params;
    const classroomId = decodeURIComponent(classroomIdParam);
    const body = await req.json();
    const grades = body.grades as Record<string, GradeInput> | undefined;
    const overallFeedback =
      typeof body.overallFeedback === "string" ? body.overallFeedback : "";

    if (!grades || typeof grades !== "object") {
      return errorResponse("Grades are required", 400);
    }

    const { rows } = await db.query(
      `SELECT
         ea.id,
         ea.user_id AS "studentId",
         ea.grading_status AS "gradingStatus",
         ea.subject,
         tp.title AS "paperTitle",
         tp.classroom_id AS "classroomId",
         tp.teacher_id AS "teacherId",
         tp.questions_snapshot AS "questionsSnapshot",
         ea.answers_data AS "answersData"
       FROM exam_attempts ea
       JOIN teacher_papers tp ON tp.id = ea.teacher_paper_id
       WHERE ea.id = $1
         AND tp.classroom_id = $2
         AND tp.teacher_id = $3`,
      [attemptId, classroomId, user.userId],
    );

    if (!rows.length) {
      return errorResponse("Attempt not found", 404);
    }

    const attempt = rows[0];
    const wasApproved = attempt.gradingStatus === GradingStatus.GRADED;

    if (
      attempt.gradingStatus !== GradingStatus.GRADED &&
      attempt.gradingStatus !== GradingStatus.AWAITING_APPROVAL &&
      attempt.gradingStatus !== GradingStatus.PENDING_MANUAL &&
      attempt.gradingStatus !== GradingStatus.FAILED
    ) {
      return errorResponse(
        "Wait for AI grading to finish before approving",
        400,
      );
    }

    if (wasApproved) {
      const settings = await getClassroomSettings(classroomId);
      if (!settings.allowPostApprovalEdit) {
        return errorResponse(
          "Editing is disabled for this classroom",
          400,
        );
      }
    }

    const snapshot =
      typeof attempt.questionsSnapshot === "string"
        ? JSON.parse(attempt.questionsSnapshot)
        : attempt.questionsSnapshot;
    const questions = Array.isArray(snapshot) ? snapshot : [];
    if (questions.length === 0) {
      return errorResponse("Paper questions are unavailable", 400);
    }

    const existingAnswers = parseRecord(attempt.answersData);
    let totalScore = 0;
    let totalMaxMarks = 0;
    const gradingResults: Record<
      string,
      {
        score: number;
        maxMarks: number;
        feedback: string;
        imageUrl: string | null;
        imageUrls?: string[];
        annotatedImageUrl?: string | null;
        annotatedImageUrls?: string[];
        gradedBy: "teacher";
      }
    > = {};

    for (const question of questions) {
      const qId = String(question.id);
      const grade = grades[qId];
      if (!grade || !Number.isFinite(Number(grade.score))) {
        return errorResponse("Enter valid marks for every question", 400);
      }

      const prev = existingAnswers[qId];
      const existingImageUrl =
        typeof prev?.imageUrl === "string" ? (prev.imageUrl as string) : null;
      const existingImageUrls = Array.isArray(prev?.imageUrls)
        ? prev.imageUrls.filter((url): url is string => typeof url === "string")
        : existingImageUrl
          ? [existingImageUrl]
          : [];

      const annotatedImageUrl =
        typeof grade.annotatedImageUrl === "string"
          ? grade.annotatedImageUrl
          : typeof prev?.annotatedImageUrl === "string"
            ? (prev.annotatedImageUrl as string)
            : null;
      const annotatedImageUrls = Array.isArray(grade.annotatedImageUrls)
        ? grade.annotatedImageUrls.filter((url): url is string => typeof url === "string")
        : Array.isArray(prev?.annotatedImageUrls)
          ? prev.annotatedImageUrls.filter((url): url is string => typeof url === "string")
          : annotatedImageUrl
            ? [annotatedImageUrl]
            : [];

      const score = Math.max(0, Number(grade.score) || 0);
      const maxMarks = Math.max(0, Number(question.marks) || 0);
      const clamped = Math.min(score, maxMarks || score);
      totalScore += clamped;
      totalMaxMarks += maxMarks;
      gradingResults[qId] = {
        score: clamped,
        maxMarks,
        feedback: grade.feedback || "",
        imageUrl: existingImageUrl,
        imageUrls: existingImageUrls,
        annotatedImageUrl,
        annotatedImageUrls,
        gradedBy: "teacher",
      };
    }

    const percentage =
      totalMaxMarks > 0 ? Math.round((totalScore / totalMaxMarks) * 100) : 0;

    const updateResult = await db.query(
      `UPDATE exam_attempts
       SET
         score = $1,
         total_marks = $2,
         answers_data = $3,
         grading_status = $4,
         manual_grader_id = $5,
         feedback = $6,
         updated_at = NOW()
       WHERE id = $7
       RETURNING id`,
      [
        totalScore,
        totalMaxMarks,
        JSON.stringify(gradingResults),
        GradingStatus.GRADED,
        user.userId,
        overallFeedback,
        attemptId,
      ],
    );
    if (updateResult.rowCount === 0) {
      return errorResponse("Attempt not found", 409);
    }

    const { pointsAwarded } = wasApproved
      ? { pointsAwarded: 0 }
      : await awardStudentProgressPoints(
          attempt.studentId,
          {
            score: totalScore,
            totalMarks: totalMaxMarks,
            percentage,
            paperType: "paper2",
            questionCount: Object.keys(gradingResults).length,
          },
        );

    const { rows: studentRows } = await db.query<{
      name: string | null;
      email: string | null;
    }>(`SELECT name, email FROM users WHERE id = $1`, [attempt.studentId]);
    const student = studentRows[0];

    await createNotification({
      userId: attempt.studentId,
      type: "PAPER_RESULT_APPROVED",
      title: wasApproved
        ? "Practice Test result updated"
        : "Practice Test result approved",
      message: wasApproved
        ? `Your teacher updated ${attempt.paperTitle}: ${totalScore}/${totalMaxMarks} (${percentage}%).`
        : `Your teacher approved ${attempt.paperTitle}: ${totalScore}/${totalMaxMarks} (${percentage}%).`,
      link: FRONTEND_ROUTES.STUDENT_HISTORY_DETAIL(attemptId),
      metadata: {
        attemptId,
        classroomId,
        score: totalScore,
        totalMarks: totalMaxMarks,
        updated: wasApproved,
      },
    }).catch(() => {});

    if (student?.email) {
      try {
        await sendGradingResultEmail(
          student.email,
          student.name || "Student",
          {
            attemptId,
            subject: attempt.subject,
            score: totalScore,
            totalMarks: totalMaxMarks,
            percentage,
            pointsAwarded,
            gradingResults,
          },
        );
      } catch {
        // email is best-effort
      }
    }

    return successResponse(
      {
        totalScore,
        totalMaxMarks,
        percentage,
        pointsAwarded,
        gradingStatus: GradingStatus.GRADED,
        updated: wasApproved,
      },
      wasApproved ? "Result updated" : "Result approved",
    );
  } catch (error) {
    console.error("Approve classroom attempt error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
