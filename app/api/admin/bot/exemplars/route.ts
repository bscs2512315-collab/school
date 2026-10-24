import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ensureBotSchema } from "@/lib/bot/schema";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return errorResponse("Unauthorized. Admin access required.", 401);

  try {
    await ensureBotSchema();

    const { searchParams } = new URL(request.url);
    const board = searchParams.get("board");
    const classLevel = searchParams.get("class");
    const subject = searchParams.get("subject");
    const hasExemplars = searchParams.get("hasExemplars");

    const filters: string[] = ["pp.paper_number = 2"];
    const values: unknown[] = [];
    let idx = 1;

    if (board) {
      filters.push(`pp.board = $${idx++}`);
      values.push(board);
    }
    if (classLevel) {
      filters.push(`pp.class = $${idx++}`);
      values.push(classLevel);
    }
    if (subject) {
      filters.push(`pp.subject = $${idx++}`);
      values.push(subject);
    }
    if (hasExemplars === "true") {
      filters.push(`(q.paper_ii_data->>'betterResponse' IS NOT NULL OR q.paper_ii_data->>'weakerResponse' IS NOT NULL)`);
    }

    const { rows } = await db.query(
      `SELECT q.id, q.question_number, q.question_part, q.question_text, q.question_type,
              q.chapter_name, q.marks, q.paper_ii_data,
              pp.board, pp.class, pp.subject, pp.year
       FROM questions q
       JOIN past_papers pp ON pp.id = q.past_paper_id
       WHERE ${filters.join(" AND ")}
       ORDER BY pp.year DESC, q.question_number ASC
       LIMIT 100`,
      values,
    );

    const exemplars = rows.map((row) => ({
      id: row.id,
      questionNumber: row.question_number,
      questionPart: row.question_part,
      questionText: row.question_text,
      questionType: row.question_type,
      chapterName: row.chapter_name,
      marks: row.marks,
      board: row.board,
      class: row.class,
      subject: row.subject,
      year: row.year,
      paperIIData: row.paper_ii_data,
    }));

    return successResponse(exemplars, "Exemplars retrieved");
  } catch (error) {
    console.error("Get exemplars error:", error);
    return errorResponse("Failed to load exemplars", 500);
  }
}
