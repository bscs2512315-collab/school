import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { errorResponse, successResponse } from "@/lib/response-handlers";
import { getPaperBankDetail } from "@/lib/papers-bank";

/**
 * GET /api/papers-bank/[id]
 * Fetch detailed paper data and questions.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    const { id } = await params;

    if (!id) {
      return errorResponse("Paper ID is required", 400);
    }

    const paper = await getPaperBankDetail(id, user?.userId);
    if (!paper) {
      return errorResponse("Paper not found in Papers Bank", 404);
    }

    return successResponse(paper);
  } catch (error) {
    console.error("GET /api/papers-bank/[id] error:", error);
    return errorResponse("Failed to fetch paper details", 500);
  }
}
