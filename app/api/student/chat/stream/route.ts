import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { ChatImagesTooLargeError, ChatSessionNotFoundError, generateNovaReplyStream } from "@/lib/ai/bot-chat";
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
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let data: z.infer<typeof chatSchema>;
  try {
    const body = await request.json();
    data = chatSchema.parse(body);
  } catch {
    return new Response("Invalid message", { status: 400 });
  }

  const hasAttachments = Boolean(data.attachments?.length);
  const hasImages = Boolean(data.imageUrl || data.imageUrls?.length);
  if (!data.message.trim() && !hasImages && !hasAttachments) {
    return new Response("Message or attachment is required", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Flush the SSE response before knowledge retrieval and provider startup.
      // Keep intermediaries from treating a slow first token as an idle stream.
      controller.enqueue(encoder.encode(": connected\n\n"));
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 10000);
      try {
        const generator = generateNovaReplyStream({
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

        for await (const event of generator) {
          controller.enqueue(encoder.encode(`data: ${event}\n\n`));
        }
      } catch (error) {
        let errorMessage =
          "Sorry, Nova couldn't answer that right now. Please try again in a moment.";
        if (error instanceof ChatSessionNotFoundError) {
          errorMessage = "Chat session not found";
        } else if (error instanceof ChatImagesTooLargeError) {
          errorMessage = (error as Error).message;
        }
        console.error("Stream chat error:", error instanceof Error ? error.stack : error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: errorMessage })}\n\n`,
          ),
        );
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
