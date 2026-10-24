import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { Class, Board } from "@/types/enums";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";

export async function GET(req: Request) {
  const startedAt = performance.now();
  try {
    const admin = await getAdminFromRequest(
      req as unknown as Parameters<typeof getAdminFromRequest>[0]
    );
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    // Execute all independent stats queries concurrently
    const queryStartedAt = performance.now();
    const [
      statsRes,
      classRes,
      boardRes,
      queueRes,
      timelineRes,
      qbRes,
      studentLeaderboardRes,
      schoolLeaderboardRes,
      recentQueueRes,
      growthRes,
      schoolActivityRes,
      engagementRes,
    ] = await Promise.all([
      // 1. Overview Stats
      db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE LOWER(role) = 'student') as total_students,
          (
            SELECT COUNT(DISTINCT LOWER(name)) 
            FROM (
              SELECT name FROM admin_schools
              UNION 
              SELECT name FROM users WHERE LOWER(role) = 'school'
            ) all_schools
          ) as total_schools,
          (SELECT COUNT(DISTINCT ea.user_id) FROM exam_attempts ea
           JOIN users su ON su.id = ea.user_id AND LOWER(su.role) = 'student'
           WHERE ea.created_at >= CURRENT_DATE) as active_students
        FROM users
      `),
      // 2. Class Distribution
      db.query(`
        SELECT class, COUNT(*) as count
        FROM users
        WHERE LOWER(role) = 'student'
        GROUP BY class
      `),
      // 3. Board Distribution
      db.query(`
        SELECT board, COUNT(*) as count
        FROM users
        WHERE LOWER(role) = 'student'
        GROUP BY board
      `),
      // 4. Paper II grading queue (live)
      db.query<{
        pending_manual: string;
        pending_ai: string;
        graded: string;
        failed: string;
        total: string;
      }>(`
        SELECT
          COUNT(*) FILTER (WHERE ea.grading_status = 'pending_manual')::text AS pending_manual,
          COUNT(*) FILTER (WHERE ea.grading_status = 'pending')::text AS pending_ai,
          COUNT(*) FILTER (WHERE ea.grading_status = 'graded')::text AS graded,
          COUNT(*) FILTER (WHERE ea.grading_status = 'failed')::text AS failed,
          COUNT(*)::text AS total
        FROM exam_attempts ea
        WHERE ea.paper_type = 'paper2'
      `),
      // 5. Submissions timeline (last 14 days)
      db.query<{
        day: string;
        pending_manual: string;
        pending_ai: string;
        graded: string;
        failed: string;
      }>(`
        SELECT
          date_trunc('day', ea.created_at)::date::text AS day,
          COUNT(*) FILTER (WHERE ea.grading_status = 'pending_manual')::text AS pending_manual,
          COUNT(*) FILTER (WHERE ea.grading_status = 'pending')::text AS pending_ai,
          COUNT(*) FILTER (WHERE ea.grading_status = 'graded')::text AS graded,
          COUNT(*) FILTER (WHERE ea.grading_status = 'failed')::text AS failed
        FROM exam_attempts ea
        WHERE ea.paper_type = 'paper2'
          AND ea.created_at >= NOW() - INTERVAL '14 days'
        GROUP BY day
        ORDER BY day ASC
      `),
      // 6. Question bank overview
      db.query<{
        total_questions: string;
        paper1_questions: string;
        paper2_questions: string;
        questions_with_images: string;
      }>(`
        SELECT
          COUNT(*)::text AS total_questions,
          COUNT(*) FILTER (WHERE COALESCE(pp.paper_number, 1) = 1)::text AS paper1_questions,
          COUNT(*) FILTER (WHERE COALESCE(pp.paper_number, 1) = 2)::text AS paper2_questions,
          COUNT(*) FILTER (WHERE q.image_url IS NOT NULL AND TRIM(q.image_url) <> '')::text AS questions_with_images
        FROM questions q
        INNER JOIN past_papers pp ON q.past_paper_id = pp.id
      `),
      // 7. Student Leaderboard (Top 10)
      db.query(`
        SELECT 
          u.id, 
          u.name, 
          COALESCE(a.name, r.name, u.school_name) as "schoolName", 
          COALESCE(u.points, 0) as points, 
          u.class,
          u.profile_image as "profilePic",
          COALESCE(a.logo_url, r.profile_image) as "schoolLogo"
        FROM users u
        LEFT JOIN LATERAL (
          SELECT name, logo_url FROM admin_schools
          WHERE LOWER(TRIM(name)) = LOWER(TRIM(u.school_name))
          ORDER BY is_verified DESC, id ASC LIMIT 1
        ) a ON true
        LEFT JOIN LATERAL (
          SELECT name, profile_image FROM users
          WHERE LOWER(role) = 'school' AND LOWER(TRIM(name)) = LOWER(TRIM(u.school_name))
          ORDER BY id ASC LIMIT 1
        ) r ON true
        WHERE LOWER(u.role) = 'student' AND LOWER(u.role) != 'qa' AND u.email != 'mtahatalib110+aliya@gmail.com'
        ORDER BY u.points DESC NULLS LAST, u.id ASC
        LIMIT 10
      `),
      // 8. School Leaderboard (Top 10)
      db.query(`
        WITH student_stats AS (
          SELECT 
            LOWER(TRIM(school_name)) as school_key, 
            ROUND(AVG(GREATEST(COALESCE(points, 0), 0))) as points,
            COUNT(*) as "studentCount"
          FROM users
          WHERE LOWER(role) = 'student' 
            AND LOWER(role) != 'qa'
            AND email != 'mtahatalib110+aliya@gmail.com'
            AND school_name IS NOT NULL 
            AND TRIM(school_name) != '' 
            AND school_name != '—'
          GROUP BY LOWER(TRIM(school_name))
        )
        SELECT 
          a.name, 
          COALESCE(s.points, 0) as points, 
          COALESCE(s."studentCount", 0) as "studentCount",
          a.logo_url as "logoUrl",
          COALESCE(a.location, 'Karachi') as city
        FROM admin_schools a
        LEFT JOIN student_stats s ON s.school_key = LOWER(TRIM(a.name))
        WHERE a.is_verified = true
          AND COALESCE(s."studentCount", 0) > 0
        ORDER BY points DESC, "studentCount" DESC, a.name ASC
        LIMIT 10
      `),
      // 9. Recent grading queue (latest)
      db.query(`
        SELECT
          ea.id,
          ea.user_id,
          u.name as student_name,
          u.email as student_email,
          u.profile_image as student_profile_image,
          ea.subject,
          ea.score,
          ea.total_marks,
          ea.grading_status,
          ea.created_at
        FROM exam_attempts ea
        JOIN users u ON ea.user_id = u.id
        WHERE ea.paper_type = 'paper2'
        ORDER BY ea.created_at DESC
        LIMIT 6
      `),
      // 10. Daily acquisition and meaningful activity, including zero days.
      db.query<{ day: string; registrations: string; practicing_students: string; attempts: string }>(`
        WITH days AS (
          SELECT generate_series(CURRENT_DATE - 29, CURRENT_DATE, INTERVAL '1 day')::date AS day
        ), registrations AS (
          SELECT created_at::date AS day, COUNT(*)::text AS count
          FROM users WHERE LOWER(role) = 'student' AND created_at >= CURRENT_DATE - 29
          GROUP BY 1
        ), activity AS (
          SELECT ea.created_at::date AS day, COUNT(DISTINCT ea.user_id)::text AS students,
                 COUNT(*)::text AS attempts
          FROM exam_attempts ea
          JOIN users u ON u.id = ea.user_id AND LOWER(u.role) = 'student'
          WHERE ea.created_at >= CURRENT_DATE - 29
          GROUP BY 1
        )
        SELECT d.day::text AS day, COALESCE(r.count, '0') AS registrations,
               COALESCE(a.students, '0') AS practicing_students,
               COALESCE(a.attempts, '0') AS attempts
        FROM days d LEFT JOIN registrations r USING (day) LEFT JOIN activity a USING (day)
        ORDER BY d.day
      `),
      // 11. Which schools have students practicing, rather than merely registered.
      db.query<{ name: string; students: string; practicing_students: string; attempts: string }>(`
        WITH activity AS (
          SELECT user_id, COUNT(*) AS attempts FROM exam_attempts
          WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY user_id
        )
        SELECT a.name, COUNT(DISTINCT u.id)::text AS students,
               COUNT(DISTINCT u.id) FILTER (WHERE act.user_id IS NOT NULL)::text AS practicing_students,
               COALESCE(SUM(act.attempts), 0)::text AS attempts
        FROM admin_schools a
        LEFT JOIN users u ON LOWER(u.role) = 'student'
          AND LOWER(TRIM(u.school_name)) = LOWER(TRIM(a.name))
        LEFT JOIN activity act ON act.user_id = u.id
        WHERE a.is_verified = true
        GROUP BY a.id, a.name
        ORDER BY practicing_students DESC, attempts DESC, students DESC, a.name ASC
        LIMIT 8
      `),
      db.query<{ practicing_7d: string; practicing_30d: string; repeat_30d: string }>(`
        WITH student_activity AS (
          SELECT ea.user_id,
                 BOOL_OR(ea.created_at >= NOW() - INTERVAL '7 days') AS active_7d,
                 COUNT(DISTINCT ea.created_at::date) AS practice_days
          FROM exam_attempts ea
          JOIN users u ON u.id = ea.user_id AND LOWER(u.role) = 'student'
          WHERE ea.created_at >= NOW() - INTERVAL '30 days'
          GROUP BY ea.user_id
        )
        SELECT COUNT(*) FILTER (WHERE active_7d)::text AS practicing_7d,
               COUNT(*)::text AS practicing_30d,
               COUNT(*) FILTER (WHERE practice_days >= 2)::text AS repeat_30d
        FROM student_activity
      `),
    ]);

    const statsRows = statsRes.rows;
    const classRows = classRes.rows;
    const boardRows = boardRes.rows;
    const queueRows = queueRes.rows;
    const timelineRows = timelineRes.rows;
    const qbRows = qbRes.rows;
    const studentLeaderboard = studentLeaderboardRes.rows;
    const schoolLeaderboard = schoolLeaderboardRes.rows;
    const recentQueueRows = recentQueueRes.rows;

    const overview = {
      totalStudents: parseInt(statsRows[0]?.total_students) || 0,
      totalSchools: parseInt(statsRows[0]?.total_schools) || 0,
      activeStudents: parseInt(statsRows[0]?.active_students) || 0,
    };

    // Ensure all classes are present
    const classDistribution = Object.values(Class).map((className) => ({
      name: className,
      value: parseInt(classRows.find((r) => r.class === className)?.count) || 0,
    }));

    const boardDistribution = Object.values(Board).map((boardName) => ({
      name: boardName,
      value: parseInt(boardRows.find((r) => r.board === boardName)?.count) || 0,
    }));

    const gradingQueue = {
      pendingManual: parseInt(queueRows[0]?.pending_manual || "0", 10),
      pendingAI: parseInt(queueRows[0]?.pending_ai || "0", 10),
      graded: parseInt(queueRows[0]?.graded || "0", 10),
      failed: parseInt(queueRows[0]?.failed || "0", 10),
      total: parseInt(queueRows[0]?.total || "0", 10),
    };

    const submissionsTimeline = timelineRows.map((r) => ({
      day: r.day,
      pendingManual: parseInt(r.pending_manual || "0", 10),
      pendingAI: parseInt(r.pending_ai || "0", 10),
      graded: parseInt(r.graded || "0", 10),
      failed: parseInt(r.failed || "0", 10),
    }));

    const questionBank = {
      totalQuestions: parseInt(qbRows[0]?.total_questions || "0", 10),
      paper1Questions: parseInt(qbRows[0]?.paper1_questions || "0", 10),
      paper2Questions: parseInt(qbRows[0]?.paper2_questions || "0", 10),
      questionsWithImages: parseInt(qbRows[0]?.questions_with_images || "0", 10),
    };

    const response = NextResponse.json({
      success: true,
      data: {
        overview,
        classDistribution,
        boardDistribution,
        gradingQueue,
        submissionsTimeline,
        questionBank,
        leaderboards: {
          students: studentLeaderboard,
          schools: schoolLeaderboard.map((s) => ({
            ...s,
            points: parseInt(s.points) || 0,
            studentCount: parseInt(s.studentCount) || 0,
          })),
        },
        recentQueue: recentQueueRows,
        growthTimeline: growthRes.rows.map((r) => ({
          day: r.day,
          registrations: Number(r.registrations) || 0,
          practicingStudents: Number(r.practicing_students) || 0,
          attempts: Number(r.attempts) || 0,
        })),
        schoolActivity: schoolActivityRes.rows.map((r) => ({
          name: r.name,
          students: Number(r.students) || 0,
          practicingStudents: Number(r.practicing_students) || 0,
          attempts: Number(r.attempts) || 0,
        })),
        engagement: {
          practicing7d: Number(engagementRes.rows[0]?.practicing_7d) || 0,
          practicing30d: Number(engagementRes.rows[0]?.practicing_30d) || 0,
          repeat30d: Number(engagementRes.rows[0]?.repeat_30d) || 0,
        },
      },
    });
    response.headers.set("Server-Timing", `db;dur=${(performance.now() - queryStartedAt).toFixed(1)}, total;dur=${(performance.now() - startedAt).toFixed(1)}`);
    return response;
  } catch (error: unknown) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboard statistics" },
      { status: 500 },
    );
  }
}
