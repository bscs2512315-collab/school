import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { z } from "zod";
import { Class, Board, Subject } from "@/types/enums";
import { PastPaperStatus } from "@/types/admin";
import { randomUUID } from "crypto";
import { paperIIDataSchema, serializePaperIIData } from "@/lib/bot/paper-ii-data";

const questionSchema = z.object({
  questionNumber: z.number().int().positive(),
  questionPart: z.string().nullable().optional(),
  questionText: z.string().min(1),
  questionType: z.enum(["MCQ", "CRQ", "ERQ"]),
  chapterId: z.string().uuid().nullable().optional(),
  chapterName: z.string().nullable().optional(),
  marks: z.number().int().positive().optional(),
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

const createSchema = z.object({
  class: z.nativeEnum(Class),
  board: z.nativeEnum(Board),
  subject: z.nativeEnum(Subject),
  year: z.number().int().min(2015).max(new Date().getFullYear()),
  paperNumber: z.number().int().min(1).max(2).optional().default(1),
  strictMode: z.boolean().optional().default(true),
  allowResume: z.boolean().optional().default(false),
  questions: z.array(questionSchema).min(1),
});

/**
 * POST /api/admin/past-paper/create
 * Create a past paper with manually added questions
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const body = await request.json();
    const validatedData = createSchema.parse(body);

    // Ensure columns exist
    await db.query(`ALTER TABLE past_papers ADD COLUMN IF NOT EXISTS strict_mode BOOLEAN DEFAULT true`).catch(() => {});
    await db.query(`ALTER TABLE past_papers ADD COLUMN IF NOT EXISTS allow_resume BOOLEAN DEFAULT false`).catch(() => {});

    // Check if past paper already exists
    const { rows: existing } = await db.query(
      `SELECT id FROM past_papers WHERE class = $1 AND board = $2 AND subject = $3 AND year = $4 AND paper_number = $5`,
      [
        validatedData.class,
        validatedData.board,
        validatedData.subject,
        validatedData.year,
        validatedData.paperNumber,
      ],
    );

    if (existing.length > 0) {
      return errorResponse(
        `Past paper (Paper ${validatedData.paperNumber}) already exists for this class/board/subject/year.`,
        409,
      );
    }

    // Create past paper record
    const pastPaperId = randomUUID();
    await db.query(
      `INSERT INTO past_papers (id, class, board, subject, year, paper_number, file_url, file_name, total_questions, status, uploaded_by, strict_mode, allow_resume)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        pastPaperId,
        validatedData.class,
        validatedData.board,
        validatedData.subject,
        validatedData.year,
        validatedData.paperNumber,
        "", // No file for manual creation
        `Manual-${validatedData.class}-${validatedData.board}-${validatedData.subject}-${validatedData.year}-P${validatedData.paperNumber}`,
        validatedData.questions.length,
        PastPaperStatus.COMPLETED,
        admin.userId,
        validatedData.strictMode,
        validatedData.allowResume,
      ],
    );

    // Insert questions
    for (const question of validatedData.questions) {
      const questionId = randomUUID();

      // Store MCQ options and correct answer as JSON if MCQ
      let mcqData = null;
      if (question.questionType === "MCQ" && question.mcqOptions) {
        mcqData = JSON.stringify({
          options: question.mcqOptions,
          correctAnswer: question.correctAnswer,
        });
      }

      console.log(
        `[DEBUG] Inserting Q${question.questionNumber}: Marks value = ${question.marks}, type = ${typeof question.marks}`,
      );

      await db.query(
        `INSERT INTO questions (
          id, past_paper_id, question_number, question_part, question_text, 
          question_type, chapter_id, chapter_name, is_verified, verified_by, mcq_data, image_url, marks, paper_ii_data
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          questionId,
          pastPaperId,
          question.questionNumber,
          question.questionPart || null,
          question.questionText,
          question.questionType,
          question.chapterId || null,
          question.chapterName || null,
          true,
          admin.userId,
          mcqData,
          question.imageUrl || null,
          question.marks || 1,
          serializePaperIIData(question.paperIIData),
        ],
      );

      // Update chapter_name if chapterId is provided
      if (question.chapterId) {
        const { rows: chapterRows } = await db.query(
          `SELECT chapter_name FROM chapters WHERE id = $1`,
          [question.chapterId],
        );
        if (chapterRows.length > 0) {
          await db.query(
            `UPDATE questions SET chapter_name = $1 WHERE id = $2`,
            [chapterRows[0].chapter_name, questionId],
          );
        }
      }
    }

    return successResponse(
      {
        id: pastPaperId,
        totalQuestions: validatedData.questions.length,
        status: PastPaperStatus.COMPLETED,
      },
      "Past paper created successfully",
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Convert ZodError issues to ApiErrorDetail format
      const errorDetails = error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.map((p) => String(p)),
        code: issue.code,
      }));
      return errorResponse(errorDetails, 400);
    }
    console.error("Create past paper error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      500,
    );
  }
}
