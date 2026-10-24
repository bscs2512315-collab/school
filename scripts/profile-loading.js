/* eslint-disable @typescript-eslint/no-require-imports */
/* Read-only, time-limited production query diagnostics. Never prints user data. */
require("dotenv").config({ quiet: true });
const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000,
  ssl: { rejectUnauthorized: false },
});

const timeoutMs = 3000;

async function profile(label, sql, params = []) {
  await client.query("SAVEPOINT profile_query");
  try {
    const { rows } = await client.query(
      `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`,
      params,
    );
    const report = rows[0]["QUERY PLAN"][0];
    const plan = report.Plan;
    console.log(JSON.stringify({
      query: label,
      planningMs: report["Planning Time"],
      executionMs: report["Execution Time"],
      resultRows: plan["Actual Rows"],
      sharedHits: plan["Shared Hit Blocks"] ?? 0,
      sharedReads: plan["Shared Read Blocks"] ?? 0,
      plan: plan["Node Type"],
    }));
    await client.query("RELEASE SAVEPOINT profile_query");
  } catch (error) {
    await client.query("ROLLBACK TO SAVEPOINT profile_query");
    await client.query("RELEASE SAVEPOINT profile_query");
    console.log(JSON.stringify({
      query: label,
      status: error.code === "57014" ? "timed out" : "failed",
      code: error.code ?? "unknown",
    }));
  }
}

async function main() {
  const connectionStartedAt = performance.now();
  await client.connect();
  console.log(JSON.stringify({ connectionMs: Number((performance.now() - connectionStartedAt).toFixed(1)) }));
  try {
    await client.query("BEGIN READ ONLY");
    await client.query(`SET LOCAL statement_timeout = ${timeoutMs}`);
    await client.query("SET LOCAL lock_timeout = 1000");

    const { rows: tableStats } = await client.query(`
      SELECT relname AS table_name, n_live_tup AS estimated_rows,
             seq_scan, idx_scan
      FROM pg_stat_user_tables
      WHERE relname IN ('exam_attempts', 'teacher_classrooms',
                        'classroom_members', 'teacher_papers', 'users',
                        'questions', 'past_papers', 'notifications')
      ORDER BY relname
    `);
    console.log(JSON.stringify({ tableStats }));

    const { rows: indexes } = await client.query(`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('exam_attempts', 'teacher_classrooms',
                          'classroom_members', 'teacher_papers')
      ORDER BY tablename, indexname
    `);
    console.log(JSON.stringify({ indexes }));

    const { rows: schemaReadiness } = await client.query(`
      SELECT
        to_regclass('public.teacher_classrooms') IS NOT NULL
        AND to_regclass('public.classroom_members') IS NOT NULL
        AND to_regclass('public.teacher_papers') IS NOT NULL
        AND to_regclass('public.teacher_paper_progress') IS NOT NULL
        AND to_regclass('public.idx_teacher_classrooms_teacher') IS NOT NULL
        AND to_regclass('public.idx_teacher_classrooms_pin') IS NOT NULL
        AND to_regclass('public.idx_classroom_members_classroom') IS NOT NULL
        AND to_regclass('public.idx_classroom_members_student') IS NOT NULL
        AND to_regclass('public.idx_teacher_papers_classroom') IS NOT NULL
        AND to_regclass('public.idx_teacher_papers_remedial') IS NOT NULL
        AND to_regclass('public.idx_teacher_paper_progress_user_paper') IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM (VALUES
            ('teacher_classrooms', 'settings'),
            ('teacher_classrooms', 'board'),
            ('teacher_classrooms', 'pin_code'),
            ('teacher_papers', 'strict_mode'),
            ('teacher_papers', 'allow_resume'),
            ('teacher_papers', 'is_remedial'),
            ('teacher_papers', 'remedial_student_id'),
            ('generated_papers', 'questions_snapshot'),
            ('generated_papers', 'question_count')
          ) AS required(table_name, column_name)
          WHERE NOT EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_schema = 'public'
              AND c.table_name = required.table_name
              AND c.column_name = required.column_name
          )
        ) AS ready
    `);
    console.log(JSON.stringify({ classroomSchemaReady: schemaReadiness[0]?.ready }));
    const { rows: notificationReadiness } = await client.query(`
      SELECT to_regclass('public.notifications') IS NOT NULL
         AND to_regclass('public.idx_notifications_user') IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM (VALUES ('user_id'), ('is_read'), ('created_at'),
                               ('metadata')) AS required(column_name)
           WHERE NOT EXISTS (
             SELECT 1 FROM information_schema.columns c
             WHERE c.table_schema = 'public' AND c.table_name = 'notifications'
               AND c.column_name = required.column_name
           )
         ) AS ready
    `);
    console.log(JSON.stringify({ notificationsSchemaReady: notificationReadiness[0]?.ready }));

    let sampleStudent;
    let sampleTeacher;
    await client.query("SAVEPOINT sample_student");
    try {
      const { rows } = await client.query(`
        SELECT user_id FROM exam_attempts
        GROUP BY user_id ORDER BY COUNT(*) DESC LIMIT 1
      `);
      sampleStudent = rows[0]?.user_id;
    } catch (error) {
      if (error.code !== "57014") throw error;
      await client.query("ROLLBACK TO SAVEPOINT sample_student");
    }
    await client.query("RELEASE SAVEPOINT sample_student");
    await client.query("SAVEPOINT sample_teacher");
    try {
      const { rows } = await client.query(`
        SELECT teacher_id FROM teacher_classrooms
        GROUP BY teacher_id ORDER BY COUNT(*) DESC LIMIT 1
      `);
      sampleTeacher = rows[0]?.teacher_id;
    } catch (error) {
      if (error.code !== "57014") throw error;
      await client.query("ROLLBACK TO SAVEPOINT sample_teacher");
    }
    await client.query("RELEASE SAVEPOINT sample_teacher");

    if (sampleStudent) {
      await profile("student-history-preview", `
        WITH recent_attempts AS (
          SELECT id, paper_id, teacher_paper_id, created_at
          FROM exam_attempts WHERE user_id = $1
          ORDER BY created_at DESC, id DESC LIMIT 8
        )
        SELECT ra.id,
          (SELECT COUNT(*) FROM exam_attempts previous
           WHERE previous.user_id = $1
             AND COALESCE(previous.teacher_paper_id::text, previous.paper_id::text)
                 IS NOT DISTINCT FROM
                 COALESCE(ra.teacher_paper_id::text, ra.paper_id::text)
             AND (previous.created_at, previous.id) <= (ra.created_at, ra.id)
          ) AS attempt_number
        FROM recent_attempts ra
      `, [sampleStudent]);
      await profile("notification-list-and-counts", `
        SELECT
          COALESCE((
            SELECT jsonb_agg(page) FROM (
              SELECT * FROM notifications WHERE user_id = $1
              ORDER BY created_at DESC LIMIT $2 OFFSET $3
            ) page
          ), '[]'::jsonb),
          (SELECT COUNT(*)::int FROM notifications WHERE user_id = $1),
          (SELECT COUNT(*)::int FROM notifications WHERE user_id = $1 AND is_read = false)
      `, [sampleStudent, 1, 0]);
    }

    if (sampleTeacher) {
      await profile("teacher-dashboard-enrollment", `
        SELECT COUNT(DISTINCT cm.student_id)
        FROM classroom_members cm
        JOIN teacher_classrooms tc ON tc.id = cm.classroom_id
        WHERE tc.teacher_id = $1 AND tc.status = 'active'
          AND cm.status = 'accepted'
      `, [sampleTeacher]);
      await profile("teacher-dashboard-attempts", `
        SELECT COUNT(*)
        FROM exam_attempts ea
        JOIN teacher_papers tp ON tp.id = ea.teacher_paper_id
        WHERE tp.teacher_id = $1 AND ea.grading_status = 'graded'
      `, [sampleTeacher]);
    }

    await profile("admin-paper2-queue", `
      SELECT COUNT(*) FILTER (WHERE grading_status = 'pending_manual'),
             COUNT(*) FILTER (WHERE grading_status = 'pending'),
             COUNT(*) FILTER (WHERE grading_status = 'graded')
      FROM exam_attempts WHERE paper_type = 'paper2'
    `);
    await profile("admin-student-distribution", `
      SELECT class, COUNT(*) FROM users
      WHERE LOWER(role) = 'student' GROUP BY class
    `);
    await client.query("ROLLBACK");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Profiling failed: ${error.code || error.message}`);
  process.exitCode = 1;
});
