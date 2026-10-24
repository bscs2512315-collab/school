import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { errorResponse, successResponse } from "@/lib/response-handlers";
import { sharePaperBankItem } from "@/lib/papers-bank";

/**
 * POST /api/papers-bank/[id]/share
 * Body: { userIds: string[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return errorResponse("Unauthorized. Please log in.", 401);
    }

    const { id } = await params;
    if (!id) {
      return errorResponse("Paper ID is required", 400);
    }

    const body = await request.json();
    const userIds = Array.isArray(body?.userIds)
      ? body.userIds.map(String).filter(Boolean)
      : [];

    if (userIds.length === 0) {
      return errorResponse("Please select at least one user to share with", 400);
    }

    const result = await sharePaperBankItem(id, user.userId, userIds);

    return successResponse(
      result,
      `Paper successfully shared with ${result.sharedCount} recipient(s)`
    );
  } catch (error: any) {
    console.error("POST /api/papers-bank/[id]/share error:", error);
    const message = error instanceof Error ? error.message : "Failed to share paper";
    return errorResponse(message, 500);
  }
}
