import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { ClassroomMemberStatus, UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import {
  ensureClassroomSchema,
  parseClassroomId,
} from "@/lib/teacher/classroom-schema";
import { FRONTEND_ROUTES } from "@/constants/endpoints";

/**
 * POST /api/classrooms/[classroomId]/join
 * Student accepts a pending classroom invitation.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user || (user.role !== UserRole.STUDENT && user.role !== UserRole.QA && user.role !== "QA")) {
      return errorResponse("Unauthorized", 401);
    }

    const { classroomId: rawClassroomId } = await params;
    const classroomId = decodeURIComponent(rawClassroomId);
    const parsed = parseClassroomId(classroomId);
    if (!parsed) return errorResponse("Invalid classroom ID", 400);

    await ensureClassroomSchema();

    const { rows } = await db.query(
      `SELECT id, status
       FROM classroom_members
       WHERE classroom_id = $1 AND student_id = $2
       LIMIT 1`,
      [classroomId, user.userId],
    );

    if (!rows.length) {
      return errorResponse("No invitation found for this classroom", 404);
    }

    const membership = rows[0];
    if (membership.status === ClassroomMemberStatus.ACCEPTED) {
      return successResponse(
        {
          classroomId,
          status: ClassroomMemberStatus.ACCEPTED,
          alreadyJoined: true,
          redirectTo: FRONTEND_ROUTES.STUDENT_CLASSROOM(classroomId),
        },
        "You have already joined this classroom",
      );
    }

    if (membership.status !== ClassroomMemberStatus.PENDING) {
      return errorResponse("This invitation is no longer valid", 400);
    }

    await db.query(
      `UPDATE classroom_members
       SET status = $1, accepted_at = NOW()
       WHERE classroom_id = $2 AND student_id = $3`,
      [ClassroomMemberStatus.ACCEPTED, classroomId, user.userId],
    );

    // Mark related invite notifications as accepted so the Join button hides
    await db
      .query(
        `UPDATE notifications
         SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
             is_read = true
         WHERE user_id = $2
           AND type = 'CLASSROOM_INVITE'
           AND metadata->>'classroomId' = $3`,
        [
          JSON.stringify({ status: ClassroomMemberStatus.ACCEPTED }),
          user.userId,
          classroomId,
        ],
      )
      .catch(() => {});

    return successResponse(
      {
        classroomId,
        status: ClassroomMemberStatus.ACCEPTED,
        alreadyJoined: false,
        redirectTo: FRONTEND_ROUTES.STUDENT_CLASSROOM(classroomId),
      },
      "Joined classroom successfully",
    );
  } catch (error) {
    console.error("Join classroom error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
