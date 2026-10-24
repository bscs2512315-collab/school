import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { parsePaperVariant } from "@/lib/paper/variant-parser";

async function attachPaperCounts<T extends { id: string }>(
  classrooms: T[],
): Promise<Array<T & { paperCount: number }>> {
  if (classrooms.length === 0) {
    return classrooms.map((c) => ({ ...c, paperCount: 0 }));
  }

  const ids = classrooms.map((c) => c.id);
  try {
    const { rows } = await db.query(
      `SELECT classroom_id, id, title
       FROM teacher_papers
       WHERE classroom_id = ANY($1::text[])`,
      [ids],
    );

    const counts = new Map<string, number>();
    for (const id of ids) {
      counts.set(id, 0);
    }

    // Group papers by classroom and count distinct tests (consolidating multi-set variants)
    const classroomTests = new Map<string, Set<string>>();
    for (const row of rows) {
      const cId = String(row.classroom_id);
      if (!classroomTests.has(cId)) {
        classroomTests.set(cId, new Set<string>());
      }
      const { baseTitle, setLetter } = parsePaperVariant(row.title || "");
      const groupKey = setLetter
        ? baseTitle.trim().toLowerCase()
        : `__single__${row.id}`;
      classroomTests.get(cId)!.add(groupKey);
    }

    for (const [cId, testKeys] of classroomTests.entries()) {
      counts.set(cId, testKeys.size);
    }

    return classrooms.map((c) => ({
      ...c,
      paperCount: counts.get(c.id) ?? 0,
    }));
  } catch (e) {
    console.error("Attach classroom paper counts error:", e);
    return classrooms.map((c) => ({ ...c, paperCount: 0 }));
  }
}

/**
 * GET /api/classrooms
 * - STUDENT: classrooms student joined via PIN code / invitation
 * - TEACHER: classrooms explicitly created by teacher
 */
export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);

    if (user.role === UserRole.STUDENT) {
      const { rows: memberRooms } = await db.query(
        `SELECT cm.classroom_id, cm.subject, cm.class_level, cm.teacher_id,
                u.name AS teacher_name, u.profile_image, cl.school_name, cl.name AS classroom_name,
                cl.board, cl.pin_code, cl.created_at
         FROM classroom_members cm
         JOIN users u ON u.id = cm.teacher_id
         JOIN teacher_classrooms cl ON cl.id = cm.classroom_id
         WHERE cm.student_id = $1
           AND cm.status = 'accepted'
           AND cl.status != 'deleted'
         ORDER BY cm.created_at DESC`,
        [user.userId],
      );

      const classrooms = memberRooms.map((row) => ({
        id: row.classroom_id,
        name: (row.classroom_name || `${row.subject} - Class ${row.class_level}`).replace(/\s*\(Private\)\s*/gi, "").trim(),
        teacherId: row.teacher_id,
        teacherName: row.teacher_name,
        teacherImage: row.profile_image,
        subject: row.subject,
        classLevel: row.class_level,
        board: row.board || "AKUEB",
        pinCode: row.pin_code || null,
        pin: row.pin_code || null,
        schoolName: row.school_name || null,
        visibility: "private" as const,
      }));

      return successResponse(
        await attachPaperCounts(classrooms),
        "Classrooms fetched",
      );
    }

    if (user.role === UserRole.TEACHER) {
      const { rows: teacherRows } = await db.query(
        `SELECT id, name, profile_image, school_name FROM users WHERE id = $1`,
        [user.userId],
      );
      if (!teacherRows.length) return errorResponse("Teacher not found", 404);

      const t = teacherRows[0];

      const { rows } = await db.query(
        `SELECT id, name, teacher_id, subject, class_level, board, pin_code, school_name, created_at
         FROM teacher_classrooms
         WHERE teacher_id = $1 AND status != 'deleted'
         ORDER BY created_at DESC`,
        [user.userId],
      );

      const classrooms = rows.map((row) => ({
        id: row.id,
        name: (row.name || `${row.subject} - Class ${row.class_level}`).replace(/\s*\(Private\)\s*/gi, "").trim(),
        teacherId: row.teacher_id,
        teacherName: t.name,
        teacherImage: t.profile_image,
        subject: row.subject,
        classLevel: row.class_level,
        board: row.board || "AKUEB",
        pinCode: row.pin_code || null,
        pin: row.pin_code || null,
        schoolName: row.school_name || t.school_name || null,
        visibility: "private" as const,
      }));

      return successResponse(
        await attachPaperCounts(classrooms),
        "Classrooms fetched",
      );
    }

    if (user.role === UserRole.SCHOOL) {
      const { rows } = await db.query(
        `SELECT cl.id, cl.name, cl.teacher_id, cl.subject, cl.class_level, cl.board,
                cl.pin_code, cl.school_name, u.name AS teacher_name, u.profile_image
         FROM teacher_classrooms cl
         JOIN users u ON u.id = cl.teacher_id
         WHERE cl.status != 'deleted'
           AND (cl.school_id = $1 OR u.school_id = $1)
         ORDER BY cl.created_at DESC`,
        [user.userId],
      );

      const classrooms = rows.map((row) => ({
        id: row.id,
        name: (row.name || `${row.subject} - Class ${row.class_level}`).replace(/\s*\(Private\)\s*/gi, "").trim(),
        teacherId: row.teacher_id,
        teacherName: row.teacher_name,
        teacherImage: row.profile_image,
        subject: row.subject,
        classLevel: row.class_level,
        board: row.board || "AKUEB",
        pinCode: row.pin_code || null,
        pin: row.pin_code || null,
        schoolName: row.school_name,
        visibility: "private" as const,
      }));

      return successResponse(
        await attachPaperCounts(classrooms),
        "Classrooms fetched",
      );
    }

    return errorResponse("Unauthorized", 403);
  } catch (error) {
    console.error("Fetch classrooms error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export { POST } from "@/app/api/teacher/classrooms/route";
