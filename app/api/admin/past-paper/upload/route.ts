import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { saveUploadedFile } from "@/lib/storage/file-upload";
import { extractTextFromPDF } from "@/lib/pdf/parser";
import { extractQuestions } from "@/lib/ai/past-paper-extract";
import { normalizeScientificNotation } from "@/lib/scientific-notation/normalize";
import { z } from "zod";
import { Class, Board, Subject } from "@/types/enums";
import { PastPaperStatus } from "@/types/admin";
import { randomUUID } from "crypto";

const uploadSchema = z.object({
  class: z.nativeEnum(Class),
  board: z.nativeEnum(Board),
  subject: z.nativeEnum(Subject),
  year: z.number().int().min(2015).max(new Date().getFullYear()),
  paperNumber: z.number().int().min(1).max(2),
});

/**
 * POST /api/admin/past-paper/upload
 * Upload past paper PDF and extract questions with AI
 * Returns extracted questions for admin review (does NOT auto-save questions)
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  const userId = admin.userId;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const classValue = formData.get("class") as string;
    const board = formData.get("board") as string;
    const subject = formData.get("subject") as string;
    const year = parseInt(formData.get("year") as string);
    const paperNumber = parseInt(formData.get("paperNumber") as string) || 1;

    if (!file) {
      return errorResponse("File is required", 400);
    }

    // Validate form data
    const validatedData = uploadSchema.parse({
      class: classValue,
      board,
      subject,
      year,
      paperNumber,
    });

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

    // Save file
    const { fileUrl, fileName } = await saveUploadedFile(file, "past-papers");

    // Create past paper record with analyzing status
    const pastPaperId = randomUUID();
    await db.query(
      `INSERT INTO past_papers (id, class, board, subject, year, paper_number, file_url, file_name, status, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        pastPaperId,
        validatedData.class,
        validatedData.board,
        validatedData.subject,
        validatedData.year,
        validatedData.paperNumber,
        fileUrl,
        fileName,
        PastPaperStatus.ANALYZING,
        userId,
      ],
    );

    const pdfText = await extractTextFromPDF(file);
    const normalizedPdfText = normalizeScientificNotation(pdfText);

    // Base64 of the source PDF so extraction can send the real page layout
    // (tables/diagrams/notation) to Gemini, not just the flattened text.
    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const pdfInput = { data: pdfBuffer.toString("base64"), mimeType: "application/pdf" };

    console.log(`[Upload] PDF text length: ${normalizedPdfText.length} chars`);

    // Get curriculum and chapters for AI extraction
    const { rows: curriculumRows } = await db.query(
      `SELECT c.id FROM curriculums c
       WHERE c.class = $1 AND c.board = $2 AND c.subject = $3
       LIMIT 1`,
      [validatedData.class, validatedData.board, validatedData.subject],
    );

    let extractedQuestions: Array<{
      questionNumber: number;
      questionPart: string | null;
      questionText: string;
      questionType: string;
      suggestedChapter: string;
      confidence: number;
      mcqOptions?: Array<{ id: string; text: string }>;
      correctAnswer?: string;
      chapterId?: string | null;
      chapterName?: string | null;
    }> = [];

    let chapters: Array<{ id: string; chapter_name: string }> = [];

    if (curriculumRows.length > 0) {
      const curriculum = curriculumRows[0] as { id: string };

      // Get chapters from database
      const { rows: chapterRows } = await db.query(
        `SELECT id, chapter_number, chapter_name, content FROM chapters 
         WHERE curriculum_id = $1 
         ORDER BY chapter_number ASC`,
        [curriculum.id],
      );

      chapters = chapterRows as any;

      if (chapterRows.length > 0) {
        const curriculumChapters = chapterRows.map((ch: any) => ({
          chapterNumber: ch.chapter_number,
          chapterName: ch.chapter_name,
          description: ch.content ? ch.content.substring(0, 200) : undefined,
        }));

        // Extract questions with AI
        if (process.env.GEMINI_API_KEY) {
          try {
            const aiQuestions = await extractQuestions(
              normalizedPdfText,
              curriculumChapters,
              validatedData.paperNumber,
              pdfInput,
            );

            // Map suggested chapters to actual chapter IDs
            extractedQuestions = aiQuestions.map((q) => {
              let matchedChapter = chapterRows.find(
                (ch: any) =>
                  ch.chapter_name.toLowerCase() ===
                  q.suggestedChapter.toLowerCase(),
              );

              if (!matchedChapter) {
                matchedChapter = chapterRows.find(
                  (ch: any) =>
                    ch.chapter_name
                      .toLowerCase()
                      .includes(q.suggestedChapter.toLowerCase()) ||
                    q.suggestedChapter
                      .toLowerCase()
                      .includes(ch.chapter_name.toLowerCase()),
                );
              }

              return {
                ...q,
                questionText: normalizeScientificNotation(q.questionText),
                mcqOptions: q.mcqOptions?.map((opt) => ({
                  ...opt,
                  text: normalizeScientificNotation(opt.text),
                })),
                chapterId: (matchedChapter as any)?.id || null,
                chapterName:
                  (matchedChapter as any)?.chapter_name || q.suggestedChapter,
              };
            });

            console.log(
              `[Upload] AI extracted ${extractedQuestions.length} questions`,
            );
          } catch (aiError) {
            console.error("AI extraction failed:", aiError);
            // Continue without questions
          }
        }
      }
    }

    // Update past paper status to pending (waiting for admin verification)
    await db.query(`UPDATE past_papers SET status = $1 WHERE id = $2`, [
      PastPaperStatus.PENDING,
      pastPaperId,
    ]);

    // Return extracted questions for admin review (NOT saved to DB yet)
    return successResponse(
      {
        pastPaperId,
        paperNumber: validatedData.paperNumber,
        extractedQuestions,
        chapters: (chapters as any[]).map((ch: any) => ({
          id: ch.id,
          chapterName: ch.chapter_name,
        })),
      },
      extractedQuestions.length > 0
        ? `PDF uploaded. ${extractedQuestions.length} question(s) extracted. Please review and confirm.`
        : "PDF uploaded. No questions extracted automatically. You can add them manually.",
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
    console.error("Past paper upload error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      500,
    );
  }
}
