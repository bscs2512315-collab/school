import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { ClassroomMemberStatus, GradingStatus, UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ensureClassroomSchema } from "@/lib/teacher/classroom-schema";
import { parsePaperVariant } from "@/lib/paper/variant-parser";

/**
 * GET /api/student/classrooms/[classroomId]/results
 * Student's own graded Practice Test results in this classroom.
 * Paper 1 appears immediately (auto-graded). Paper 2 after teacher approval.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  try {
    const user = await verifyAuth(req);
    if (!user || (user.role !== UserRole.STUDENT && user.role !== UserRole.QA && user.role !== "QA")) {
      return errorResponse("Unauthorized", 401);
    }

    await ensureClassroomSchema();
    const { classroomId: classroomIdParam } = await params;
    const classroomId = decodeURIComponent(classroomIdParam);

    // Verify the student is an accepted member of this classroom.
    const { rows: membership } = await db.query(
      `SELECT id FROM classroom_members
       WHERE classroom_id = $1 AND student_id = $2 AND status = $3
       LIMIT 1`,
      [classroomId, user.userId, ClassroomMemberStatus.ACCEPTED],
    );
    if (membership.length === 0) {
      return errorResponse("You are not a member of this classroom", 403);
    }

    const { rows } = await db.query(
      `SELECT
         ea.id,
         ea.teacher_paper_id AS "paperId",
         tp.title AS "paperTitle",
         tp.paper_type AS "paperType",
         ea.score,
         ea.total_marks AS "totalMarks",
         ea.grading_status AS "gradingStatus",
         ea.created_at AS "submittedAt"
       FROM exam_attempts ea
       JOIN teacher_papers tp ON tp.id = ea.teacher_paper_id
       WHERE tp.classroom_id = $1
         AND ea.user_id = $2
         AND ea.grading_status = $3
       ORDER BY ea.created_at ASC`,
      [classroomId, user.userId, GradingStatus.GRADED],
    );

    // Compute continuous attemptNumber per base title
    const countMap = new Map<string, number>();
    const processed = rows.map((row) => {
      const { baseTitle } = parsePaperVariant(row.paperTitle || "");
      const current = (countMap.get(baseTitle.toLowerCase()) || 0) + 1;
      countMap.set(baseTitle.toLowerCase(), current);
      return {
        ...row,
        attemptNumber: current,
        percentage:
          Number(row.totalMarks) > 0
            ? Math.round((Number(row.score) / Number(row.totalMarks)) * 100)
            : 0,
      };
    });

    // Return in descending order (most recent first)
    processed.reverse();

    return successResponse(
      {
        results: processed,
      },
      "Classroom results",
    );
  } catch (error) {
    console.error("Student classroom results error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
