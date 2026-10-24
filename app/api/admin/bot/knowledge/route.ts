import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ensureBotSchema } from "@/lib/bot/schema";
import { getKnowledgeStats, syncBotKnowledge } from "@/lib/ai/bot-knowledge";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return errorResponse("Unauthorized. Admin access required.", 401);

  try {
    await ensureBotSchema();
    const stats = await getKnowledgeStats();
    return successResponse(stats, "Knowledge stats retrieved");
  } catch (error) {
    console.error("Knowledge stats error:", error);
    return errorResponse("Failed to load stats", 500);
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return errorResponse("Unauthorized. Admin access required.", 401);

  try {
    await ensureBotSchema();
    const result = await syncBotKnowledge();
    return successResponse(result, "Knowledge base synced successfully");
  } catch (error) {
    console.error("Knowledge sync error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Sync failed",
      500,
    );
  }
}
