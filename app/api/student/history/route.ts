import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/student/history
 * Fetch test history for the authenticated student
 */
export async function GET(request: NextRequest) {
  const startedAt = performance.now();
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized. Please login.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = searchParams.get("limit");
    const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : null;
    const limit = parsedLimit !== null && Number.isFinite(parsedLimit)
      ? Math.min(100, Math.max(1, parsedLimit))
      : null;

    // For dashboard previews, fetch the newest rows first. Ranking every
    // historical attempt before LIMIT made an eight-item preview scale with
    // the entire account history.
    if (limit) {
      const queryStartedAt = performance.now();
      const { rows: history } = await db.query(
        `WITH recent_attempts AS (
           SELECT ea.id, ea.paper_id, ea.teacher_paper_id,
                  COALESCE(tp.title, ea.subject) AS title,
                  COALESCE(tp.subject, ea.subject) AS subject,
                  CASE WHEN ea.teacher_paper_id IS NOT NULL
                            AND COALESCE(ea.grading_status, 'graded') <> 'graded'
                       THEN 0 ELSE ea.score END AS score,
                  ea.total_marks, ea.time_taken, ea.created_at,
                  COALESCE(ea.grading_status, 'graded') AS grading_status,
                  COALESCE(ea.paper_type, 'paper1') AS paper_type,
                  tp.classroom_id
           FROM exam_attempts ea
           LEFT JOIN teacher_papers tp ON tp.id = ea.teacher_paper_id
           WHERE ea.user_id = $1
           ORDER BY ea.created_at DESC, ea.id DESC
           LIMIT $2
         )
         SELECT ra.*,
                (SELECT COUNT(*)::int FROM exam_attempts previous
                 WHERE previous.user_id = $1
                   AND COALESCE(previous.teacher_paper_id::text, previous.paper_id::text)
                       IS NOT DISTINCT FROM
                       COALESCE(ra.teacher_paper_id::text, ra.paper_id::text)
                   AND (previous.created_at, previous.id) <= (ra.created_at, ra.id)
                ) AS attempt_number
         FROM recent_attempts ra
         ORDER BY ra.created_at DESC, ra.id DESC`,
        [user.userId, limit],
      );
      const response = successResponse(history);
      response.headers.set("Server-Timing", `db;dur=${(performance.now() - queryStartedAt).toFixed(1)}, total;dur=${(performance.now() - startedAt).toFixed(1)}`);
      return response;
    }

    const queryParams: unknown[] = [user.userId];
    const queryText = `
      WITH numbered_attempts AS (
        SELECT 
          ea.id,
          ea.paper_id,
          ea.teacher_paper_id,
          COALESCE(tp.title, ea.subject) AS title,
          COALESCE(tp.subject, ea.subject) AS subject,
          CASE
            WHEN ea.teacher_paper_id IS NOT NULL
              AND COALESCE(ea.grading_status, 'graded') <> 'graded'
            THEN 0
            ELSE ea.score
          END AS score,
          ea.total_marks,
          ea.time_taken,
          ea.created_at,
          COALESCE(ea.grading_status, 'graded') AS grading_status,
          COALESCE(ea.paper_type, 'paper1') AS paper_type,
          tp.classroom_id,
          ROW_NUMBER() OVER (
            PARTITION BY ea.user_id, COALESCE(ea.teacher_paper_id::text, ea.paper_id::text)
            ORDER BY ea.created_at ASC, ea.id ASC
          )::int AS attempt_number
        FROM exam_attempts ea
        LEFT JOIN teacher_papers tp ON tp.id = ea.teacher_paper_id
        WHERE ea.user_id = $1
      )
      SELECT * FROM numbered_attempts
      ORDER BY created_at DESC
    `;

    const queryStartedAt = performance.now();
    const { rows: history } = await db.query(queryText, queryParams);

    const response = successResponse(history);
    response.headers.set("Server-Timing", `db;dur=${(performance.now() - queryStartedAt).toFixed(1)}, total;dur=${(performance.now() - startedAt).toFixed(1)}`);
    return response;
  } catch (error) {
    console.error("Fetch test history error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
