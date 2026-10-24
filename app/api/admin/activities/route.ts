import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { successResponse, errorResponse } from "@/lib/response-handlers";



export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;
    const search = (searchParams.get("search") || "").trim();
    const role = (searchParams.get("role") || "ALL").toUpperCase();
    const activityType = (searchParams.get("activityType") || "ALL").toUpperCase();
    const timeframe = (searchParams.get("timeframe") || "7d").toLowerCase();
    const filterUserId = searchParams.get("userId") || "";

    // Determine interval for timeframe
    let timeframeInterval = "7 days";
    let timeframeDays = 7;
    if (timeframe === "today") {
      timeframeInterval = "1 day";
      timeframeDays = 1;
    } else if (timeframe === "14d") {
      timeframeInterval = "14 days";
      timeframeDays = 14;
    } else if (timeframe === "30d") {
      timeframeInterval = "30 days";
      timeframeDays = 30;
    } else if (timeframe === "all") {
      timeframeInterval = "365 days";
      timeframeDays = 30; // for chart default
    }

    // 1. Unified CTE for activities
    const baseActivitiesCTE = `
      WITH unified_activities AS (
        -- Exam attempts (Paper 1, Paper 2, Generated, Challenge, Teacher Paper, Custom Quiz)
        SELECT 
          ea.id::text AS id,
          ea.user_id::text AS user_id,
          CASE 
            WHEN ea.teacher_paper_id IS NOT NULL THEN 'TEACHER_PAPER'
            WHEN ea.generated_paper_id IS NOT NULL OR ea.paper_type = 'generated' THEN 'GENERATED'
            WHEN ea.paper_type = 'challenge' THEN 'ARENA'
            WHEN ea.paper_type = 'paper2' THEN 'PAPER2'
            WHEN ea.paper_type = 'custom_quiz' THEN 'CUSTOM_QUIZ'
            ELSE 'PAPER1'
          END AS activity_type,
          COALESCE(
            NULLIF(TRIM(tp.title), ''),
            CASE 
              WHEN pp.id IS NOT NULL THEN CONCAT(pp.subject, ' Class ', pp.class, ' (', pp.year, CASE WHEN pp.paper_number IS NOT NULL THEN CONCAT(' P', pp.paper_number) ELSE '' END, ')')
              ELSE NULL
            END,
            CONCAT(ea.subject, ' ', CASE 
              WHEN ea.paper_type = 'paper2' THEN 'Paper 2 (CRQ/ERQ)'
              WHEN ea.paper_type = 'generated' OR ea.generated_paper_id IS NOT NULL THEN 'AI Mock Exam'
              WHEN ea.paper_type = 'challenge' THEN 'Live Arena Challenge'
              WHEN ea.paper_type = 'custom_quiz' THEN 'Custom Quiz'
              ELSE 'Paper 1 (MCQ)'
            END)
          ) AS title,
          COALESCE(ea.subject, tp.subject, pp.subject, 'General') AS subject,
          ea.score::numeric AS score,
          ea.total_marks::numeric AS total_marks,
          COALESCE(ea.time_taken, 60)::int AS time_taken_seconds,
          COALESCE(ea.grading_status, 'graded') AS grading_status,
          ea.created_at
        FROM exam_attempts ea
        LEFT JOIN teacher_papers tp ON tp.id = ea.teacher_paper_id
        LEFT JOIN past_papers pp ON pp.id = ea.paper_id

        UNION ALL

        -- Paper generations
        SELECT 
          gp.id::text AS id,
          gp.user_id::text AS user_id,
          'GENERATED_BUILD' AS activity_type,
          CONCAT('Generated Mock Paper (Class ', gp.class, ')') AS title,
          gp.subject AS subject,
          NULL::numeric AS score,
          NULL::numeric AS total_marks,
          120::int AS time_taken_seconds,
          NULL AS grading_status,
          gp.created_at
        FROM generated_papers gp

        UNION ALL

        -- Nova AI Tutor Sessions
        SELECT 
          cs.id::text AS id,
          cs.user_id::text AS user_id,
          'NOVA' AS activity_type,
          COALESCE(NULLIF(TRIM(cs.title), ''), 'Nova AI Tutor Session') AS title,
          COALESCE(NULLIF(TRIM(cs.subject), ''), 'Nova AI Tutor') AS subject,
          NULL::numeric AS score,
          NULL::numeric AS total_marks,
          GREATEST(60, LEAST(1800, EXTRACT(EPOCH FROM (COALESCE(cs.updated_at, cs.created_at) - cs.created_at))))::int AS time_taken_seconds,
          NULL AS grading_status,
          cs.created_at
        FROM chat_sessions cs
      )
    `;

    // 2. Fetch KPI summary stats
    const kpiQuery = `
      ${baseActivitiesCTE}
      SELECT
        COUNT(*)::int AS total_activities,
        COALESCE(SUM(time_taken_seconds), 0)::bigint AS total_active_seconds,
        COUNT(DISTINCT user_id)::int AS active_users_count,
        ROUND(COALESCE(AVG(time_taken_seconds), 0) / 60.0, 1)::float AS avg_session_minutes,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW()))::int AS today_activities_count,
        COALESCE(SUM(time_taken_seconds) FILTER (WHERE created_at >= date_trunc('day', NOW())), 0)::bigint AS today_active_seconds
      FROM unified_activities
      WHERE created_at >= NOW() - INTERVAL '${timeframeInterval}'
    `;

    // 3. Fetch daily timeline trend (for past N days)
    const timelineQuery = `
      ${baseActivitiesCTE},
      date_series AS (
        SELECT generate_series(
          date_trunc('day', NOW() - INTERVAL '${Math.max(1, timeframeDays - 1)} days'),
          date_trunc('day', NOW()),
          '1 day'::interval
        )::date AS day
      )
      SELECT 
        to_char(ds.day, 'YYYY-MM-DD') AS day,
        to_char(ds.day, 'Mon DD') AS label,
        COUNT(ua.id)::int AS activity_count,
        ROUND(COALESCE(SUM(ua.time_taken_seconds), 0) / 60.0, 1)::float AS active_minutes,
        ROUND(COALESCE(SUM(ua.time_taken_seconds), 0) / 3600.0, 2)::float AS active_hours,
        COUNT(DISTINCT ua.user_id)::int AS unique_users
      FROM date_series ds
      LEFT JOIN unified_activities ua ON date_trunc('day', ua.created_at) = ds.day
      GROUP BY ds.day
      ORDER BY ds.day ASC
    `;

    // 4. Activity category distribution
    const categoryDistributionQuery = `
      ${baseActivitiesCTE}
      SELECT 
        activity_type,
        COUNT(*)::int AS count,
        COALESCE(SUM(time_taken_seconds), 0)::bigint AS total_seconds,
        ROUND(COALESCE(SUM(time_taken_seconds), 0) / 60.0, 1)::float AS total_minutes
      FROM unified_activities
      WHERE created_at >= NOW() - INTERVAL '${timeframeInterval}'
      GROUP BY activity_type
      ORDER BY count DESC
    `;

    // 5. Active time & actions by user role
    const roleBreakdownQuery = `
      ${baseActivitiesCTE}
      SELECT 
        COALESCE(u.role, 'STUDENT') AS role,
        COUNT(*)::int AS activity_count,
        COUNT(DISTINCT ua.user_id)::int AS user_count,
        ROUND(COALESCE(SUM(ua.time_taken_seconds), 0) / 60.0, 1)::float AS total_minutes,
        ROUND(COALESCE(SUM(ua.time_taken_seconds), 0) / 3600.0, 2)::float AS total_hours
      FROM unified_activities ua
      LEFT JOIN users u ON u.id::text = ua.user_id
      WHERE ua.created_at >= NOW() - INTERVAL '${timeframeInterval}'
      GROUP BY COALESCE(u.role, 'STUDENT')
      ORDER BY activity_count DESC
    `;

    // 6. Top Engaged Users
    const topEngagedUsersQuery = `
      ${baseActivitiesCTE}
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.profile_image,
        COALESCE(u.school_name, '—') AS school_name,
        u.class,
        u.board,
        COALESCE(u.points, 0) AS points,
        COUNT(ua.id)::int AS total_activities,
        ROUND(COALESCE(SUM(ua.time_taken_seconds), 0) / 60.0, 1)::float AS total_active_minutes,
        ROUND(COALESCE(SUM(ua.time_taken_seconds), 0) / 3600.0, 2)::float AS total_active_hours,
        MAX(ua.created_at) AS last_active_at
      FROM unified_activities ua
      JOIN users u ON u.id::text = ua.user_id
      WHERE ua.created_at >= NOW() - INTERVAL '${timeframeInterval}'
      GROUP BY u.id, u.name, u.email, u.role, u.profile_image, u.school_name, u.class, u.board, u.points
      ORDER BY total_active_minutes DESC
      LIMIT 8
    `;

    // 7. Paginated filtered activity stream
    const filterConditions: string[] = [];
    const filterValues: unknown[] = [];

    if (timeframe !== "all") {
      filterValues.push(timeframeInterval);
      filterConditions.push(`ua.created_at >= NOW() - ($${filterValues.length}::interval)`);
    }

    if (role !== "ALL" && ["STUDENT", "TEACHER", "SCHOOL", "ADMIN"].includes(role)) {
      filterValues.push(role.toLowerCase());
      filterConditions.push(`LOWER(u.role) = $${filterValues.length}`);
    }

    if (activityType !== "ALL") {
      filterValues.push(activityType);
      filterConditions.push(`ua.activity_type = $${filterValues.length}`);
    }

    if (filterUserId) {
      filterValues.push(filterUserId);
      filterConditions.push(`ua.user_id = $${filterValues.length}`);
    }

    if (search) {
      filterValues.push(`%${search}%`);
      const sIdx = filterValues.length;
      filterConditions.push(
        `(u.name ILIKE $${sIdx} OR u.email ILIKE $${sIdx} OR COALESCE(u.school_name, '') ILIKE $${sIdx} OR ua.title ILIKE $${sIdx} OR ua.subject ILIKE $${sIdx})`
      );
    }

    const whereClause = filterConditions.length > 0 ? `WHERE ${filterConditions.join(" AND ")}` : "";

    // Activity Stream Query
    const activitiesStreamQuery = `
      ${baseActivitiesCTE}
      SELECT 
        ua.id,
        ua.activity_type,
        ua.title,
        ua.subject,
        ua.score,
        ua.total_marks,
        ua.time_taken_seconds,
        ua.grading_status,
        ua.created_at,
        ua.user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role,
        u.profile_image AS user_profile_image,
        u.school_name AS user_school_name,
        u.class AS user_class,
        u.board AS user_board
      FROM unified_activities ua
      LEFT JOIN users u ON u.id::text = ua.user_id
      ${whereClause}
      ORDER BY ua.created_at DESC
      LIMIT $${filterValues.length + 1} OFFSET $${filterValues.length + 2}
    `;

    const activitiesCountQuery = `
      ${baseActivitiesCTE}
      SELECT COUNT(*)::int AS total_count
      FROM unified_activities ua
      LEFT JOIN users u ON u.id::text = ua.user_id
      ${whereClause}
    `;

    // Execute queries in parallel
    const [
      kpiRes,
      timelineRes,
      categoryRes,
      roleRes,
      topUsersRes,
      streamRes,
      countRes,
    ] = await Promise.all([
      db.query(kpiQuery),
      db.query(timelineQuery),
      db.query(categoryDistributionQuery),
      db.query(roleBreakdownQuery),
      db.query(topEngagedUsersQuery),
      db.query(activitiesStreamQuery, [...filterValues, limit, offset]),
      db.query(activitiesCountQuery, filterValues),
    ]);

    const kpi = kpiRes.rows[0] || {
      total_activities: 0,
      total_active_seconds: 0,
      active_users_count: 0,
      avg_session_minutes: 0,
      today_activities_count: 0,
      today_active_seconds: 0,
    };

    const totalCount = countRes.rows[0]?.total_count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Format helper for seconds to readable string
    const formatDuration = (sec: number) => {
      if (!sec || sec <= 0) return "0s";
      const hours = Math.floor(sec / 3600);
      const minutes = Math.floor((sec % 3600) / 60);
      const seconds = sec % 60;
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      }
      return `${seconds}s`;
    };

    const formattedActivities = streamRes.rows.map((row: Record<string, unknown>) => {
      let percentage: number | null = null;
      if (row.score !== null && row.total_marks !== null && Number(row.total_marks) > 0) {
        percentage = Math.round((Number(row.score) / Number(row.total_marks)) * 100);
      }

      return {
        id: String(row.id || ""),
        activityType: String(row.activity_type || "PAPER1"),
        title: String(row.title || "Exam Activity"),
        subject: String(row.subject || "General"),
        score: row.score !== null ? Number(row.score) : null,
        totalMarks: row.total_marks !== null ? Number(row.total_marks) : null,
        percentage,
        timeTakenSeconds: Number(row.time_taken_seconds || 0),
        timeTakenFormatted: formatDuration(Number(row.time_taken_seconds || 0)),
        gradingStatus: row.grading_status ? String(row.grading_status) : null,
        createdAt: String(row.created_at || ""),
        user: {
          id: String(row.user_id || ""),
          name: (row.user_name as string) || "Unknown User",
          email: (row.user_email as string) || "—",
          role: (row.user_role as string) || "STUDENT",
          profileImage: (row.user_profile_image as string) || null,
          schoolName: (row.user_school_name as string) || "—",
          class: (row.user_class as string) || null,
          board: (row.user_board as string) || null,
        },
      };
    });

    const totalActiveSeconds = Number(kpi.total_active_seconds || 0);
    const todayActiveSeconds = Number(kpi.today_active_seconds || 0);

    return successResponse({
      overview: {
        totalActivities: Number(kpi.total_activities || 0),
        totalActiveSeconds,
        totalActiveHours: (totalActiveSeconds / 3600).toFixed(1),
        totalActiveTimeFormatted: formatDuration(totalActiveSeconds),
        activeUsersCount: Number(kpi.active_users_count || 0),
        avgSessionMinutes: Number(kpi.avg_session_minutes || 0),
        todayActivitiesCount: Number(kpi.today_activities_count || 0),
        todayActiveMinutes: Math.round(todayActiveSeconds / 60),
        todayActiveTimeFormatted: formatDuration(todayActiveSeconds),
      },
      timeline: timelineRes.rows.map((r: Record<string, unknown>) => ({
        day: String(r.day || ""),
        label: String(r.label || ""),
        activityCount: Number(r.activity_count || 0),
        activeMinutes: Number(r.active_minutes || 0),
        activeHours: Number(r.active_hours || 0),
        uniqueUsers: Number(r.unique_users || 0),
      })),
      categoryDistribution: categoryRes.rows.map((r: Record<string, unknown>) => ({
        activityType: String(r.activity_type || ""),
        count: Number(r.count || 0),
        totalSeconds: Number(r.total_seconds || 0),
        totalMinutes: Number(r.total_minutes || 0),
      })),
      roleBreakdown: roleRes.rows.map((r: Record<string, unknown>) => ({
        role: String(r.role || "STUDENT"),
        activityCount: Number(r.activity_count || 0),
        userCount: Number(r.user_count || 0),
        totalMinutes: Number(r.total_minutes || 0),
        totalHours: Number(r.total_hours || 0),
      })),
      topUsers: topUsersRes.rows.map((r: Record<string, unknown>) => ({
        id: String(r.id || ""),
        name: String(r.name || ""),
        email: String(r.email || ""),
        role: String(r.role || "STUDENT"),
        profileImage: (r.profile_image as string) || null,
        schoolName: (r.school_name as string) || "—",
        class: (r.class as string) || null,
        board: (r.board as string) || null,
        points: Number(r.points || 0),
        totalActivities: Number(r.total_activities || 0),
        totalActiveMinutes: Number(r.total_active_minutes || 0),
        totalActiveHours: Number(r.total_active_hours || 0),
        totalActiveFormatted: formatDuration(Math.round(Number(r.total_active_minutes || 0) * 60)),
        lastActiveAt: String(r.last_active_at || ""),
      })),
      activities: formattedActivities,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Fetch admin activities error:", error);
    return errorResponse("Failed to fetch user activities analytics", 500);
  }
}
