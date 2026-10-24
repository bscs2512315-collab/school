import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import {
  ClassroomMemberStatus,
  GradingStatus,
  PaperType,
  UserRole,
} from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ensureClassroomSchema } from "@/lib/teacher/classroom-schema";

/**
 * GET /api/teacher/students
 * Students enrolled in this teacher's classrooms, with progress analytics.
 */
export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    await ensureClassroomSchema();

    const { rows: studentRows } = await db.query(
      `SELECT
        u.id,
        u.name,
        u.email,
        u.username,
        u.class,
        u.points,
        u.profile_image,
        JSONB_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'id', tc.id,
            'name', tc.name,
            'subject', tc.subject,
            'classLevel', tc.class_level
          )
        ) AS classrooms
       FROM classroom_members cm
       JOIN teacher_classrooms tc
         ON tc.id = cm.classroom_id
        AND tc.teacher_id = $1
        AND tc.status = 'active'
       JOIN users u ON u.id = cm.student_id
       WHERE cm.status = $3
         AND u.role = $2
       GROUP BY u.id
       ORDER BY u.name ASC`,
      [user.userId, UserRole.STUDENT, ClassroomMemberStatus.ACCEPTED],
    );

    if (studentRows.length === 0) {
      return successResponse([], "No students enrolled in your classrooms");
    }

    const studentIds = studentRows.map((student) => String(student.id));
    const { rows: paperRows } = await db.query(
      `SELECT
         id,
         classroom_id,
         title,
         subject,
         paper_type,
         total_marks,
         created_at
       FROM teacher_papers
       WHERE teacher_id = $1
       ORDER BY created_at DESC`,
      [user.userId],
    );

    const { rows: attemptRows } = await db.query(
      `SELECT
         ea.id,
         ea.user_id,
         ea.teacher_paper_id,
         ea.score,
         ea.total_marks,
         ea.time_taken,
         ea.answers_data,
         ea.grading_status,
         ea.created_at,
         tp.title,
         tp.subject,
         tp.paper_type,
         tp.classroom_id,
         tp.questions_snapshot
       FROM exam_attempts ea
       JOIN teacher_papers tp ON tp.id = ea.teacher_paper_id
       WHERE tp.teacher_id = $1
         AND ea.user_id = ANY($2::text[])
       ORDER BY ea.created_at DESC`,
      [user.userId, studentIds],
    );

    const papersByClassroom = new Map<string, typeof paperRows>();
    for (const paper of paperRows) {
      const classroomId = String(paper.classroom_id);
      papersByClassroom.set(classroomId, [
        ...(papersByClassroom.get(classroomId) ?? []),
        paper,
      ]);
    }

    const attemptsByStudent = new Map<string, typeof attemptRows>();
    for (const attempt of attemptRows) {
      const studentId = String(attempt.user_id);
      attemptsByStudent.set(studentId, [
        ...(attemptsByStudent.get(studentId) ?? []),
        attempt,
      ]);
    }

    const students = studentRows.map((student) => {
      const classrooms = Array.isArray(student.classrooms)
        ? student.classrooms
        : [];
      const assignedPapers = classrooms.flatMap(
        (classroom: { id?: unknown }) =>
          papersByClassroom.get(String(classroom.id)) ?? [],
      );
      const assignedPaperIds = new Set(
        assignedPapers.map((paper) => String(paper.id)),
      );
      const attempts = (
        attemptsByStudent.get(String(student.id)) ?? []
      ).filter((attempt) =>
        assignedPaperIds.has(String(attempt.teacher_paper_id)),
      );
      const attemptedPaperIds = new Set(
        attempts.map((attempt) => String(attempt.teacher_paper_id)),
      );

      const latestGradedByPaper = new Map<string, (typeof attempts)[number]>();
      for (const attempt of attempts) {
        if (
          attempt.grading_status === GradingStatus.GRADED &&
          !latestGradedByPaper.has(String(attempt.teacher_paper_id))
        ) {
          latestGradedByPaper.set(
            String(attempt.teacher_paper_id),
            attempt,
          );
        }
      }

      const subjectMap = new Map<
        string,
        {
          subject: string;
          score: number;
          marks: number;
          attempts: number;
          assigned: number;
          chapters: Map<
            string,
            { chapter: string; score: number; marks: number; questions: number }
          >;
        }
      >();

      for (const paper of assignedPapers) {
        const subject = String(paper.subject || "General");
        const current = subjectMap.get(subject) ?? {
          subject,
          score: 0,
          marks: 0,
          attempts: 0,
          assigned: 0,
          chapters: new Map(),
        };
        current.assigned += 1;
        subjectMap.set(subject, current);
      }

      for (const attempt of latestGradedByPaper.values()) {
        const subject = String(attempt.subject || "General");
        const current = subjectMap.get(subject) ?? {
          subject,
          score: 0,
          marks: 0,
          attempts: 0,
          assigned: 0,
          chapters: new Map(),
        };
        const score = Number(attempt.score) || 0;
        const marks = Number(attempt.total_marks) || 0;
        current.score += score;
        current.marks += marks;
        current.attempts += 1;

        const questions = parseArray(attempt.questions_snapshot);
        const answers = parseRecord(attempt.answers_data);
        for (const question of questions) {
          const questionId = String(question.id ?? "");
          const chapter = String(
            question.chapterName || "General",
          );
          const maxMarks = Math.max(0, Number(question.marks) || 1);
          const answer = asRecord(answers[questionId]);
          let earned = Math.min(
            maxMarks,
            Math.max(0, Number(answer.score) || 0),
          );
          if (attempt.paper_type === PaperType.PAPER_1) {
            earned = answer.correct === true ? maxMarks : 0;
          }
          const chapterStats = current.chapters.get(chapter) ?? {
            chapter,
            score: 0,
            marks: 0,
            questions: 0,
          };
          chapterStats.score += earned;
          chapterStats.marks += maxMarks;
          chapterStats.questions += 1;
          current.chapters.set(chapter, chapterStats);
        }
        subjectMap.set(subject, current);
      }

      const subjects = Array.from(subjectMap.values())
        .map((subject) => ({
          subject: subject.subject,
          progress: percentage(subject.score, subject.marks),
          attempts: subject.attempts,
          assigned: subject.assigned,
          chapters: Array.from(subject.chapters.values())
            .map((chapter) => ({
              chapter: chapter.chapter,
              progress: percentage(chapter.score, chapter.marks),
              questions: chapter.questions,
            }))
            .sort((a, b) => a.chapter.localeCompare(b.chapter)),
        }))
        .sort((a, b) => a.subject.localeCompare(b.subject));

      const latestGraded = Array.from(latestGradedByPaper.values());
      const totalScore = latestGraded.reduce(
        (sum, attempt) => sum + (Number(attempt.score) || 0),
        0,
      );
      const totalMarks = latestGraded.reduce(
        (sum, attempt) => sum + (Number(attempt.total_marks) || 0),
        0,
      );

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        username: student.username,
        class: student.class,
        points: Number(student.points) || 0,
        profile_image: student.profile_image,
        avg_score: percentage(totalScore, totalMarks),
        attempts_count: attempts.length,
        assigned_count: assignedPapers.length,
        completion_rate: percentage(
          attemptedPaperIds.size,
          assignedPapers.length,
        ),
        last_active_at: attempts[0]?.created_at ?? null,
        classrooms,
        subjects,
        recent_activity: attempts.slice(0, 5).map((attempt) => ({
          id: attempt.id,
          title: attempt.title,
          subject: attempt.subject,
          paperType: attempt.paper_type,
          status: attempt.grading_status,
          score:
            attempt.grading_status === GradingStatus.GRADED
              ? percentage(
                  Number(attempt.score) || 0,
                  Number(attempt.total_marks) || 0,
                )
              : null,
          timeTaken: Number(attempt.time_taken) || 0,
          attemptedAt: attempt.created_at,
        })),
      };
    });

    return successResponse(students, "Student analytics fetched successfully");
  } catch (error) {
    console.error("Fetch teacher students error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

function percentage(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function parseArray(value: unknown): Array<Record<string, unknown>> {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.map(asRecord) : [];
  } catch {
    return [];
  }
}

function parseRecord(value: unknown): Record<string, unknown> {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return asRecord(parsed);
  } catch {
    return {};
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
