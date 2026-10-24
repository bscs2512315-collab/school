import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/student/past-paper
 * List past papers for students (Read-only)
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized. Please login.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const classFilter = searchParams.get("class");
    const boardFilter = searchParams.get("board");
    const subjectFilter = searchParams.get("subject");
    const yearFilter = searchParams.get("year");
    const paperNumberFilter = searchParams.get("paperNumber");
    const search = searchParams.get("search")?.trim();
    const rawLimit = searchParams.get("limit");
    const rawPage = searchParams.get("page");

    const whereConditions: string[] = ["UPPER(status) = 'COMPLETED'"];
    const queryParams: unknown[] = [];

    if (classFilter && classFilter !== "all") {
      queryParams.push(classFilter);
      whereConditions.push(`class = $${queryParams.length}`);
    }

    if (boardFilter && boardFilter !== "all") {
      queryParams.push(boardFilter);
      whereConditions.push(`board = $${queryParams.length}`);
    }

    if (subjectFilter && subjectFilter !== "all") {
      queryParams.push(subjectFilter);
      whereConditions.push(`subject = $${queryParams.length}`);
    }

    if (yearFilter && yearFilter !== "all") {
      const y = parseInt(yearFilter, 10);
      if (!isNaN(y)) {
        queryParams.push(y);
        whereConditions.push(`year = $${queryParams.length}`);
      }
    }

    if (paperNumberFilter) {
      const pn = parseInt(paperNumberFilter, 10);
      if (!isNaN(pn)) {
        queryParams.push(pn);
        whereConditions.push(`COALESCE(paper_number, 1) = $${queryParams.length}`);
      }
    }

    if (search) {
      queryParams.push(`%${search}%`);
      whereConditions.push(`(subject ILIKE $${queryParams.length} OR board ILIKE $${queryParams.length} OR class ILIKE $${queryParams.length})`);
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    let queryText = `
      SELECT 
        id, class, board, subject, year, paper_number, status, total_questions
      FROM past_papers
      ${whereClause}
      ORDER BY year DESC, subject ASC
    `;

    if (rawLimit) {
      const limit = Math.max(1, parseInt(rawLimit, 10));
      const page = rawPage ? Math.max(1, parseInt(rawPage, 10)) : 1;
      const offset = (page - 1) * limit;
      queryParams.push(limit, offset);
      queryText += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;
    }

    const { rows: papers } = await db.query(queryText, queryParams);

    const formattedPapers = papers.map((p: any) => ({
      id: p.id,
      class: p.class,
      board: p.board,
      subject: p.subject,
      year: p.year,
      session: null,
      paperNumber: p.paper_number || 1,
      questionCount: p.total_questions,
    }));

    return successResponse(formattedPapers);
  } catch (error) {
    console.error("Student list past papers error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
