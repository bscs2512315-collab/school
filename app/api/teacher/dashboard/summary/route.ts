import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { errorResponse, successResponse } from "@/lib/response-handlers";
import { UserRole } from "@/types/enums";
import { ensureClassroomSchema } from "@/lib/teacher/classroom-schema";

/** Small dashboard projection; the detailed student report stays on /teacher/students. */
export async function GET(request: Request) {
  const startedAt = performance.now();
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== UserRole.TEACHER) {
      return errorResponse("Unauthorized", 401);
    }

    const query =
      `WITH enrolled AS (
         SELECT DISTINCT u.id, u.name, u.class, u.profile_image
         FROM classroom_members cm
         JOIN teacher_classrooms tc ON tc.id = cm.classroom_id
         JOIN users u ON u.id = cm.student_id
         WHERE tc.teacher_id = $1 AND tc.status = 'active'
           AND cm.status = 'accepted' AND u.role = 'STUDENT'
           AND u.role != 'QA' AND u.email != 'mtahatalib110+aliya@gmail.com'
       ), assigned_attempts AS (
         SELECT ea.user_id, ea.teacher_paper_id, ea.score, ea.total_marks,
                ea.grading_status, ea.created_at, ea.id
         FROM exam_attempts ea
         JOIN teacher_papers tp ON tp.id = ea.teacher_paper_id
         JOIN enrolled e ON e.id = ea.user_id
         WHERE tp.teacher_id = $1
           AND EXISTS (
             SELECT 1 FROM classroom_members cm
             WHERE cm.student_id = ea.user_id
               AND cm.classroom_id = tp.classroom_id
               AND cm.status = 'accepted'
           )
       ), attempt_counts AS (
         SELECT user_id, COUNT(*)::int AS attempts_count
         FROM assigned_attempts GROUP BY user_id
       ), latest_graded AS (
         SELECT DISTINCT ON (user_id, teacher_paper_id)
                user_id, teacher_paper_id, score, total_marks
         FROM assigned_attempts
         WHERE grading_status = 'graded'
         ORDER BY user_id, teacher_paper_id, created_at DESC, id DESC
       ), scores AS (
         SELECT e.id, e.name, e.class, e.profile_image,
                COALESCE(ac.attempts_count, 0) AS attempts_count,
                COALESCE(ROUND(100.0 * SUM(lg.score) /
                  NULLIF(SUM(lg.total_marks), 0)), 0)::int AS avg_score
         FROM enrolled e
         LEFT JOIN attempt_counts ac ON ac.user_id = e.id
         LEFT JOIN latest_graded lg ON lg.user_id = e.id
         GROUP BY e.id, e.name, e.class, e.profile_image, ac.attempts_count
       )
       SELECT *, COUNT(*) OVER()::int AS student_count,
              ROUND(AVG(avg_score) OVER())::int AS overall_avg_score
       FROM scores
       ORDER BY avg_score DESC, name ASC
       LIMIT 5`;
    const queryStartedAt = performance.now();
    let result;
    try {
      result = await db.query(query, [user.userId]);
    } catch (error) {
      // Do not mutate the schema from a request. This check reports a clear
      // migration error for installations that are not initialized yet.
      if ((error as { code?: string }).code !== "42P01") throw error;
      await ensureClassroomSchema();
      result = await db.query(query, [user.userId]);
    }
    const { rows } = result;

    const response = successResponse({
      studentCount: rows[0]?.student_count ?? 0,
      avgScore: rows[0]?.overall_avg_score ?? 0,
      topStudents: rows.map((row) => ({
        id: row.id,
        name: row.name,
        class: row.class,
        profile_image: row.profile_image,
        avg_score: row.avg_score,
        attempts_count: row.attempts_count,
      })),
    });
    response.headers.set(
      "Server-Timing",
      `db;dur=${(performance.now() - queryStartedAt).toFixed(1)}, total;dur=${(performance.now() - startedAt).toFixed(1)}`,
    );
    return response;
  } catch (error) {
    console.error("Teacher dashboard summary error:", error);
    return errorResponse("Failed to load teacher dashboard summary", 500);
  }
}
