import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/middleware/admin-auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { extractTextFromPDF } from "@/lib/pdf/parser";
import { processPastPaperPdf } from "@/lib/ai/pdf-paper-processor";
import {
  extractQuestionsDetailed,
  type ExtractedWrittenQuestion,
  type RemovedQuestion,
} from "@/lib/ai/past-paper-extract";
import { normalizeScientificNotation } from "@/lib/scientific-notation/normalize";
import { z } from "zod";
import { Class, Board, Subject } from "@/types/enums";
import type { ChapterInfo } from "@/types/admin";

const autoExtractSchema = z.object({
  class: z.nativeEnum(Class),
  board: z.nativeEnum(Board),
  subject: z.nativeEnum(Subject),
  year: z.number().int().min(2010).max(new Date().getFullYear()),
  paperNumber: z.number().int().min(1).max(2),
});

export const maxDuration = 300; // Allow long-running AI extraction & image uploads

/**
 * POST /api/admin/past-paper/auto-extract
 *
 * Automated zero-cost past paper ingestion pipeline:
 * 1. Strips exam / AKUEB watermarks across all pages.
 * 2. Auto-crops all diagrams and illustrations at 200 DPI.
 * 3. Uploads diagrams directly to Cloudinary.
 * 4. Extracts all questions, options, reasoning & correct answers with Gemini.
 * 5. Matches questions to syllabus chapters and SLOs.
 * 6. Identifies and separates any out-of-syllabus questions.
 * 7. Automatically attaches diagram URLs to corresponding questions.
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return errorResponse("Unauthorized. Admin access required.", 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const syllabusFile = formData.get("syllabusFile") as File | null;
    const classValue = formData.get("class") as string;
    const board = formData.get("board") as string;
    const subject = formData.get("subject") as string;
    const year = parseInt(formData.get("year") as string);
    const paperNumber = parseInt(formData.get("paperNumber") as string) || 1;

    if (!file) {
      return errorResponse("Past paper PDF file is required", 400);
    }

    const validatedData = autoExtractSchema.parse({
      class: classValue,
      board,
      subject,
      year,
      paperNumber,
    });

    // 1. Fetch curriculum and syllabus chapters from database
    const { rows: curriculumRows } = await db.query(
      `SELECT c.id FROM curriculums c
       WHERE c.class = $1 AND c.board = $2 AND c.subject = $3
       LIMIT 1`,
      [validatedData.class, validatedData.board, validatedData.subject],
    );

    let chapterRows: Array<{ id: string; chapter_number: number; chapter_name: string; content: string | null }> = [];
    if (curriculumRows.length > 0) {
      const { rows } = await db.query(
        `SELECT id, chapter_number, chapter_name, content FROM chapters 
         WHERE curriculum_id = $1 
         ORDER BY chapter_number ASC`,
        [curriculumRows[0].id],
      );
      chapterRows = rows as any[];
    }

    // Optional: parse custom syllabus SLO file if uploaded by user
    let extraSloContext = "";
    if (syllabusFile) {
      try {
        extraSloContext = await extractTextFromPDF(syllabusFile);
      } catch (sloErr) {
        console.warn("Could not extract custom syllabus PDF:", sloErr);
      }
    }

    const curriculumChapters: ChapterInfo[] = chapterRows.map((ch) => ({
      chapterNumber: ch.chapter_number,
      chapterName: ch.chapter_name,
      description: ch.content ? ch.content.substring(0, 300) : undefined,
    }));

    // If extra syllabus text was provided, append as reference context
    if (extraSloContext.trim() && curriculumChapters.length > 0) {
      curriculumChapters[0].description = `${curriculumChapters[0].description || ""}\nAdditional SLO Context:\n${extraSloContext.substring(0, 2000)}`;
    }

    // 2. Read PDF buffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    console.log(`[Auto-Extract] Processing PDF: ${file.name} (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);

    // 3. Automated Watermark Stripping & Diagram Auto-Cropping & Cloudinary Upload
    const { cleanedPdfBuffer, diagrams, diagramMap } = await processPastPaperPdf(
      pdfBuffer,
      file.name,
    );

    console.log(
      `[Auto-Extract] Watermarks stripped. Found and cropped ${diagrams.length} diagrams. Uploaded to Cloudinary.`,
    );

    // 4. Extract text from cleaned PDF
    const cleanedFile = new File([new Uint8Array(cleanedPdfBuffer)], file.name, {
      type: "application/pdf",
    });
    const pdfText = await extractTextFromPDF(cleanedFile);
    const normalizedPdfText = normalizeScientificNotation(pdfText);

    // Multimodal payload with the cleaned watermark-free PDF
    const pdfInput = {
      data: cleanedPdfBuffer.toString("base64"),
      mimeType: "application/pdf",
    };

    // 5. Run AI Question Extraction with Syllabus SLO matching
    const extractionResult = await extractQuestionsDetailed(
      normalizedPdfText,
      curriculumChapters,
      validatedData.paperNumber,
      pdfInput,
    );

    const rawQuestions = extractionResult.questions;
    const removedQuestions = extractionResult.removedQuestions || [];

    // 6. Format questions, map chapters & attach diagrams
    let diagramsAttachedCount = 0;

    const formattedQuestions = rawQuestions.map((q: ExtractedWrittenQuestion, idx: number) => {
      // Find matching database chapter
      let matchedChapter = chapterRows.find(
        (ch) => ch.chapter_name.toLowerCase() === (q.suggestedChapter || "").toLowerCase(),
      );

      if (!matchedChapter && q.suggestedChapter) {
        matchedChapter = chapterRows.find(
          (ch) =>
            ch.chapter_name.toLowerCase().includes(q.suggestedChapter.toLowerCase()) ||
            q.suggestedChapter.toLowerCase().includes(ch.chapter_name.toLowerCase()),
        );
      }

      // Check for attached diagram
      let imageUrl: string | null = null;
      if (diagramMap.has(q.questionNumber)) {
        imageUrl = diagramMap.get(q.questionNumber)!;
        diagramsAttachedCount++;
      } else if (q.hasImage) {
        // Fallback: check if diagram exists on same page
        const pageDiagram = diagrams.find(
          (d) => d.pageNumber === q.pageNumber && d.imageUrl,
        );
        if (pageDiagram && pageDiagram.imageUrl) {
          imageUrl = pageDiagram.imageUrl;
          diagramsAttachedCount++;
        }
      }

      const defaultMarks = validatedData.paperNumber === 1 ? 1 : q.questionType === "ERQ" ? 5 : 3;

      return {
        questionNumber: q.questionNumber || idx + 1,
        questionPart: q.questionPart || null,
        questionText: normalizeScientificNotation(q.questionText),
        questionType: q.questionType,
        suggestedChapter: q.suggestedChapter,
        confidence: q.confidence,
        chapterId: matchedChapter?.id || null,
        chapterName: matchedChapter?.chapter_name || q.suggestedChapter || null,
        marks: defaultMarks,
        mcqOptions: q.mcqOptions?.map((opt) => ({
          id: opt.id,
          text: normalizeScientificNotation(opt.text),
        })),
        correctAnswer: q.correctAnswer || null,
        imageUrl,
      };
    });

    console.log(
      `[Auto-Extract] Done! ${formattedQuestions.length} active questions, ${diagramsAttachedCount} diagrams attached, ${removedQuestions.length} removed questions.`,
    );

    return successResponse(
      {
        extractedQuestions: formattedQuestions,
        removedQuestions,
        totalQuestions: formattedQuestions.length,
        diagramsAttached: diagramsAttachedCount,
        chapters: chapterRows.map((ch) => ({
          id: ch.id,
          chapterName: ch.chapter_name,
        })),
      },
      `Extracted ${formattedQuestions.length} questions and attached ${diagramsAttachedCount} diagrams.`,
      200,
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
    console.error("[Auto-Extract] Error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      500,
    );
  }
}
