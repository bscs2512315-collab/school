import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/admin/questions/chapters
 * Distinct chapters with question counts for the current browse selection.
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const classFilter = searchParams.get("class");
    const subjectFilter = searchParams.get("subject");
    const paperNumberFilter = searchParams.get("paperNumber");

    if (!classFilter || !subjectFilter || !paperNumberFilter) {
      return errorResponse("class, subject, and paperNumber are required", 400);
    }

    const whereConditions = [
      "pp.class = $1",
      "pp.subject = $2",
      "COALESCE(pp.paper_number, 1) = $3",
      "q.chapter_name IS NOT NULL",
      "TRIM(q.chapter_name) <> ''",
    ];
    const queryParams: (string | number)[] = [
      classFilter,
      subjectFilter,
      parseInt(paperNumberFilter, 10),
    ];

    const { rows } = await db.query<{
      chapter_name: string;
      count: string;
    }>(
      `SELECT q.chapter_name, COUNT(q.id)::text as count
       FROM questions q
       INNER JOIN past_papers pp ON q.past_paper_id = pp.id
       WHERE ${whereConditions.join(" AND ")}
       GROUP BY q.chapter_name
       ORDER BY q.chapter_name`,
      queryParams,
    );

    const chapters = rows.map((row) => ({
      name: row.chapter_name,
      count: parseInt(row.count, 10),
    }));

    return successResponse({ chapters }, "Question chapters retrieved successfully");
  } catch (error) {
    console.error("Question chapters error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
