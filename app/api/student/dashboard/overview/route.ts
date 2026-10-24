import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { UserRole } from "@/types/enums";
import type { LeaderboardSchool, LeaderboardUser } from "@/types/leaderboard";
import type { StudentHistoryItem } from "@/types/student";
import type { PastPaperSummary } from "@/types/past-paper";

/** One bounded database round trip for the dashboard's initial content. */
export async function GET(request: Request) {
  const user = await verifyAuth(request);
  if (!user || (user.role !== UserRole.STUDENT && user.role !== UserRole.QA && user.role !== "QA")) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const { rows } = await db.query<{
      students: LeaderboardUser[];
      schools: LeaderboardSchool[];
      rank: number | null;
      history: StudentHistoryItem[];
      pastPapers: PastPaperSummary[];
    }>(`
      WITH top_students AS (
        SELECT id, name, username, school_name, points, class, city, profile_image
        FROM users
        WHERE role = $1 AND role != 'QA' AND email != 'mtahatalib110+aliya@gmail.com' AND COALESCE(points, 0) >= 0
        ORDER BY COALESCE(points, 0) DESC, id ASC
        LIMIT 3
      ), student_podium AS (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', u.id, 'name', u.name, 'username', u.username,
          'schoolName', COALESCE(a.name, r.name, u.school_name, '—'),
          'schoolLogo', COALESCE(a.logo_url, r.profile_image),
          'points', COALESCE(u.points, 0), 'class', COALESCE(u.class, '—'),
          'city', COALESCE(u.city, 'Karachi'), 'profilePicture', u.profile_image
        ) ORDER BY COALESCE(u.points, 0) DESC, u.id ASC), '[]'::jsonb) AS students
        FROM top_students u
        LEFT JOIN LATERAL (
          SELECT name, logo_url FROM admin_schools
          WHERE LOWER(TRIM(name)) = LOWER(TRIM(u.school_name))
          ORDER BY name LIMIT 1
        ) a ON true
        LEFT JOIN LATERAL (
          SELECT name, profile_image FROM users
          WHERE role = $2 AND LOWER(TRIM(name)) = LOWER(TRIM(u.school_name))
          ORDER BY id LIMIT 1
        ) r ON true
      ), student_stats AS (
        SELECT LOWER(TRIM(school_name)) AS school_key,
               ROUND(AVG(GREATEST(COALESCE(points, 0), 0))) AS points,
               COUNT(*) AS student_count
        FROM users
        WHERE role = $1 AND role != 'QA' AND email != 'mtahatalib110+aliya@gmail.com' AND school_name IS NOT NULL
          AND TRIM(school_name) != '' AND school_name != '—'
        GROUP BY LOWER(TRIM(school_name))
      ), top_schools AS (
        SELECT a.id, a.name, COALESCE(s.points, 0) AS points,
               COALESCE(s.student_count, 0) AS student_count,
               a.logo_url, COALESCE(a.location, 'Karachi') AS city
        FROM admin_schools a
        LEFT JOIN student_stats s ON s.school_key = LOWER(TRIM(a.name))
        WHERE a.is_verified = true
          AND COALESCE(s.student_count, 0) > 0
        ORDER BY points DESC, student_count DESC, a.name ASC
        LIMIT 3
      ), school_podium AS (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', id, 'name', name, 'points', points,
          'studentCount', student_count, 'logoUrl', logo_url, 'city', city
        ) ORDER BY points DESC, student_count DESC, name ASC), '[]'::jsonb) AS schools
        FROM top_schools
      ), my_user AS (
        SELECT id, class, board, points FROM users WHERE id = $3
      ), my_rank AS (
        SELECT (
          SELECT COUNT(*)::int FROM users competitor
          WHERE competitor.role = $1 AND competitor.role != 'QA' AND competitor.email != 'mtahatalib110+aliya@gmail.com' AND COALESCE(competitor.points, 0) >= 0
            AND (
              COALESCE(competitor.points, 0) > COALESCE(me.points, 0)
              OR (COALESCE(competitor.points, 0) = COALESCE(me.points, 0)
                  AND competitor.id < me.id)
            )
        ) + 1 AS rank
        FROM my_user me
      ), recent_attempts AS (
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
        WHERE ea.user_id = $3
        ORDER BY ea.created_at DESC, ea.id DESC
        LIMIT 8
      ), recent_history AS (
        SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY a.created_at DESC, a.id DESC),
                        '[]'::jsonb) AS history
        FROM recent_attempts a
      ), recent_papers AS (
        SELECT p.id, p.class, p.board, p.subject, p.year,
               COALESCE(p.paper_number, 1) AS "paperNumber",
               p.total_questions AS "questionCount"
        FROM past_papers p CROSS JOIN my_user me
        WHERE UPPER(p.status) = 'COMPLETED'
          AND (me.class IS NULL OR p.class = me.class)
          AND (me.board IS NULL OR p.board = me.board)
        ORDER BY p.year DESC, p.subject ASC
        LIMIT 6
      ), recent_paper_list AS (
        SELECT COALESCE(jsonb_agg(to_jsonb(p) || jsonb_build_object('session', NULL)
                                  ORDER BY p.year DESC, p.subject ASC), '[]'::jsonb) AS papers
        FROM recent_papers p
      )
      SELECT student_podium.students, school_podium.schools, my_rank.rank,
             recent_history.history, recent_paper_list.papers AS "pastPapers"
      FROM student_podium CROSS JOIN school_podium
      CROSS JOIN recent_history CROSS JOIN recent_paper_list
      LEFT JOIN my_rank ON true
    `, [UserRole.STUDENT, UserRole.SCHOOL, user.userId]);

    return successResponse(rows[0] ?? {
      students: [], schools: [], rank: null, history: [], pastPapers: [],
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return errorResponse("Could not load dashboard", 500);
  }
}
