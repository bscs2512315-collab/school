import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authUser = await verifyAuth(req);
    const body = await req.json();
    const {
      bugType = "QUESTION", // 'QUESTION' | 'NOVA_CHAT' | 'TEACHER_PAPER'
      questionId,
      pastPaperId,
      sessionId,
      paperId,
      title,
      category,
      description,
      metadata,
    } = body;

    if (!category) {
      return NextResponse.json(
        { error: "category is required." },
        { status: 400 }
      );
    }

    let resolvedPaperId = pastPaperId || null;
    let mergedMetadata = { ...(metadata || {}), reported_at: new Date().toISOString() };

    // If it's a question bug, fetch extra question context if available
    if (bugType === "QUESTION" && questionId) {
      const qCheck = await db.query(
        `SELECT q.id, q.past_paper_id, q.question_number, q.question_text, q.image_url,
                p.subject, p.class, p.year, p.paper_number, p.board
         FROM questions q
         LEFT JOIN past_papers p ON q.past_paper_id = p.id
         WHERE q.id = $1`,
        [questionId]
      );

      if (qCheck.rows.length > 0) {
        const qRow = qCheck.rows[0];
        resolvedPaperId = resolvedPaperId || qRow.past_paper_id || null;
        mergedMetadata = {
          ...mergedMetadata,
          question_number: qRow.question_number,
          subject: qRow.subject || metadata?.subject,
          class: qRow.class || metadata?.class,
          year: qRow.year || metadata?.year,
          paper_number: qRow.paper_number || metadata?.paper_number,
          board: qRow.board || metadata?.board || "AKUEB",
          question_text: qRow.question_text,
          image_url: qRow.image_url,
        };
      }
    }

    const insertRes = await db.query(
      `INSERT INTO question_bugs (
        bug_type, question_id, past_paper_id, session_id, paper_id, title,
        reporter_user_id, reporter_email, category, description, status, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'IN_PROGRESS', $11)
      RETURNING id, bug_type, question_id, session_id, paper_id, title, category, status, created_at`,
      [
        bugType,
        questionId || null,
        resolvedPaperId,
        sessionId || null,
        paperId || null,
        title || null,
        authUser?.userId || null,
        authUser?.email || "anonymous-qa",
        category,
        description || null,
        JSON.stringify(mergedMetadata),
      ]
    );

    const insertedBug = insertRes.rows[0];

    return NextResponse.json({
      success: true,
      message: "Bug reported successfully to QA Tracker.",
      bug: insertedBug,
    });
  } catch (error: any) {
    console.error("Error reporting QA bug:", error);
    return NextResponse.json(
      { error: "Failed to report bug", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bugType = searchParams.get("bug_type") || searchParams.get("type");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const subject = searchParams.get("subject");
    const cls = searchParams.get("class");
    const year = searchParams.get("year");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const offset = (page - 1) * limit;

    const conditions: string[] = ["1=1"];
    const values: any[] = [];
    let paramIndex = 1;

    if (bugType && bugType !== "ALL") {
      conditions.push(`COALESCE(b.bug_type, 'QUESTION') = $${paramIndex++}`);
      values.push(bugType);
    }
    if (status && status !== "ALL") {
      conditions.push(`b.status = $${paramIndex++}`);
      values.push(status);
    }
    if (category && category !== "ALL") {
      conditions.push(`b.category = $${paramIndex++}`);
      values.push(category);
    }
    if (subject && subject !== "ALL") {
      conditions.push(`(p.subject ILIKE $${paramIndex} OR b.metadata->>'subject' ILIKE $${paramIndex})`);
      values.push(`%${subject}%`);
      paramIndex++;
    }
    if (cls && cls !== "ALL") {
      conditions.push(`(p.class = $${paramIndex} OR b.metadata->>'class' = $${paramIndex} OR b.metadata->>'classLevel' = $${paramIndex})`);
      values.push(cls);
      paramIndex++;
    }
    if (year && year !== "ALL") {
      conditions.push(`(p.year = $${paramIndex} OR (b.metadata->>'year')::int = $${paramIndex})`);
      values.push(parseInt(year, 10));
      paramIndex++;
    }
    if (search) {
      conditions.push(`(
        q.question_text ILIKE $${paramIndex} OR
        b.title ILIKE $${paramIndex} OR
        b.description ILIKE $${paramIndex} OR
        b.reporter_email ILIKE $${paramIndex} OR
        b.metadata->>'prompt' ILIKE $${paramIndex} OR
        b.metadata->>'response_preview' ILIKE $${paramIndex} OR
        b.metadata->>'paper_title' ILIKE $${paramIndex}
      )`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    // Fetch bugs with left joins so non-question bugs (Nova, Teacher Paper) also resolve cleanly
    const bugsQuery = `
      SELECT b.id, COALESCE(b.bug_type, 'QUESTION') as bug_type,
             b.question_id, b.past_paper_id, b.session_id, b.paper_id, b.title,
             b.reporter_user_id, b.reporter_email, b.category, b.description, b.status,
             b.verified_by_user_id, b.verified_at, b.fixed_at, b.metadata, b.created_at, b.updated_at,
             q.question_number, q.question_text, q.image_url, q.mcq_data,
             p.subject, p.class, p.year, p.paper_number, p.board
      FROM question_bugs b
      LEFT JOIN questions q ON b.question_id = q.id
      LEFT JOIN past_papers p ON COALESCE(b.past_paper_id, q.past_paper_id) = p.id
      WHERE ${whereClause}
      ORDER BY 
        CASE b.status
          WHEN 'REJECTED' THEN 1
          WHEN 'IN_PROGRESS' THEN 2
          WHEN 'FIXED' THEN 3
          WHEN 'VERIFIED' THEN 4
          ELSE 5
        END,
        b.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const totalCountQuery = `
      SELECT COUNT(*) as count
      FROM question_bugs b
      LEFT JOIN questions q ON b.question_id = q.id
      LEFT JOIN past_papers p ON COALESCE(b.past_paper_id, q.past_paper_id) = p.id
      WHERE ${whereClause}
    `;

    // Counts summary
    const summaryQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress,
        COUNT(*) FILTER (WHERE status = 'FIXED') as fixed,
        COUNT(*) FILTER (WHERE status = 'VERIFIED') as verified,
        COUNT(*) FILTER (WHERE COALESCE(bug_type, 'QUESTION') = 'QUESTION') as questions_count,
        COUNT(*) FILTER (WHERE bug_type = 'NOVA_CHAT') as nova_count,
        COUNT(*) FILTER (WHERE bug_type = 'TEACHER_PAPER') as teacher_paper_count
      FROM question_bugs
    `;

    const [bugsRes, totalRes, summaryRes] = await Promise.all([
      db.query(bugsQuery, [...values, limit, offset]),
      db.query(totalCountQuery, values),
      db.query(summaryQuery),
    ]);

    const total = parseInt(totalRes.rows[0]?.count || "0", 10);
    const summary = summaryRes.rows[0] || {
      total: 0,
      in_progress: 0,
      fixed: 0,
      verified: 0,
      questions_count: 0,
      nova_count: 0,
      teacher_paper_count: 0,
    };

    return NextResponse.json({
      bugs: bugsRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        total: parseInt(summary.total || "0", 10),
        in_progress: parseInt(summary.in_progress || "0", 10),
        fixed: parseInt(summary.fixed || "0", 10),
        verified: parseInt(summary.verified || "0", 10),
        questions_count: parseInt(summary.questions_count || "0", 10),
        nova_count: parseInt(summary.nova_count || "0", 10),
        teacher_paper_count: parseInt(summary.teacher_paper_count || "0", 10),
      },
    });
  } catch (error: any) {
    console.error("Error fetching QA bugs:", error);
    return NextResponse.json(
      { error: "Failed to fetch bugs", details: error.message },
      { status: 500 }
    );
  }
}
