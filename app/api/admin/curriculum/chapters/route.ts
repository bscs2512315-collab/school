import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { Class, Board, Subject } from "@/types/enums";

/**
 * GET /api/admin/curriculum/chapters
 * Get chapters by class, board, and subject
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const classValue = searchParams.get("class");
    const board = searchParams.get("board");
    const subject = searchParams.get("subject");

    if (!classValue || !board || !subject) {
      return errorResponse("Class, board, and subject are required", 400);
    }

    // Find curriculum
    const { rows: curriculumRows } = await db.query(
      `SELECT id FROM curriculums 
       WHERE class = $1 AND board = $2 AND subject = $3
       LIMIT 1`,
      [classValue, board, subject],
    );

    if (curriculumRows.length === 0) {
      return successResponse(
        { chapters: [] },
        "No curriculum found for these criteria",
      );
    }

    // Get chapters
    const { rows: chapterRows } = await db.query(
      `SELECT id, chapter_number, chapter_name 
       FROM chapters 
       WHERE curriculum_id = $1 
       ORDER BY chapter_number ASC`,
      [(curriculumRows[0] as { id: string }).id],
    );

    const chapters = chapterRows.map((ch: any) => ({
      id: ch.id,
      chapterName: ch.chapter_name,
      chapterNumber: ch.chapter_number,
    }));

    return successResponse(
      { chapters },
      "Chapters retrieved successfully",
    );
  } catch (error) {
    console.error("Get chapters error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}

