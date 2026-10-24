import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * @openapi
 * /api/admin/curriculum:
 *   get:
 *     summary: List all curriculums
 *     description: Retrieve a paginated list of curriculums with optional filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Curriculums retrieved successfully
 *       401:
 *         description: Unauthorized - Admin access required
 */
/**
 * GET /api/admin/curriculum
 * List curriculums with pagination and filters
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const classFilter = searchParams.get("class");
    const boardFilter = searchParams.get("board");
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const queryParams: (string | number)[] = [];
    let paramIndex = 1;

    if (classFilter && classFilter !== "all") {
      whereConditions.push(`c.class = $${paramIndex}`);
      queryParams.push(classFilter);
      paramIndex++;
    }

    if (boardFilter && boardFilter !== "all") {
      whereConditions.push(`c.board = $${paramIndex}`);
      queryParams.push(boardFilter);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(
        `(c.subject ILIKE $${paramIndex} OR c.class ILIKE $${paramIndex} OR c.board ILIKE $${paramIndex} OR c.file_name ILIKE $${paramIndex})`,
      );
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*) as total FROM curriculums c ${whereClause}`;
    const { rows: countRows } = await db.query<{ total: string }>(countQuery, queryParams);
    const total = parseInt(countRows[0]?.total || "0", 10);
    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

    const dataParams = [...queryParams, limit, offset];
    const { rows: curriculums } = await db.query<{
      id: string;
      class: string;
      board: string;
      subject: string;
      file_name: string | null;
      file_url: string | null;
      analyzed_content: string | null;
      created_at: Date;
      updated_at: Date;
      is_analyzed: boolean;
      chapters_count: string;
    }>(
      `SELECT 
        c.id,
        c.class,
        c.board,
        c.subject,
        c.file_name,
        c.file_url,
        c.analyzed_content,
        c.created_at,
        c.updated_at,
        CASE 
          WHEN c.analyzed_content IS NOT NULL THEN true 
          ELSE false 
        END as is_analyzed,
        COUNT(ch.id) as chapters_count
       FROM curriculums c
       LEFT JOIN chapters ch ON c.id = ch.curriculum_id
       ${whereClause}
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams,
    );

    const curriculumsWithDetails = curriculums.map((curriculum) => {
      let analyzedContent = null;
      if (curriculum.analyzed_content) {
        try {
          analyzedContent = JSON.parse(curriculum.analyzed_content as string);
        } catch (e) {
          console.error("Failed to parse analyzed_content:", e);
        }
      }

      return {
        id: curriculum.id,
        class: curriculum.class,
        board: curriculum.board,
        subject: curriculum.subject,
        fileName: curriculum.file_name,
        fileUrl: curriculum.file_url,
        isAnalyzed: curriculum.is_analyzed,
        chaptersCount: parseInt(curriculum.chapters_count || "0", 10),
        analyzedContent,
        createdAt: curriculum.created_at,
        updatedAt: curriculum.updated_at,
      };
    });

    return successResponse(
      {
        curriculums: curriculumsWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      "Curriculums retrieved successfully",
    );
  } catch (error) {
    console.error("List curriculums error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
