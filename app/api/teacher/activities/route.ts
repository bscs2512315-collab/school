import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";
import { UserRole } from "@/types/enums";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ensureClassroomSchema } from "@/lib/teacher/classroom-schema";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user || user.role !== UserRole.TEACHER) {
    return errorResponse("Unauthorized. Teacher access required.", 401);
  }

  try {
    await ensureClassroomSchema();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;
    const search = (searchParams.get("search") || "").trim();
    const activityType = (searchParams.get("activityType") || "ALL").toUpperCase();
    const timeframe = (searchParams.get("timeframe") || "7d").toLowerCase();
    const classroomId = (searchParams.get("classroomId") || "").trim();
    const filterUserId = (searchParams.get("userId") || "").trim();

    // 1. Fetch teacher's active classrooms
    const { rows: classroomRows } = await db.query(
      `SELECT id, name, subject, class_level
       FROM teacher_classrooms
       WHERE teacher_id = $1 AND status = 'active'
       ORDER BY name ASC`,
      [user.userId]
    );

    // 2. Fetch all enrolled student IDs for this teacher (optionally filtered by classroom)
    const classroomFilterClause = classroomId ? `AND tc.id = $2` : "";
    const studentQueryParams = classroomId ? [user.userId, classroomId] : [user.userId];

    const { rows: enrolledStudentRows } = await db.query(
      `SELECT DISTINCT
         u.id::text AS id,
         u.name,
         u.email,
         u.role,
         u.profile_image,
         u.school_name,
         u.class,
         u.board,
         u.points
       FROM classroom_members cm
       JOIN teacher_classrooms tc 
         ON tc.id = cm.classroom_id 
        AND tc.teacher_id = $1 
        AND tc.status = 'active'
       JOIN users u ON u.id = cm.student_id
       WHERE cm.status = 'accepted'
       ${classroomFilterClause}`,
      studentQueryParams
    );

    const enrolledStudentsCount = enrolledStudentRows.length;
    const enrolledStudentIds = enrolledStudentRows.map((s) => s.id);

    // If teacher has no enrolled students yet, return clean empty structure
    if (enrolledStudentIds.length === 0) {
      return successResponse(
        {
          overview: {
            totalActivities: 0,
            totalActiveSeconds: 0,
            totalActiveHours: "0.0",
            totalActiveTimeFormatted: "0s",
            activeUsersCount: 0,
            enrolledStudentsCount: 0,
            avgSessionMinutes: 0,
            todayActivitiesCount: 0,
            todayActiveMinutes: 0,
            todayActiveTimeFormatted: "0s",
          },
          timeline: [],
          categoryDistribution: [],
          classroomDistribution: [],
          topUsers: [],
          activities: [],
          classrooms: classroomRows.map((c) => ({
            id: c.id,
            name: c.name,
            subject: c.subject,
            classLevel: c.class_level,
          })),
          pagination: {
            page: 1,
            limit,
            totalCount: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
        "No students currently enrolled in your classrooms."
      );
    }

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
      timeframeDays = 30;
    }

    // CTE for teacher's enrolled students' unified activities
    const baseActivitiesCTE = `
      WITH teacher_students AS (
        SELECT DISTINCT
          u.id::text AS id,
          u.name,
          u.email,
          COALESCE(u.role, 'student') AS role,
          u.profile_image,
          COALESCE(u.school_name, '—') AS school_name,
          u.class,
          u.board,
          COALESCE(u.points, 0) AS points
        FROM classroom_members cm
        JOIN teacher_classrooms tc 
          ON tc.id = cm.classroom_id 
         AND tc.teacher_id = '${user.userId.replace(/'/g, "''")}' 
         AND tc.status = 'active'
        JOIN users u ON u.id = cm.student_id
        WHERE cm.status = 'accepted'
        ${classroomId ? `AND tc.id = '${classroomId.replace(/'/g, "''")}'` : ""}
      ),
      unified_activities AS (
        -- Exam attempts
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
        JOIN teacher_students ts ON ts.id = ea.user_id::text
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
        JOIN teacher_students ts ON ts.id = gp.user_id::text

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
        JOIN teacher_students ts ON ts.id = cs.user_id::text
      )
    `;

    // 3. Fetch KPI summary stats
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

    // 4. Fetch daily timeline trend
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

    // 5. Activity category distribution
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

    // 6. Top 5 Most Active Students among this teacher's enrolled students
    const topUsersQuery = `
      ${baseActivitiesCTE}
      SELECT 
        ts.id,
        ts.name,
        ts.email,
        ts.role,
        ts.profile_image AS "profileImage",
        ts.school_name AS "schoolName",
        ts.class,
        ts.board,
        ts.points,
        COUNT(ua.id)::int AS "totalActivities",
        COALESCE(SUM(ua.time_taken_seconds), 0)::bigint AS "totalActiveSeconds",
        ROUND(COALESCE(SUM(ua.time_taken_seconds), 0) / 60.0, 1)::float AS "totalActiveMinutes",
        ROUND(COALESCE(SUM(ua.time_taken_seconds), 0) / 3600.0, 2)::float AS "totalActiveHours",
        MAX(ua.created_at) AS "lastActiveAt"
      FROM teacher_students ts
      LEFT JOIN unified_activities ua 
        ON ua.user_id = ts.id
       AND ua.created_at >= NOW() - INTERVAL '${timeframeInterval}'
      GROUP BY ts.id, ts.name, ts.email, ts.role, ts.profile_image, ts.school_name, ts.class, ts.board, ts.points
      HAVING COUNT(ua.id) > 0
      ORDER BY "totalActiveSeconds" DESC, "totalActivities" DESC
      LIMIT 5
    `;

    // 7. Paginated Activity Stream
    const whereConditions: string[] = [];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (activityType !== "ALL") {
      whereConditions.push(`ua.activity_type = $${paramIndex++}`);
      queryParams.push(activityType);
    }

    if (filterUserId) {
      whereConditions.push(`ua.user_id = $${paramIndex++}`);
      queryParams.push(filterUserId);
    }

    if (search) {
      whereConditions.push(
        `(ts.name ILIKE $${paramIndex} OR ts.email ILIKE $${paramIndex} OR ua.title ILIKE $${paramIndex} OR ua.subject ILIKE $${paramIndex})`
      );
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const countQuery = `
      ${baseActivitiesCTE}
      SELECT COUNT(*)::int AS total_count
      FROM unified_activities ua
      JOIN teacher_students ts ON ts.id = ua.user_id
      ${whereClause}
    `;

    const activitiesQuery = `
      ${baseActivitiesCTE}
      SELECT 
        ua.id,
        ua.user_id,
        ua.activity_type AS "activityType",
        ua.title,
        ua.subject,
        ua.score,
        ua.total_marks AS "totalMarks",
        CASE 
          WHEN ua.total_marks > 0 THEN ROUND((ua.score / ua.total_marks) * 100, 1)::float
          ELSE NULL
        END AS percentage,
        ua.time_taken_seconds AS "timeTakenSeconds",
        ua.grading_status AS "gradingStatus",
        ua.created_at AS "createdAt",
        ts.name AS user_name,
        ts.email AS user_email,
        ts.role AS user_role,
        ts.profile_image AS user_profile_image,
        ts.school_name AS user_school_name,
        ts.class AS user_class,
        ts.board AS user_board
      FROM unified_activities ua
      JOIN teacher_students ts ON ts.id = ua.user_id
      ${whereClause}
      ORDER BY ua.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(limit, offset);

    // Execute queries in parallel
    const [
      kpiRes,
      timelineRes,
      categoryRes,
      topUsersRes,
      countRes,
      activitiesRes,
    ] = await Promise.all([
      db.query(kpiQuery),
      db.query(timelineQuery),
      db.query(categoryDistributionQuery),
      db.query(topUsersQuery),
      db.query(countQuery, queryParams.slice(0, queryParams.length - 2)),
      db.query(activitiesQuery, queryParams),
    ]);

    const kpiRow = kpiRes.rows[0] || {};
    const totalCount = countRes.rows[0]?.total_count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    // Helper format seconds
    const formatDuration = (seconds: number) => {
      if (!seconds || seconds <= 0) return "0s";
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      if (hrs > 0) return `${hrs}h ${mins}m`;
      if (mins > 0) return `${mins}m ${secs}s`;
      return `${secs}s`;
    };

    const overview = {
      totalActivities: Number(kpiRow.total_activities || 0),
      totalActiveSeconds: Number(kpiRow.total_active_seconds || 0),
      totalActiveHours: (Number(kpiRow.total_active_seconds || 0) / 3600.0).toFixed(1),
      totalActiveTimeFormatted: formatDuration(Number(kpiRow.total_active_seconds || 0)),
      activeUsersCount: Number(kpiRow.active_users_count || 0),
      enrolledStudentsCount,
      avgSessionMinutes: Number(kpiRow.avg_session_minutes || 0),
      todayActivitiesCount: Number(kpiRow.today_activities_count || 0),
      todayActiveMinutes: Math.round(Number(kpiRow.today_active_seconds || 0) / 60),
      todayActiveTimeFormatted: formatDuration(Number(kpiRow.today_active_seconds || 0)),
    };

    const formattedActivities = activitiesRes.rows.map((row) => ({
      id: row.id,
      activityType: row.activityType,
      title: row.title,
      subject: row.subject,
      score: row.score !== null ? Number(row.score) : null,
      totalMarks: row.totalMarks !== null ? Number(row.totalMarks) : null,
      percentage: row.percentage !== null ? Number(row.percentage) : null,
      timeTakenSeconds: Number(row.timeTakenSeconds || 0),
      timeTakenFormatted: formatDuration(Number(row.timeTakenSeconds || 0)),
      gradingStatus: row.gradingStatus,
      createdAt: row.createdAt,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        role: row.user_role,
        profileImage: row.user_profile_image,
        schoolName: row.user_school_name,
        class: row.user_class,
        board: row.user_board,
      },
    }));

    const formattedTopUsers = topUsersRes.rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      profileImage: u.profileImage,
      schoolName: u.schoolName,
      class: u.class,
      board: u.board,
      points: Number(u.points || 0),
      totalActivities: Number(u.totalActivities || 0),
      totalActiveMinutes: Number(u.totalActiveMinutes || 0),
      totalActiveHours: Number(u.totalActiveHours || 0),
      totalActiveFormatted: formatDuration(Number(u.totalActiveSeconds || 0)),
      lastActiveAt: u.lastActiveAt,
    }));

    return successResponse({
      overview,
      timeline: timelineRes.rows.map((t) => ({
        day: t.day,
        label: t.label,
        activityCount: Number(t.activity_count || 0),
        activeMinutes: Number(t.active_minutes || 0),
        activeHours: Number(t.active_hours || 0),
        uniqueUsers: Number(t.unique_users || 0),
      })),
      categoryDistribution: categoryRes.rows.map((c) => ({
        activityType: c.activity_type,
        count: Number(c.count || 0),
        totalSeconds: Number(c.total_seconds || 0),
        totalMinutes: Number(c.total_minutes || 0),
      })),
      topUsers: formattedTopUsers,
      activities: formattedActivities,
      classrooms: classroomRows.map((c) => ({
        id: c.id,
        name: c.name,
        subject: c.subject,
        classLevel: c.class_level,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("Error fetching teacher student activities:", err);
    return errorResponse("Failed to fetch student activities.", 500);
  }
}
