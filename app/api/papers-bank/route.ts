import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { errorResponse, successResponse } from "@/lib/response-handlers";
import { getPapersBankList } from "@/lib/papers-bank";

/**
 * GET /api/papers-bank
 * Query parameters:
 *  - board: 'AKUEB' | 'Sindh Board' | 'all'
 *  - class: 'IX' | 'X' | 'XI' | 'XII' | 'all'
 *  - subject: 'Physics' | 'Chemistry' | 'all'
 *  - paperType: '1' | '2' | 'all'
 *  - search: string
 *  - page: number
 *  - limit: number
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const { searchParams } = new URL(request.url);

    const board = searchParams.get("board") || "all";
    const classLevel = searchParams.get("class") || "all";
    const subject = searchParams.get("subject") || "all";
    const paperTypeParam = searchParams.get("paperType");
    const paperType =
      paperTypeParam === "1" ? 1 : paperTypeParam === "2" ? 2 : undefined;
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "12", 10))
    );
    const offset = (page - 1) * limit;

    const result = await getPapersBankList({
      board: board !== "all" ? board : undefined,
      classLevel: classLevel !== "all" ? classLevel : undefined,
      subject: subject !== "all" ? subject : undefined,
      paperType,
      search,
      userId: user?.userId,
      limit,
      offset,
    });

    return successResponse({
      papers: result.papers,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    console.error("GET /api/papers-bank error:", error);
    return errorResponse("Failed to fetch papers bank list", 500);
  }
}
