import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * GET /api/student/curriculum
 * List curriculums for students (Read-only)
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
    const search = searchParams.get("search")?.trim();

    const whereConditions: string[] = [];
    const queryParams: unknown[] = [];

    if (classFilter && classFilter !== "all") {
      queryParams.push(classFilter);
      whereConditions.push(`c.class = $${queryParams.length}`);
    }

    if (boardFilter && boardFilter !== "all") {
      queryParams.push(boardFilter);
      whereConditions.push(`c.board = $${queryParams.length}`);
    }

    if (subjectFilter && subjectFilter !== "all") {
      queryParams.push(subjectFilter);
      whereConditions.push(`c.subject = $${queryParams.length}`);
    }

    if (search) {
      queryParams.push(`%${search}%`);
      whereConditions.push(`(c.subject ILIKE $${queryParams.length} OR c.class ILIKE $${queryParams.length} OR c.board ILIKE $${queryParams.length})`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const { rows: curriculums } = await db.query(
      `SELECT 
        c.id,
        c.class,
        c.board,
        c.subject,
        COUNT(ch.id) as chapters_count
       FROM curriculums c
       LEFT JOIN chapters ch ON c.id = ch.curriculum_id
       ${whereClause}
       GROUP BY c.id, c.class, c.board, c.subject
       ORDER BY c.subject ASC`,
      queryParams,
    );

    const formattedCurriculums = curriculums.map((c: any) => ({
      id: c.id,
      class: c.class,
      board: c.board,
      subject: c.subject,
      chaptersCount: parseInt(c.chapters_count || "0", 10),
    }));

    const response = successResponse(formattedCurriculums);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400",
    );
    return response;
  } catch (error) {
    console.error("Student list curriculums error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
