import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import {
  ensureClassroomSchema,
  parseClassroomId,
  getClassroomSettings,
} from "@/lib/teacher/classroom-schema";
import {
  consolidatePapersForStudent,
  PaperRowLike,
} from "@/lib/paper/variant-assignment";

/**
 * GET /api/classrooms/[classroomId]
 * School: `{teacherId}__{subject}__{classLevel}`
 * Private: `{teacherId}__{subject}__{classLevel}__private`
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  try {
    const user = await verifyAuth(_req);
    if (!user) return errorResponse("Unauthorized", 401);

    const resolvedParams = await params;
    const classroomId = decodeURIComponent(resolvedParams.classroomId);
    const parsed = parseClassroomId(classroomId);
    if (!parsed) return errorResponse("Invalid classroom ID", 400);

    const { teacherId, subject, classLevel, visibility } = parsed;

    const { rows: teacherRows } = await db.query(
      `SELECT id, name, subjects, classes, profile_image, school_id, school_name
       FROM users WHERE id = $1 AND role = $2`,
      [teacherId, UserRole.TEACHER],
    );
    if (!teacherRows.length) return errorResponse("Classroom not found", 404);
    const teacher = teacherRows[0];

    await ensureClassroomSchema();

    const { rows: roomRows } = await db.query(
      `SELECT name, board, subject, class_level, pin_code FROM teacher_classrooms WHERE id = $1 LIMIT 1`,
      [classroomId],
    );
    const effectiveSubject = roomRows[0]?.subject || subject;
    const effectiveClassLevel = roomRows[0]?.class_level || classLevel;
    const rawName = roomRows[0]?.name || null;
    const classroomDisplayName = rawName
      ? rawName.replace(/\s*\(Private\)\s*/gi, "").trim()
      : `${effectiveSubject} - Class ${effectiveClassLevel}`;
    const classroomBoard = roomRows[0]?.board || "AKUEB";
    const classroomPinCode = roomRows[0]?.pin_code || null;

    if (user.role === UserRole.STUDENT) {
      const { rows: membership } = await db.query(
        `SELECT id FROM classroom_members
         WHERE classroom_id = $1 AND student_id = $2 AND status = 'accepted'
         LIMIT 1`,
        [classroomId, user.userId],
      );
      if (!membership.length) return errorResponse("Access denied. Please join this classroom with its PIN code first.", 403);
    } else if (user.role === UserRole.TEACHER) {
      if (user.userId !== teacherId) return errorResponse("Access denied", 403);
    } else if (user.role === UserRole.SCHOOL) {
      if (user.userId !== teacher.school_id) {
        return errorResponse("Access denied", 403);
      }
    }

    const globalForContent = globalThis as unknown as { __teacher_content_ready?: boolean };
    if (!globalForContent.__teacher_content_ready) {
      try {
        await db.query(`
          CREATE TABLE IF NOT EXISTS teacher_content (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            teacher_id TEXT NOT NULL,
            school_id TEXT,
            title TEXT NOT NULL,
            description TEXT,
            content_type TEXT NOT NULL,
            subject TEXT NOT NULL,
            target_classes TEXT[] DEFAULT '{}',
            questions_data JSONB,
            due_date TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        globalForContent.__teacher_content_ready = true;
      } catch (e) {
        console.error("Migration error (teacher_content):", e);
      }
    }

    const { rows: content } = await db.query(
      `SELECT id, title, description, content_type, subject, target_classes, questions_data, due_date, created_at
       FROM teacher_content
       WHERE teacher_id = $1
         AND subject = $2
         AND ($3 = ANY(target_classes) OR array_length(target_classes, 1) IS NULL OR array_length(target_classes, 1) = 0)
       ORDER BY created_at DESC`,
      [teacherId, subject, classLevel],
    );

    let papers: PaperRowLike[] = [];
    try {
      let paperQuery = `SELECT id, teacher_id, title, description, paper_type, subject, class_level, board,
                total_marks, total_questions, due_date, created_at, strict_mode, allow_resume,
                chapter_ids, question_ids, questions_snapshot, is_remedial, remedial_student_id
         FROM teacher_papers
         WHERE classroom_id = $1`;
      const queryParams: unknown[] = [classroomId];

      if (user.role === UserRole.STUDENT) {
        paperQuery += ` AND (is_remedial IS NULL OR is_remedial = false OR (is_remedial = true AND remedial_student_id = $2))`;
        queryParams.push(user.userId);
      } else {
        paperQuery += ` AND (is_remedial IS NULL OR is_remedial = false)`;
      }

      paperQuery += ` ORDER BY created_at DESC`;

      const { rows: paperRows } = await db.query(paperQuery, queryParams);
      papers = paperRows.map((row) => ({
        id: row.id,
        teacher_id: row.teacher_id,
        title: row.title,
        description: row.description,
        paperType: row.paper_type,
        paper_type: row.paper_type,
        subject: row.subject,
        classLevel: row.class_level,
        class_level: row.class_level,
        board: row.board,
        totalMarks: row.total_marks,
        total_marks: row.total_marks,
        totalQuestions: row.total_questions,
        total_questions: row.total_questions,
        dueDate: row.due_date,
        due_date: row.due_date,
        createdAt: row.created_at,
        chapter_ids: row.chapter_ids,
        question_ids: row.question_ids,
        questions_snapshot: row.questions_snapshot,
        strictMode:
          row.strict_mode !== null && row.strict_mode !== undefined
            ? Boolean(row.strict_mode)
            : true,
        allowResume: Boolean(row.allow_resume),
        is_remedial: Boolean(row.is_remedial),
        remedial_student_id: row.remedial_student_id,
      }));

      if (user.role === UserRole.STUDENT) {
        papers = await consolidatePapersForStudent(
          user.userId,
          classroomId,
          papers,
        );

        try {
          const { rows: progressRows } = await db.query(
            `SELECT teacher_paper_id FROM teacher_paper_progress
             WHERE user_id = $1 AND status = 'in_progress'`,
            [user.userId],
          );
          const progressSet = new Set(
            progressRows.map((r) => String(r.teacher_paper_id)),
          );
          papers = papers.map((p) => ({
            ...p,
            hasSavedProgress: progressSet.has(String(p.id)),
          }));
        } catch (e) {
          console.error("Error fetching progress for classroom papers:", e);
        }
      }
    } catch (e) {
      console.error("Fetch classroom papers error:", e);
    }

    return successResponse(
      {
        classroom: {
          id: classroomId,
          name: classroomDisplayName,
          teacherId: teacher.id,
          teacherName: teacher.name,
          teacherImage: teacher.profile_image,
          subject: effectiveSubject,
          classLevel: effectiveClassLevel,
          board: classroomBoard,
          pinCode: classroomPinCode,
          pin: classroomPinCode,
          schoolName: teacher.school_name || null,
          visibility: "private",
          settings: await getClassroomSettings(classroomId),
        },
        content,
        papers,
      },
      "Classroom details fetched",
    );
  } catch (error) {
    console.error("Fetch classroom detail error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
