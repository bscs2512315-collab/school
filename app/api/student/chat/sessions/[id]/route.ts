import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ensureBotSchema } from "@/lib/bot/schema";
import { getChatMessages } from "@/lib/ai/bot-chat";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    await ensureBotSchema();
    const { id } = await params;
    const messages = await getChatMessages(id, user.userId);
    if (!messages) return errorResponse("Session not found", 404);
    return successResponse(messages, "Messages retrieved");
  } catch (error) {
    console.error("Get chat messages error:", error);
    return errorResponse("Failed to load messages", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    await ensureBotSchema();
    const { id } = await params;
    await db.query(`DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2`, [
      id,
      user.userId,
    ]);
    return successResponse(null, "Session deleted");
  } catch (error) {
    console.error("Delete session error:", error);
    return errorResponse("Failed to delete session", 500);
  }
}
