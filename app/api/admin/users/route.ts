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
    const rawSortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = (searchParams.get("sortOrder") || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

    const allowedSortFields: Record<string, string> = {
      created_at: "created_at",
      name: "name",
      email: "email",
      points: "points",
      role: "role",
      school_name: "school_name",
    };
    const sortBy = allowedSortFields[rawSortBy] || "created_at";

    const whereClauses: string[] = [];
    const queryParams: unknown[] = [];

    if (role !== "ALL" && ["STUDENT", "TEACHER", "SCHOOL", "ADMIN"].includes(role)) {
      queryParams.push(role);
      whereClauses.push(`u.role = $${queryParams.length}`);
    }

    if (search) {
      queryParams.push(`%${search}%`);
      const searchIdx = queryParams.length;
      whereClauses.push(
        `(u.name ILIKE $${searchIdx} OR u.email ILIKE $${searchIdx} OR COALESCE(u.username, '') ILIKE $${searchIdx} OR COALESCE(u.school_name, '') ILIKE $${searchIdx})`,
      );
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // 1. Fetch paginated users with enriched activity stats
    const usersQuery = `
      SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.role, 
        u.class, 
        u.board, 
        u.school_name, 
        u.points, 
        u.rank, 
        u.profile_image, 
        u.username, 
        u.city, 
        u.phone,
        u.is_verified, 
        u.registered_by_school, 
        u.created_at, 
        u.updated_at,
        COALESCE(ea_stat.solved_papers_count, 0) AS solved_papers_count,
        COALESCE(gp_stat.generated_papers_count, 0) AS generated_papers_count,
        ea_stat.last_attempt_at,
        ea_stat.last_solved_paper,
        COALESCE(cp_stat.challenges_joined, 0) AS challenges_joined
      FROM users u
      LEFT JOIN LATERAL (
        SELECT 
          COUNT(*)::int AS solved_papers_count,
          MAX(created_at) AS last_attempt_at,
          (
            SELECT COALESCE(
              NULLIF(TRIM(CONCAT_WS(' ', subject, paper_type)), ''),
              'Past Paper'
            )
            FROM exam_attempts 
            WHERE user_id = u.id 
            ORDER BY created_at DESC 
            LIMIT 1
          ) AS last_solved_paper
        FROM exam_attempts 
        WHERE user_id = u.id
      ) ea_stat ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS generated_papers_count
        FROM generated_papers
        WHERE user_id = u.id
      ) gp_stat ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS challenges_joined
        FROM challenge_participants
        WHERE user_id = u.id
      ) cp_stat ON TRUE
      ${whereString}
      ORDER BY u.${sortBy} ${sortOrder}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS count
      FROM users u
      ${whereString}
    `;

    const statsQuery = `
      SELECT 
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE role = 'STUDENT')::int AS students,
        COUNT(*) FILTER (WHERE role = 'TEACHER')::int AS teachers,
        COUNT(*) FILTER (WHERE role = 'SCHOOL')::int AS schools,
        COUNT(*) FILTER (WHERE role = 'ADMIN')::int AS admins
      FROM users
    `;

    const [usersResult, countResult, statsResult] = await Promise.all([
      db.query(usersQuery, [...queryParams, limit, offset]),
      db.query<{ count: number }>(countQuery, queryParams),
      db.query<{
        total: number;
        students: number;
        teachers: number;
        schools: number;
        admins: number;
      }>(statsQuery),
    ]);

    const total = countResult.rows[0]?.count || 0;
    const totalPages = Math.ceil(total / limit) || 1;
    const stats = statsResult.rows[0] || {
      total: 0,
      students: 0,
      teachers: 0,
      schools: 0,
      admins: 0,
    };

    return successResponse(
      {
        users: usersResult.rows,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
        stats,
      },
      "Users retrieved successfully",
    );
  } catch (error) {
    console.error("Admin get users error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const body = await request.json();
    const rawIds: unknown = body.userIds ?? (body.userId ? [body.userId] : []);

    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      return errorResponse("Please provide an array of user IDs to delete.", 400);
    }

    const userIds = rawIds
      .map((id) => (typeof id === "string" ? id.trim() : ""))
      .filter((id): id is string => Boolean(id));

    if (userIds.length === 0) {
      return errorResponse("No valid user IDs provided.", 400);
    }

    // Protection 1: Admin cannot delete their own account
    if (userIds.includes(admin.userId)) {
      return errorResponse("You cannot delete your own administrative account.", 400);
    }

    // Protection 2: Check if any of the target accounts are ADMIN
    const { rows: adminAccounts } = await db.query<{ id: string; email: string; role: string }>(
      `SELECT id, email, role 
       FROM users 
       WHERE id = ANY($1) AND (role = 'ADMIN' OR email = 'admin@exboard.ai')`,
      [userIds],
    );

    if (adminAccounts.length > 0) {
      const adminNames = adminAccounts.map((a) => a.email).join(", ");
      return errorResponse(
        `Administrator account(s) cannot be deleted (${adminNames}). Please deselect admin accounts and try again.`,
        400,
      );
    }

    // Execute atomic deletion transaction
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Unlink public / shared entities (curriculums, past_papers, questions, grader notes)
      await client.query(
        "UPDATE curriculums SET uploaded_by = NULL WHERE uploaded_by = ANY($1)",
        [userIds],
      );
      await client.query(
        "UPDATE past_papers SET uploaded_by = NULL WHERE uploaded_by = ANY($1)",
        [userIds],
      );
      await client.query(
        "UPDATE questions SET verified_by = NULL WHERE verified_by = ANY($1)",
        [userIds],
      );
      await client.query(
        "UPDATE exam_attempts SET manual_grader_id = NULL WHERE manual_grader_id = ANY($1)",
        [userIds],
      );

      // 2. Teacher papers & classroom attempts unlinking
      await client.query(
        "UPDATE exam_attempts SET teacher_paper_id = NULL WHERE teacher_paper_id IN (SELECT id FROM teacher_papers WHERE teacher_id = ANY($1))",
        [userIds],
      );
      await client.query(
        "DELETE FROM teacher_paper_progress WHERE user_id = ANY($1)",
        [userIds],
      );
      await client.query(
        "DELETE FROM teacher_papers WHERE teacher_id = ANY($1)",
        [userIds],
      );
      await client.query(
        "DELETE FROM teacher_classrooms WHERE teacher_id = ANY($1)",
        [userIds],
      );

      // 3. Teacher content & assignments
      await client.query(
        "DELETE FROM content_assignments WHERE student_id = ANY($1)",
        [userIds],
      );
      await client.query(
        "DELETE FROM teacher_content WHERE teacher_id = ANY($1)",
        [userIds],
      );

      // 4. Election events created by teacher (candidates and votes cascade)
      await client.query(
        "DELETE FROM election_events WHERE teacher_id = ANY($1)",
        [userIds],
      );

      // 5. Challenges & challenge participants
      await client.query(
        "DELETE FROM challenge_participants WHERE user_id = ANY($1)",
        [userIds],
      );
      await client.query(
        "DELETE FROM challenge_participants WHERE challenge_id IN (SELECT id FROM challenges WHERE creator_id = ANY($1))",
        [userIds],
      );
      await client.query(
        "DELETE FROM challenges WHERE creator_id = ANY($1)",
        [userIds],
      );

      // 6. Chat sessions (chat_messages cascade)
      await client.query(
        "DELETE FROM chat_sessions WHERE user_id::text = ANY($1)",
        [userIds],
      );

      // 7. Classrooms (members and invitations cascade)
      await client.query(
        "DELETE FROM classroom_members WHERE student_id = ANY($1)",
        [userIds],
      );
      await client.query(
        "DELETE FROM classroom_invitations WHERE student_id = ANY($1)",
        [userIds],
      );
      await client.query(
        "DELETE FROM classrooms WHERE teacher_id = ANY($1)",
        [userIds],
      );

      // 8. Custom quizzes & shares
      await client.query(
        "DELETE FROM custom_quizzes WHERE student_id = ANY($1)",
        [userIds],
      );

      // 9. Student exam attempts & generated papers
      await client.query(
        "DELETE FROM exam_attempts WHERE user_id = ANY($1)",
        [userIds],
      );
      await client.query(
        "DELETE FROM generated_papers WHERE user_id = ANY($1)",
        [userIds],
      );

      // 10. Gamification & social records
      await client.query(
        "DELETE FROM school_points_snapshots WHERE student_id = ANY($1)",
        [userIds],
      );
      await client.query(
        "DELETE FROM user_boards WHERE user_id = ANY($1)",
        [userIds],
      );
      await client.query(
        "DELETE FROM user_badges WHERE user_id = ANY($1)",
        [userIds],
      );
      await client.query(
        "DELETE FROM user_metrics WHERE user_id = ANY($1)",
        [userIds],
      );
      await client.query(
        "DELETE FROM notifications WHERE user_id = ANY($1)",
        [userIds],
      );
      await client.query(
        "DELETE FROM follows WHERE follower_id = ANY($1) OR following_id = ANY($1)",
        [userIds],
      );

      // 11. Finally delete users
      const deleteResult = await client.query<{ id: string; name: string; email: string }>(
        "DELETE FROM users WHERE id = ANY($1) RETURNING id, name, email",
        [userIds],
      );

      await client.query("COMMIT");

      return successResponse(
        {
          deletedCount: deleteResult.rowCount || 0,
          deletedUsers: deleteResult.rows,
        },
        `Successfully and safely deleted ${deleteResult.rowCount || 0} user account(s).`,
      );
    } catch (transactionError) {
      await client.query("ROLLBACK");
      throw transactionError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Admin delete users error:", error);
    return errorResponse("Failed to delete user accounts. Transaction rolled back.", 500);
  }
}
