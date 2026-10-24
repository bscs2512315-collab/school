import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ensureClassroomSchema } from "@/lib/teacher/classroom-schema";
import { formatMathToUnicode } from "@/lib/utils/math-notation";

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

/**
 * GET /api/teacher/classrooms/[classroomId]/attempts/[attemptId]
 * Detail for teacher review / result view (uses teacher_papers snapshot).
 */
export async function GET(
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

    const { rows } = await db.query(
      `SELECT
         ea.id,
         ea.user_id AS "studentId",
         u.name AS "studentName",
         u.profile_image AS "studentImage",
         ea.teacher_paper_id AS "paperId",
         tp.title AS "paperTitle",
         tp.paper_type AS "paperType",
         tp.subject,
         tp.class_level AS "classLevel",
         tp.classroom_id AS "classroomId",
         tp.questions_snapshot,
         ea.score,
         ea.total_marks AS "totalMarks",
         ea.grading_status AS "gradingStatus",
         ea.answers_data,
         ea.feedback,
         ea.created_at AS "submittedAt",
         ea.images_archived_at AS "imagesArchivedAt",
         (
           SELECT COUNT(*)::int
           FROM exam_attempts prior
           WHERE prior.user_id = ea.user_id
             AND prior.teacher_paper_id = ea.teacher_paper_id
             AND (
               prior.created_at < ea.created_at
               OR (prior.created_at = ea.created_at AND prior.id <= ea.id)
             )
         ) AS "attemptNumber"
       FROM exam_attempts ea
       JOIN teacher_papers tp ON tp.id = ea.teacher_paper_id
       JOIN users u ON u.id = ea.user_id
       WHERE ea.id = $1
         AND tp.classroom_id = $2
         AND tp.teacher_id = $3`,
      [attemptId, classroomId, user.userId],
    );

    if (!rows.length) {
      return errorResponse("Attempt not found", 404);
    }

    const attempt = rows[0];
    const snapshotRaw = attempt.questions_snapshot;
    const snapshot =
      typeof snapshotRaw === "string" ? JSON.parse(snapshotRaw) : snapshotRaw;
    const answers = parseJsonRecord(attempt.answers_data);

    const questions = (Array.isArray(snapshot) ? snapshot : []).map(
      (q: Record<string, unknown>) => {
        const id = String(q.id);
        const answer = answers[id];
        const answerObj =
          answer && typeof answer === "object"
            ? (answer as Record<string, unknown>)
            : null;

        const marks = Number(q.marks) || 1;
        const isMcqResult =
          answerObj != null &&
          ("correct" in answerObj || "selectedAnswer" in answerObj);

        let score: number | null = null;
        if (isMcqResult) {
          score = answerObj?.correct === true ? marks : 0;
        } else {
          const scoreRaw = answerObj?.score;
          score =
            typeof scoreRaw === "number"
              ? scoreRaw
              : typeof scoreRaw === "string"
                ? Number(scoreRaw) || 0
                : null;
        }

        const imageUrl =
            answerObj && typeof answerObj.imageUrl === "string"
              ? answerObj.imageUrl
              : null;
          const imageUrls = Array.isArray(answerObj?.imageUrls)
            ? answerObj.imageUrls.filter(
                (url): url is string => typeof url === "string",
              )
            : imageUrl
              ? [imageUrl]
              : [];
            const annotatedImageUrl =
              answerObj && typeof answerObj.annotatedImageUrl === "string"
                ? answerObj.annotatedImageUrl
                : null;
            const annotatedImageUrls = Array.isArray(answerObj?.annotatedImageUrls)
              ? answerObj.annotatedImageUrls.filter(
                  (url): url is string => typeof url === "string",
                )
              : annotatedImageUrl
                ? [annotatedImageUrl]
                : [];

            return {
              id,
              questionNumber: Number(q.questionNumber) || 0,
              questionPart: (q.questionPart as string | null) ?? null,
              questionText: String(q.questionText ?? ""),
              questionType: String(
                q.questionType ?? (isMcqResult ? "MCQ" : "CRQ"),
              ),
              marks,
              imageUrl,
              imageUrls,
              annotatedImageUrl,
              annotatedImageUrls,
              score,
              maxMarks:
                answerObj && typeof answerObj.maxMarks === "number"
                  ? answerObj.maxMarks
                  : marks,
              feedback: formatMathToUnicode(
                answerObj && typeof answerObj.feedback === "string"
                  ? answerObj.feedback
                  : "",
              ),
              gradedBy:
                answerObj && typeof answerObj.gradedBy === "string"
                  ? answerObj.gradedBy
                  : isMcqResult
                    ? "auto"
                    : null,
              correct:
                typeof answerObj?.correct === "boolean"
                  ? answerObj.correct
                  : null,
              selectedAnswer:
                typeof answerObj?.selectedAnswer === "string"
                  ? answerObj.selectedAnswer
                  : null,
              correctAnswer:
                typeof answerObj?.correctAnswer === "string"
                  ? answerObj.correctAnswer
                  : typeof q.correctAnswer === "string"
                    ? q.correctAnswer
                    : null,
              mcqOptions: Array.isArray(q.mcqOptions) ? q.mcqOptions : null,
              paperIIData: q.paperIIData ?? null,
              imagesArchived: Boolean(answerObj?.imagesArchived) || Boolean(attempt.imagesArchivedAt),
            };
          },
        );

    return successResponse(
      {
        attempt: {
          id: attempt.id,
          studentId: attempt.studentId,
          studentName: attempt.studentName,
          studentImage: attempt.studentImage,
          paperId: attempt.paperId,
          paperTitle: attempt.paperTitle,
          paperType: attempt.paperType,
          subject: attempt.subject,
          classLevel: attempt.classLevel,
          classroomId: attempt.classroomId,
          score: Number(attempt.score) || 0,
          totalMarks: Number(attempt.totalMarks) || 0,
          gradingStatus: attempt.gradingStatus,
          feedback: formatMathToUnicode(attempt.feedback || ""),
          submittedAt: attempt.submittedAt,
          attemptNumber: Number(attempt.attemptNumber) || 1,
          imagesArchivedAt: attempt.imagesArchivedAt ? String(attempt.imagesArchivedAt) : null,
          percentage:
            Number(attempt.totalMarks) > 0
              ? Math.round(
                  (Number(attempt.score) / Number(attempt.totalMarks)) * 100,
                )
              : 0,
        },
        questions,
      },
      "Attempt detail",
    );
  } catch (error) {
    console.error("Get classroom attempt error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
