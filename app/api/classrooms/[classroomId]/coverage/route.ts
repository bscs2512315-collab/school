import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { parseClassroomId, ensureClassroomSchema } from "@/lib/teacher/classroom-schema";
import { computeClassroomCoverage } from "@/lib/paper/slo-coverage";
import { db } from "@/lib/db";

/**
 * GET /api/classrooms/[classroomId]/coverage
 * Returns the syllabus SLO coverage report for all tests assigned in the classroom.
 * Accessible to Students (with personalized mastery) and Teachers/Schools.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const resolvedParams = await params;
    const classroomId = decodeURIComponent(resolvedParams.classroomId);
    const parsed = parseClassroomId(classroomId);
    if (!parsed) return errorResponse("Invalid classroom ID", 400);

    const { teacherId, classLevel, visibility } = parsed;

    await ensureClassroomSchema();

    // Verify access
    if (user.role === UserRole.STUDENT) {
      if (visibility === "private") {
        const { rows: membership } = await db.query(
          `SELECT id FROM classroom_members
           WHERE classroom_id = $1 AND student_id = $2 AND status = 'accepted'
           LIMIT 1`,
          [classroomId, user.userId],
        );
        if (!membership.length) return errorResponse("Access denied", 403);
      } else {
        const { rows: studentRows } = await db.query(
          `SELECT school_id, school_name, class FROM users WHERE id = $1`,
          [user.userId],
        );
        const student = studentRows[0];
        const { rows: teacherRows } = await db.query(
          `SELECT school_id, school_name FROM users WHERE id = $1`,
          [teacherId],
        );
        const teacher = teacherRows[0];

        const sameSchool =
          teacher &&
          ((student.school_id && student.school_id === teacher.school_id) ||
            (!student.school_id && student.school_name === teacher.school_name));
        const sameClass = student.class === classLevel;

        if (!sameSchool || !sameClass) {
          const { rows: membership } = await db.query(
            `SELECT id FROM classroom_members
             WHERE classroom_id = $1 AND student_id = $2 AND status = 'accepted'
             LIMIT 1`,
            [classroomId, user.userId],
          );
          if (!membership.length) return errorResponse("Access denied", 403);
        }
      }
    } else if (user.role === UserRole.TEACHER) {
      if (user.userId !== teacherId) return errorResponse("Access denied", 403);
    } else if (user.role === UserRole.SCHOOL) {
      if (visibility === "private") return errorResponse("Access denied", 403);
    }

    const studentId = user.role === UserRole.STUDENT ? user.userId : null;
    const report = await computeClassroomCoverage(classroomId, studentId);

    return successResponse(report, "Classroom SLO coverage retrieved successfully");
  } catch (error) {
    console.error("Fetch classroom coverage error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
