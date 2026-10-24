import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import {
  ensureClassroomSchema,
  parseClassroomId,
} from "@/lib/teacher/classroom-schema";
import {
  seededShuffle,
  studentPaperQuestionSeed,
} from "@/lib/paper/seeded-shuffle";
import { resolveStudentAssignedPaper } from "@/lib/paper/variant-assignment";

async function canAccessTeacherPaper(
  userId: string,
  role: string,
  paper: {
    teacher_id: string;
    classroom_id: string;
    class_level: string;
  },
): Promise<boolean> {
  if (role === UserRole.TEACHER) {
    return paper.teacher_id === userId;
  }

  if (role !== UserRole.STUDENT) return false;

  const parsed = parseClassroomId(paper.classroom_id);
  if (!parsed) return false;

  const { rows: memberRows } = await db.query(
    `SELECT 1 FROM classroom_members
     WHERE classroom_id = $1 AND student_id = $2 AND status = 'accepted'
     LIMIT 1`,
    [paper.classroom_id, userId],
  );
  if (memberRows.length > 0) return true;

  // Private classrooms require membership only
  if (parsed.visibility === "private") return false;

  const { rows: teacherRows } = await db.query(
    `SELECT school_id, school_name FROM users WHERE id = $1`,
    [paper.teacher_id],
  );
  const { rows: studentRows } = await db.query(
    `SELECT school_id, school_name, class FROM users WHERE id = $1`,
    [userId],
  );
  if (!teacherRows.length || !studentRows.length) return false;

  const teacher = teacherRows[0];
  const student = studentRows[0];
  const sameSchool =
    (student.school_id && student.school_id === teacher.school_id) ||
    (!!student.school_name && student.school_name === teacher.school_name);
  const sameClass = student.class === paper.class_level;

  return sameSchool && sameClass;
}

/**
 * GET /api/student/teacher-papers/[id]
 * Returns assigned teacher paper for attempt (answers stripped for Paper 1).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);

    await ensureClassroomSchema();

    const { id: paperId } = await params;

    const { rows } = await db.query(
      `SELECT tp.*, u.exam_strict_mode AS teacher_strict_mode
       FROM teacher_papers tp
       LEFT JOIN users u ON u.id = tp.teacher_id
       WHERE tp.id = $1`,
      [paperId],
    );
    if (!rows.length) return errorResponse("Paper not found", 404);

    const paper = rows[0] as {
      teacher_id: string;
      classroom_id: string;
      class_level: string;
      paper_type: string;
      questions_snapshot: unknown;
      id: string;
      title: string;
      description: string | null;
      subject: string;
      board: string;
      total_marks: number;
      total_questions: number;
      due_date: string | null;
      strict_mode?: boolean | null;
      allow_resume?: boolean | null;
      teacher_strict_mode?: boolean | null;
    };
    let activePaper = paper;
    let displayTitle = paper.title;
    if (user.role === UserRole.STUDENT) {
      const resolved = await resolveStudentAssignedPaper(user.userId, paper);
      activePaper = {
        ...resolved.paper,
        teacher_strict_mode:
          resolved.paper.teacher_strict_mode ?? paper.teacher_strict_mode,
      } as typeof paper;
      displayTitle = resolved.baseTitle;
    }

    const allowed = await canAccessTeacherPaper(user.userId, user.role, activePaper);
    if (!allowed) return errorResponse("Access denied", 403);

    const snapshot =
      typeof activePaper.questions_snapshot === "string"
        ? JSON.parse(activePaper.questions_snapshot)
        : activePaper.questions_snapshot || [];

    const paperTypeNum = String(activePaper.paper_type).includes("2") ? 2 : 1;

    const mappedQuestions = (Array.isArray(snapshot) ? snapshot : []).map(
      (q: Record<string, unknown>) => {
        let mcqOptions: Array<{ id: string; text: string }> | null = null;
        if (paperTypeNum === 1 && Array.isArray(q.mcqOptions)) {
          mcqOptions = (q.mcqOptions as unknown[]).map((opt, index) => {
            if (opt && typeof opt === "object" && "id" in (opt as object)) {
              const o = opt as { id: string; text: string };
              return { id: o.id, text: o.text };
            }
            const text = String(opt ?? "");
            const letter = String.fromCharCode(65 + index);
            return {
              id: letter,
              text: text.replace(/^[A-D][).:\-]\s*/i, "").trim() || text,
            };
          });
        }

        return {
          id: q.id,
          questionNumber: q.questionNumber,
          questionPart: q.questionPart ?? null,
          questionText: q.questionText,
          questionType: q.questionType,
          marks: q.marks ?? 1,
          chapterName: q.chapterName ?? null,
          imageUrl: q.imageUrl ?? null,
          ...(paperTypeNum === 1 ? { mcqOptions } : {}),
        };
      },
    );

    // Each student gets a different but stable question order (Paper 1 & 2).
    // Teachers preview the original snapshot order. Grading stays keyed by question id.
    const orderedQuestions =
      user.role === UserRole.STUDENT
        ? seededShuffle(
            mappedQuestions,
            studentPaperQuestionSeed(user.userId, activePaper.id),
          )
        : mappedQuestions;

    const questions = orderedQuestions.map((q, index) => ({
      ...q,
      questionNumber: index + 1,
    }));

    const allowResume =
      activePaper.allow_resume !== undefined && activePaper.allow_resume !== null
        ? Boolean(activePaper.allow_resume)
        : true;
    let savedProgress: {
      answers: Record<string, unknown>;
      currentQuestionIndex: number;
      timeLeft: number;
      timeSpent: number;
      updatedAt: string;
    } | null = null;

    if (user.role === UserRole.STUDENT) {
      try {
        const { rows: progressRows } = await db.query(
          `SELECT answers_data, current_question_index, time_left, time_spent, updated_at
           FROM teacher_paper_progress
           WHERE user_id = $1 AND teacher_paper_id = $2 AND status = 'in_progress'`,
          [user.userId, activePaper.id],
        );
        if (progressRows.length > 0) {
          const pr = progressRows[0];
          savedProgress = {
            answers:
              typeof pr.answers_data === "string"
                ? JSON.parse(pr.answers_data)
                : pr.answers_data || {},
            currentQuestionIndex: Number(pr.current_question_index) || 0,
            timeLeft: Number(pr.time_left) || 0,
            timeSpent: Number(pr.time_spent) || 0,
            updatedAt: pr.updated_at,
          };
        }
      } catch (err) {
        console.error("Error checking student paper progress:", err);
      }
    }

    return successResponse(
      {
        id: activePaper.id,
        generatedPaperId: activePaper.id,
        title: displayTitle,
        description: activePaper.description,
        paperType: paperTypeNum,
        subject: activePaper.subject,
        classLevel: activePaper.class_level,
        board: activePaper.board,
        classroomId: activePaper.classroom_id,
        totalMarks: activePaper.total_marks,
        totalQuestions: activePaper.total_questions,
        dueDate: activePaper.due_date,
        strictMode:
          activePaper.strict_mode !== null && activePaper.strict_mode !== undefined
            ? Boolean(activePaper.strict_mode)
            : Boolean(activePaper.teacher_strict_mode ?? false),
        allowResume: true,
        savedProgress,
        questions,
      },
      "Teacher paper fetched",
    );
  } catch (error) {
    console.error("Fetch teacher paper error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
