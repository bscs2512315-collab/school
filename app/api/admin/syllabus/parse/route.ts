import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { parseSyllabus } from "@/lib/utils/syllabus-parser";

/**
 * POST /api/admin/syllabus/parse
 * Parses raw syllabus text and returns structured JSON for preview
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return errorResponse("Syllabus text is required", 400);
    }

    const parsedData = parseSyllabus(text);

    return successResponse(parsedData, "Syllabus parsed successfully");
  } catch (error) {
    console.error("Syllabus parse error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      500,
    );
  }
}
