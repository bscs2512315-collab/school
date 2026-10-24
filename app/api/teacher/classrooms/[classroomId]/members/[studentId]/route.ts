import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import {
  ensureClassroomSchema,
  parseClassroomId,
} from "@/lib/teacher/classroom-schema";

/**
 * DELETE /api/teacher/classrooms/[classroomId]/members/[studentId]
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ classroomId: string; studentId: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    const { classroomId: rawClassroomId, studentId } = await params;
    const classroomId = decodeURIComponent(rawClassroomId);
    const parsed = parseClassroomId(classroomId);
    if (!parsed) return errorResponse("Invalid classroom ID", 400);
    if (parsed.teacherId !== user.userId) {
      return errorResponse("Access denied", 403);
    }

    await ensureClassroomSchema();

    const { rowCount } = await db.query(
      `DELETE FROM classroom_members
       WHERE classroom_id = $1 AND student_id = $2 AND teacher_id = $3`,
      [classroomId, studentId, user.userId],
    );

    if (!rowCount) return errorResponse("Member not found", 404);

    return successResponse(null, "Student removed from classroom");
  } catch (error) {
    console.error("Remove classroom member error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
