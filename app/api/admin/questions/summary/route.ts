import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/admin/questions/summary
 * Aggregated question counts by class, subject, and paper number for browse navigation.
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const { rows } = await db.query<{
      class: string;
      subject: string;
      paper_number: number;
      count: string;
    }>(
      `SELECT pp.class, pp.subject, COALESCE(pp.paper_number, 1) as paper_number, COUNT(q.id)::text as count
       FROM questions q
       INNER JOIN past_papers pp ON q.past_paper_id = pp.id
       GROUP BY pp.class, pp.subject, pp.paper_number
       ORDER BY pp.class, pp.subject, pp.paper_number`,
    );

    const facets = rows.map((row) => ({
      class: row.class,
      subject: row.subject,
      paperNumber: row.paper_number || 1,
      count: parseInt(row.count, 10),
    }));

    return successResponse({ facets }, "Question bank summary retrieved successfully");
  } catch (error) {
    console.error("Question bank summary error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
