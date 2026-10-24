import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ensureBotSchema } from "@/lib/bot/schema";
import { classifyQuery, shouldBlockIntent } from "@/lib/ai/bot-guardrails";
import { retrieveKnowledge } from "@/lib/ai/bot-knowledge";
import { getGeminiModel } from "@/lib/ai/gemini";
import { getBotSettings } from "@/lib/bot/schema";
import { z } from "zod";

const testSchema = z.object({
  message: z.string().min(1),
  board: z.string().optional(),
  class: z.string().optional(),
  subject: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return errorResponse("Unauthorized. Admin access required.", 401);

  try {
    await ensureBotSchema();
    const body = await request.json();
    const data = testSchema.parse(body);
    const settings = await getBotSettings();

    const classification = await classifyQuery(data.message, {
      board: data.board,
      class: data.class,
      subject: data.subject,
    });

    if (shouldBlockIntent(classification.intent, classification.confidence)) {
      return successResponse(
        {
          blocked: true,
          classification,
          reply: settings.refusalMessage,
          sources: [],
        },
        "Query blocked by guardrails",
      );
    }

    const { chunks, sources } = await retrieveKnowledge({
      query: data.message,
      board: data.board ?? null,
      classLevel: data.class ?? null,
      subject: data.subject ?? null,
      topK: settings.topKChunks,
    });

    const contextBlock = chunks
      .map((c, i) => `[CONTEXT ${i + 1}: ${c.title}]\n${c.content}`)
      .join("\n\n---\n\n");

    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${settings.systemPrompt}\n\nCONTEXT:\n${contextBlock || "No context"}\n\nQUESTION:\n${data.message}`,
            },
          ],
        },
      ],
      generationConfig: { temperature: settings.temperature, maxOutputTokens: settings.maxTokens },
    });

    return successResponse(
      {
        blocked: false,
        classification,
        reply: result.response.text(),
        sources,
        chunksUsed: chunks.length,
      },
      "Test reply generated",
    );
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse("Invalid test query", 400);
    console.error("Bot test error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Test failed",
      500,
    );
  }
}
