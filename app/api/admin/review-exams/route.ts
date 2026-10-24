import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(
      req as unknown as Parameters<typeof getAdminFromRequest>[0]
    );
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") === "graded" ? "graded" : "pending";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const filterCondition =
      status === "graded" ? "ea.grading_status = 'graded'" : "ea.grading_status <> 'graded'";

    const { rows: countRows } = await db.query<{ total: string }>(
      `SELECT COUNT(*)::text as total
       FROM exam_attempts ea
       WHERE ea.paper_type = 'paper2' AND ${filterCondition}`,
    );
    const total = parseInt(countRows[0]?.total || "0", 10);
    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

    const { rows: summaryRows } = await db.query<{
      pending_count: string;
      graded_count: string;
      total_count: string;
    }>(
      `SELECT
          COUNT(*) FILTER (WHERE ea.grading_status <> 'graded')::text AS pending_count,
          COUNT(*) FILTER (WHERE ea.grading_status = 'graded')::text AS graded_count,
          COUNT(*)::text AS total_count
       FROM exam_attempts ea
       WHERE ea.paper_type = 'paper2'`,
    );

    const { rows } = await db.query(
      `SELECT ea.id, ea.user_id, ea.paper_id, ea.subject, ea.score,
              COALESCE(
                NULLIF(ea.total_marks, 0),
                (
                  SELECT COALESCE(SUM(q.marks), 0)::int
                  FROM questions q
                  WHERE q.past_paper_id = ea.paper_id
                    AND q.question_type IN ('CRQ', 'ERQ')
                ),
                0
              ) AS total_marks,
              ea.grading_status, ea.created_at, u.name as student_name, u.email as student_email
       FROM exam_attempts ea
       JOIN users u ON ea.user_id = u.id
       WHERE ea.paper_type = 'paper2' AND ${filterCondition}
       ORDER BY
         CASE WHEN ea.grading_status = 'pending_manual' THEN 1 ELSE 2 END,
         ea.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const summary = summaryRows[0];

    return NextResponse.json({
      success: true,
      attempts: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      counts: {
        pending: parseInt(summary?.pending_count || "0", 10),
        graded: parseInt(summary?.graded_count || "0", 10),
        total: parseInt(summary?.total_count || "0", 10),
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/review-exams Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch exams" },
      { status: 500 },
    );
  }
}
