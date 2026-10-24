import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { deleteNotification } from "@/lib/notifications";
import { successResponse, errorResponse } from "@/lib/response-handlers";

/**
 * DELETE /api/notifications/[id]
 * Delete a specific notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const { id } = await params;
    await deleteNotification(user.userId, id);
    return successResponse(null, "Notification deleted");
  } catch (error) {
    console.error("Delete notification error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
