import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { GradingStatus, UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ensureClassroomSchema } from "@/lib/teacher/classroom-schema";
import { recoverStuckPendingGradings } from "@/lib/ai/nova-paper2-grade";
import { parsePaperVariant } from "@/lib/paper/variant-parser";

/**
 * GET /api/teacher/classrooms/[classroomId]/attempts?tab=attempted|result
 * Lists student attempts for Practice Tests in this classroom.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    await ensureClassroomSchema();
    const { classroomId: classroomIdParam } = await params;
    const classroomId = decodeURIComponent(classroomIdParam);
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "attempted";

    const { rows: classrooms } = await db.query(
      `SELECT id FROM teacher_classrooms WHERE id = $1 AND teacher_id = $2`,
      [classroomId, user.userId],
    );
    if (!classrooms.length) {
      return errorResponse("Classroom not found", 404);
    }

    await db
      .query(
        `ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS grading_status VARCHAR(32) DEFAULT 'graded'`,
      )
      .catch(() => {});

    try {
      await recoverStuckPendingGradings({ cutoffMinutes: 3, limit: 10 });
    } catch (recoverError) {
      console.error("Auto-recover pending gradings failed:", recoverError);
    }

    const statusFilter =
      tab === "result"
        ? [GradingStatus.GRADED]
        : [
            GradingStatus.PENDING_AI,
            GradingStatus.PENDING_MANUAL,
            GradingStatus.AWAITING_APPROVAL,
            GradingStatus.FAILED,
          ];

    const placeholders = statusFilter.map((_, i) => `$${i + 2}`).join(",");

    const { rows } = await db.query(
      `SELECT
         ea.id,
         ea.user_id AS "studentId",
         u.name AS "studentName",
         u.profile_image AS "studentImage",
         ea.teacher_paper_id AS "paperId",
         tp.title AS "paperTitle",
         tp.paper_type AS "paperType",
         ea.score,
         ea.total_marks AS "totalMarks",
         ea.grading_status AS "gradingStatus",
         ea.created_at AS "submittedAt",
         ea.feedback
       FROM exam_attempts ea
       JOIN teacher_papers tp ON tp.id = ea.teacher_paper_id
       JOIN users u ON u.id = ea.user_id
       WHERE tp.classroom_id = $1
         AND ea.grading_status IN (${placeholders})
       ORDER BY ea.created_at ASC`,
      [classroomId, ...statusFilter],
    );

    // Compute continuous attemptNumber per student and base title
    const countMap = new Map<string, number>();
    const processed = rows.map((row) => {
      const { baseTitle } = parsePaperVariant(row.paperTitle || "");
      const key = `${row.studentId}:${baseTitle.toLowerCase()}`;
      const current = (countMap.get(key) || 0) + 1;
      countMap.set(key, current);
      return {
        ...row,
        attemptNumber: current,
        percentage:
          Number(row.totalMarks) > 0
            ? Math.round((Number(row.score) / Number(row.totalMarks)) * 100)
            : null,
      };
    });

    // Return in descending order (most recent first)
    processed.reverse();

    return successResponse(
      {
        attempts: processed,
        tab,
      },
      "Classroom attempts",
    );
  } catch (error) {
    console.error("List classroom attempts error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
