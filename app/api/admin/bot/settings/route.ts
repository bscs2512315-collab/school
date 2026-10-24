import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ensureBotSchema, getBotSettings, updateBotSettings } from "@/lib/bot/schema";
import { z } from "zod";

const settingsSchema = z.object({
  systemPrompt: z.string().optional(),
  refusalMessage: z.string().optional(),
  maxTokens: z.number().int().min(256).max(4096).optional(),
  temperature: z.number().min(0).max(1).optional(),
  topKChunks: z.number().int().min(1).max(15).optional(),
  rateLimitPerHour: z.number().int().min(5).max(200).optional(),
});

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return errorResponse("Unauthorized. Admin access required.", 401);

  try {
    await ensureBotSchema();
    const settings = await getBotSettings();
    return successResponse(settings, "Settings retrieved");
  } catch (error) {
    console.error("Get bot settings error:", error);
    return errorResponse("Failed to load settings", 500);
  }
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return errorResponse("Unauthorized. Admin access required.", 401);

  try {
    await ensureBotSchema();
    const body = await request.json();
    const data = settingsSchema.parse(body);
    const settings = await updateBotSettings(data);
    return successResponse(settings, "Settings updated");
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse("Invalid settings", 400);
    console.error("Update bot settings error:", error);
    return errorResponse("Failed to update settings", 500);
  }
}
