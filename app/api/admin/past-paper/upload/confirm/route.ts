import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { z } from "zod";
import { PastPaperStatus } from "@/types/admin";
import { paperIIDataSchema } from "@/lib/bot/paper-ii-data";
import { insertExtractedQuestions } from "@/lib/past-paper/insert-extracted";

const questionSchema = z.object({
  questionNumber: z.number().int().positive(),
  questionPart: z.string().nullable().optional(),
  questionText: z.string().min(1),
  questionType: z.enum(["MCQ", "CRQ", "ERQ"]),
  chapterId: z.string().nullable().optional(),
  chapterName: z.string().nullable().optional(),
  marks: z.number().int().positive().nullable().optional(),
  mcqOptions: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
      }),
    )
    .nullable()
    .optional(),
  correctAnswer: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  paperIIData: paperIIDataSchema,
});

const confirmSchema = z.object({
  pastPaperId: z.string().uuid(),
  questions: z.array(questionSchema).min(1),
});

/**
 * POST /api/admin/past-paper/upload/confirm
 * Save admin-verified questions to database after review
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const body = await request.json();
    const validatedData = confirmSchema.parse(body);

    // Verify past paper exists
    const { rows: paperRows } = await db.query(
      `SELECT id, paper_number FROM past_papers WHERE id = $1`,
      [validatedData.pastPaperId],
    );

    if (paperRows.length === 0) {
      return errorResponse("Past paper not found", 404);
    }

    // Admin has reviewed these — insert as verified and publish the paper.
    // Shared with the batch extraction script (which inserts unverified).
    await insertExtractedQuestions(
      validatedData.pastPaperId,
      validatedData.questions,
      {
        verified: true,
        verifiedBy: admin.userId,
        replaceExisting: true,
        updatePaperStatus: PastPaperStatus.COMPLETED,
      },
    );

    return successResponse(
      {
        pastPaperId: validatedData.pastPaperId,
        totalQuestions: validatedData.questions.length,
        status: PastPaperStatus.COMPLETED,
      },
      "Past paper published successfully with verified questions.",
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.map((p) => String(p)),
        code: issue.code,
      }));
      return errorResponse(errorDetails, 400);
    }
    console.error("Confirm past paper error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      500,
    );
  }
}
