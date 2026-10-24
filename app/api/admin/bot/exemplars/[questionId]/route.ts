import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { ensureBotSchema } from "@/lib/bot/schema";
import { reindexQuestion } from "@/lib/ai/bot-knowledge";
import { db } from "@/lib/db";
import { paperIIDataSchema, serializePaperIIData } from "@/lib/bot/paper-ii-data";
import { z } from "zod";
import { randomUUID } from "crypto";

const updateSchema = z.object({
  paperIIData: paperIIDataSchema,
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return errorResponse("Unauthorized. Admin access required.", 401);

  try {
    await ensureBotSchema();
    const { questionId } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const { rows } = await db.query(`SELECT id FROM questions WHERE id = $1`, [questionId]);
    if (rows.length === 0) return errorResponse("Question not found", 404);

    await db.query(`UPDATE questions SET paper_ii_data = $1, updated_at = NOW() WHERE id = $2`, [
      serializePaperIIData(data.paperIIData),
      questionId,
    ]);

    await db.query(
      `INSERT INTO bot_training_logs (id, admin_id, action, entity_type, entity_id, payload)
       VALUES ($1, $2, 'update_exemplar', 'question', $3, $4)`,
      [randomUUID(), admin.userId, questionId, JSON.stringify(data.paperIIData)],
    );

    try {
      await reindexQuestion(questionId);
    } catch (reindexError) {
      console.warn("Reindex failed (knowledge will sync on next full sync):", reindexError);
    }

    return successResponse({ questionId }, "Exemplar updated");
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse("Invalid data", 400);
    console.error("Update exemplar error:", error);
    return errorResponse("Failed to update exemplar", 500);
  }
}
