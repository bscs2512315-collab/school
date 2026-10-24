import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import {
  ensureClassroomSchema,
  parseClassroomId,
  updateClassroomSettings,
  updateClassroomDetails,
  type ClassroomSettings,
  type ClassroomDetailsUpdate,
} from "@/lib/teacher/classroom-schema";

/**
 * DELETE /api/teacher/classrooms/[classroomId]
 * Soft-deletes the classroom (status='deleted') so it drops out of every
 * listing — teacher, school, and student — without losing the historical
 * papers/attempts tied to its id. Also removes any explicit student
 * memberships/invites for the room.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    const { classroomId: rawClassroomId } = await params;
    const classroomId = decodeURIComponent(rawClassroomId);
    const parsed = parseClassroomId(classroomId);
    if (!parsed) return errorResponse("Invalid classroom ID", 400);
    if (parsed.teacherId !== user.userId) {
      return errorResponse("Access denied", 403);
    }

    await ensureClassroomSchema();

    const { rowCount } = await db.query(
      `UPDATE teacher_classrooms
       SET status = 'deleted'
       WHERE id = $1 AND teacher_id = $2 AND status != 'deleted'`,
      [classroomId, user.userId],
    );

    if (!rowCount) {
      return errorResponse("Classroom not found", 404);
    }

    await db.query(`DELETE FROM classroom_members WHERE classroom_id = $1`, [
      classroomId,
    ]);

    return successResponse(null, "Classroom deleted");
  } catch (error) {
    console.error("Delete classroom error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

/**
 * PATCH /api/teacher/classrooms/[classroomId]
 * Updates classroom settings and/or details (name, board, subject, classLevel).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    const { classroomId: rawClassroomId } = await params;
    const classroomId = decodeURIComponent(rawClassroomId);
    const parsed = parseClassroomId(classroomId);
    if (!parsed) return errorResponse("Invalid classroom ID", 400);
    if (parsed.teacherId !== user.userId) {
      return errorResponse("Access denied", 403);
    }

    const body = await req.json();
    const settingsPatch: ClassroomSettings = {};
    let hasSettingsPatch = false;

    if (typeof body.autoApprovePaper2 === "boolean") {
      settingsPatch.autoApprovePaper2 = body.autoApprovePaper2;
      hasSettingsPatch = true;
    }
    if (typeof body.allowPostApprovalEdit === "boolean") {
      settingsPatch.allowPostApprovalEdit = body.allowPostApprovalEdit;
      hasSettingsPatch = true;
    }
    if (typeof body.notifyOnAttemptSubmission === "boolean") {
      settingsPatch.notifyOnAttemptSubmission = body.notifyOnAttemptSubmission;
      hasSettingsPatch = true;
    }

    if (hasSettingsPatch) {
      await updateClassroomSettings(classroomId, user.userId, settingsPatch);
    }

    const detailsPatch: ClassroomDetailsUpdate = {};
    let hasDetailsPatch = false;

    if (typeof body.name === "string") {
      detailsPatch.name = body.name.trim();
      hasDetailsPatch = true;
    }
    if (typeof body.board === "string" && body.board.trim()) {
      detailsPatch.board = body.board.trim();
      hasDetailsPatch = true;
    }
    if (typeof body.subject === "string" && body.subject.trim()) {
      detailsPatch.subject = body.subject.trim();
      hasDetailsPatch = true;
    }
    if (typeof body.classLevel === "string" && body.classLevel.trim()) {
      detailsPatch.classLevel = body.classLevel.trim();
      hasDetailsPatch = true;
    }

    if (hasDetailsPatch) {
      await updateClassroomDetails(classroomId, user.userId, detailsPatch);
    }

    // Fetch and return the latest state
    const { rows } = await db.query(
      `SELECT id, name, subject, class_level AS "classLevel", board, pin_code AS "pinCode", pin_code AS pin, visibility, settings
       FROM teacher_classrooms
       WHERE id = $1 LIMIT 1`,
      [classroomId],
    );

    return successResponse(
      rows[0] || { ...settingsPatch, ...detailsPatch },
      "Classroom updated successfully",
    );
  } catch (error) {
    console.error("Update classroom settings error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
