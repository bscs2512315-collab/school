import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ChatImagesTooLargeError, ChatSessionNotFoundError, generateNovaReply, getChatSessions } from "@/lib/ai/bot-chat";
import { z } from "zod";

const chatAttachmentSchema = z.object({
  type: z.enum(["image", "file"]).default("file"),
  url: z.string().url(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().optional(),
});

const chatSchema = z.object({
  message: z.string().max(2000),
  sessionId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).max(4).optional(),
  imageMimeType: z.string().optional(),
  attachments: z.array(chatAttachmentSchema).max(4).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json();
    const data = chatSchema.parse(body);

    const hasAttachments = Boolean(data.attachments?.length);
    const hasImages = Boolean(data.imageUrl || data.imageUrls?.length);
    if (!data.message.trim() && !hasImages && !hasAttachments) {
      return errorResponse("Message or attachment is required", 400);
    }

    const result = await generateNovaReply({
      userId: user.userId,
      message: data.message,
      sessionId: data.sessionId,
      history: data.history,
      imageUrl: data.imageUrl,
      imageUrls: data.imageUrls,
      imageMimeType: data.imageMimeType?.startsWith("image/")
        ? data.imageMimeType
        : undefined,
      attachments: data.attachments,
      userRole: user.role,
    });

    return successResponse(result, "Reply generated");
  } catch (error) {
    if (error instanceof ChatSessionNotFoundError) {
      return errorResponse("Chat session not found", 404);
    }
    if (error instanceof ChatImagesTooLargeError) {
      return errorResponse(error.message, 400);
    }
    if (error instanceof z.ZodError) {
      return errorResponse("Invalid message", 400);
    }
    console.error("Chat error:", error);
    return errorResponse(
      "Sorry, Nova couldn't answer that right now. Please try again in a moment.",
      500,
    );
  }
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const sessions = await getChatSessions(user.userId);
    return successResponse(sessions, "Sessions retrieved");
  } catch (error) {
    console.error("Get sessions error:", error);
    return errorResponse("Failed to load sessions", 500);
  }
}
