import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

function buildPastPaperFilters(params: {
  paperNumber: number;
  classFilter: string | null;
  boardFilter: string | null;
  subjectFilter: string | null;
  yearFilter: string | null;
  search: string;
  includeYearFilter: boolean;
}) {
  const whereConditions: string[] = [`paper_number = $1`];
  const queryParams: (string | number)[] = [params.paperNumber];
  let paramIndex = 2;

  if (params.classFilter && params.classFilter !== "all") {
    whereConditions.push(`class = $${paramIndex}`);
    queryParams.push(params.classFilter);
    paramIndex++;
  }

  if (params.boardFilter && params.boardFilter !== "all") {
    whereConditions.push(`board = $${paramIndex}`);
    queryParams.push(params.boardFilter);
    paramIndex++;
  }

  if (params.subjectFilter && params.subjectFilter !== "all") {
    whereConditions.push(`subject = $${paramIndex}`);
    queryParams.push(params.subjectFilter);
    paramIndex++;
  }

  if (params.includeYearFilter && params.yearFilter && params.yearFilter !== "all") {
    whereConditions.push(`year = $${paramIndex}`);
    queryParams.push(parseInt(params.yearFilter, 10));
    paramIndex++;
  }

  if (params.search) {
    whereConditions.push(
      `(subject ILIKE $${paramIndex} OR class ILIKE $${paramIndex} OR board ILIKE $${paramIndex} OR CAST(year AS TEXT) ILIKE $${paramIndex} OR file_name ILIKE $${paramIndex})`,
    );
    queryParams.push(`%${params.search}%`);
    paramIndex++;
  }

  return {
    whereClause: `WHERE ${whereConditions.join(" AND ")}`,
    queryParams,
    nextParamIndex: paramIndex,
  };
}

/**
 * GET /api/admin/past-paper
 * List past papers with pagination and filters
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const paperNumber = Math.max(1, parseInt(searchParams.get("paperNumber") || "1", 10));
    const classFilter = searchParams.get("class");
    const boardFilter = searchParams.get("board");
    const subjectFilter = searchParams.get("subject");
    const yearFilter = searchParams.get("year");
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const offset = (page - 1) * limit;

    const filterInput = {
      paperNumber,
      classFilter,
      boardFilter,
      subjectFilter,
      yearFilter,
      search,
    };

    const { whereClause, queryParams, nextParamIndex } = buildPastPaperFilters({
      ...filterInput,
      includeYearFilter: true,
    });

    const { rows: countRows } = await db.query<{ total: string }>(
      `SELECT COUNT(*) as total FROM past_papers ${whereClause}`,
      queryParams,
    );
    const total = parseInt(countRows[0]?.total || "0", 10);
    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

    const yearsFilter = buildPastPaperFilters({
      ...filterInput,
      includeYearFilter: false,
    });
    const { rows: yearRows } = await db.query<{ year: number }>(
      `SELECT DISTINCT year FROM past_papers ${yearsFilter.whereClause} ORDER BY year DESC`,
      yearsFilter.queryParams,
    );
    const availableYears = yearRows.map((row) => row.year);

    const dataParams = [...queryParams, limit, offset];
    const { rows: pastPapers } = await db.query<{
      id: string;
      class: string;
      board: string;
      subject: string;
      year: number;
      paper_number: number | null;
      file_name: string | null;
      file_url: string | null;
      total_questions: number | null;
      status: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT 
        id,
        class,
        board,
        subject,
        year,
        paper_number,
        file_name,
        file_url,
        total_questions,
        status,
        created_at,
        updated_at
       FROM past_papers
       ${whereClause}
       ORDER BY year DESC, created_at DESC
       LIMIT $${nextParamIndex} OFFSET $${nextParamIndex + 1}`,
      dataParams,
    );

    const transformedPapers = pastPapers.map((paper) => ({
      id: paper.id,
      class: paper.class,
      board: paper.board,
      subject: paper.subject,
      year: paper.year,
      paperNumber: paper.paper_number || 1,
      session: null,
      questionCount: paper.total_questions || 0,
      fileName: paper.file_name,
      fileUrl: paper.file_url,
      totalQuestions: paper.total_questions,
      status: paper.status,
      createdAt: paper.created_at,
      updatedAt: paper.updated_at,
    }));

    return successResponse(
      {
        pastPapers: transformedPapers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        availableYears,
      },
      "Past papers retrieved successfully",
    );
  } catch (error) {
    console.error("List past papers error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
