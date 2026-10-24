import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    const { rows: attempts } = await db.query(
      `
            SELECT ea.*, u.name as student_name, u.email as student_email
            FROM exam_attempts ea
            JOIN users u ON ea.user_id = u.id
            WHERE ea.id = $1
        `,
      [id],
    );

    if (attempts.length === 0) {
      return NextResponse.json(
        { success: false, message: "Attempt not found" },
        { status: 404 },
      );
    }

    const attempt = attempts[0];

    // Fetch the questions for this paper
    const { rows: questions } = await db.query(
      `
            SELECT id, question_number, question_part, question_text, question_type, marks
            FROM questions
            WHERE past_paper_id = $1 AND question_type IN ('CRQ', 'ERQ')
            ORDER BY question_number ASC, question_part ASC NULLS FIRST
        `,
      [attempt.paper_id],
    );

    return NextResponse.json({ success: true, attempt, questions });
  } catch (error: any) {
    console.error("GET /api/admin/review-exams/[id] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch exam details" },
      { status: 500 },
    );
  }
}
