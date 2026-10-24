import { NextRequest } from "next/server";
import { generatePaperLogic } from "@/lib/paper-utils";
import { generateSloAlignedPaper } from "@/lib/paper/slo-paper-generator";
import { generateCustomPaperQuestions } from "@/lib/ai/generate-paper-custom";
import { errorResponse, successResponse } from "@/lib/response-handlers";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

/**
 * POST /api/student/generate-paper
 * Generate a paper in one of three modes:
 *  1. "past_papers" (default): Pulls from past paper question bank
 *  2. "slos": 25 questions generated according to chapter SLOs
 *  3. "custom": 25 questions generated from reference images or custom prompt
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      subject,
      classLevel,
      board,
      paperType,
      chapterIds,
      mode = "past_papers",
      prompt,
      imageUrls,
      questionCount,
      difficulty,
    } = body;

    const effectiveSubject =
      (subject || body.title || body.customTitle || (mode === "custom" ? "Custom Exam" : "")).trim();

    if (!userId || !effectiveSubject || !classLevel || !board || !paperType) {
      return errorResponse("User, subject/title, class, board, and paper type are required", 400);
    }

    const normalizedType =
      String(paperType) === "2" || paperType === "paper2" ? "2" : "1";

    if (mode === "custom") {
      const hasManual = Array.isArray(body.manualQuestions) && body.manualQuestions.length > 0;
      const hasImages = Array.isArray(imageUrls) && imageUrls.length > 0;
      const hasPrompt = Boolean(prompt && prompt.trim());

      if (!hasManual && !hasImages && !hasPrompt) {
        return errorResponse("Provide at least one reference image, custom prompt, or manual questions", 400);
      }

      let generatedQuestions: any[] = [];
      let totalMarks = 25;
      let totalQuestions = 25;

      if (hasManual) {
        generatedQuestions = body.manualQuestions.map((q: any, idx: number) => {
          const rawOptions = Array.isArray(q.options) ? q.options : [];
          const options = rawOptions.map((opt: any, optIdx: number) => ({
            id: String(opt.id || String.fromCharCode(65 + optIdx)),
            text: String(opt.text || ""),
          }));

          return {
            id: q.id || `q_${idx + 1}`,
            questionNumber: idx + 1,
            questionPart: null,
            questionText: q.questionText || `Question ${idx + 1}`,
            questionType: "MCQ",
            marks: Number(q.marks) || 1,
            chapterName: effectiveSubject,
            chapterId: null,
            imageUrl: null,
            mcqOptions: options,
            correctAnswer: String(q.correctOptionId || "A").toUpperCase(),
            paperIIData: null,
          };
        });
        totalQuestions = generatedQuestions.length;
        totalMarks = generatedQuestions.reduce((acc, q) => acc + (q.marks || 1), 0);
      } else {
        const generated = await generateCustomPaperQuestions({
          paperType: normalizedType,
          count: typeof questionCount === "number" && questionCount > 0 ? questionCount : 25,
          prompt: prompt?.trim(),
          imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
          subject: effectiveSubject,
          classLevel,
          board,
          difficulty:
            difficulty === "Alpha" || difficulty === "Gamma" || difficulty === "Beta"
              ? difficulty
              : undefined,
        });
        generatedQuestions = generated.questions;
        totalMarks = generated.totalMarks;
        totalQuestions = generated.totalQuestions;
      }

      const generatedPaperId = randomUUID();
      const snapshot = generatedQuestions.map((q) => ({
        id: q.id,
        questionNumber: q.questionNumber,
        questionPart: q.questionPart,
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        chapterName: q.chapterName || effectiveSubject,
        chapterId: q.chapterId,
        imageUrl: q.imageUrl,
        mcqOptions: q.mcqOptions ?? null,
        correctAnswer: q.correctAnswer ?? null,
        paperIIData: q.paperIIData ?? null,
      }));

      const isPublic = body.isPublic !== undefined ? Boolean(body.isPublic) : true;
      const paperTitle = (body.customTitle || body.title || `${effectiveSubject} Class ${classLevel} · Paper ${normalizedType}`).trim();
      const uniqueChapterNames = Array.from(
        new Set(generatedQuestions.map((q) => q.chapterName).filter(Boolean) as string[])
      );

      await db.query(
        `INSERT INTO generated_papers
           (id, user_id, paper_type, subject, class, board, chapter_ids, question_ids, questions_snapshot, question_count, is_public, title, mode, creator_role, total_marks, chapter_names)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          generatedPaperId,
          userId,
          `paper${normalizedType}`,
          effectiveSubject,
          classLevel,
          board,
          JSON.stringify([]),
          JSON.stringify(generatedQuestions.map((q) => q.id)),
          JSON.stringify(snapshot),
          generatedQuestions.length,
          isPublic,
          paperTitle,
          hasManual ? "manual" : "custom",
          "STUDENT",
          totalMarks,
          JSON.stringify(uniqueChapterNames.length > 0 ? uniqueChapterNames : [effectiveSubject]),
        ],
      );

      return successResponse(
        {
          generatedPaperId,
          paperType: parseInt(normalizedType, 10),
          subject: effectiveSubject,
          classLevel,
          board,
          totalMarks,
          totalQuestions,
          source: hasManual ? "manual" : "custom_ai",
          questions: snapshot,
        },
        "Custom paper generated with 25 questions",
      );
    }

    if (!chapterIds || !Array.isArray(chapterIds) || chapterIds.length === 0) {
      return errorResponse("Select at least one chapter", 400);
    }

    const isPublic = body.isPublic !== undefined ? Boolean(body.isPublic) : true;
    const paperTitle = (body.customTitle || body.title || `${effectiveSubject} Class ${classLevel} · Paper ${normalizedType}`).trim();

    if (mode === "slos") {
      const sloNumbers = Array.isArray(body.sloNumbers)
        ? (body.sloNumbers as unknown[])
            .map(String)
            .filter((n: string) => n.trim().length > 0)
        : undefined;

      const paperData = await generateSloAlignedPaper({
        userId,
        subject,
        classLevel,
        board,
        paperType: normalizedType,
        chapterIds,
        sloNumbers: sloNumbers && sloNumbers.length > 0 ? sloNumbers : undefined,
        questionCount:
          typeof questionCount === "number" && questionCount > 0
            ? questionCount
            : 25,
        aiOnly: true,
        difficulty:
          difficulty === "Alpha" || difficulty === "Gamma" || difficulty === "Beta"
            ? difficulty
            : "Beta",
        isPublic,
        title: paperTitle,
        creatorRole: "STUDENT",
      });
      return successResponse(
        paperData,
        `SLO-aligned paper generated with ${paperData.totalQuestions} questions`,
      );
    }

    // Default: Past Papers mode
    const paperData = await generatePaperLogic({
      userId,
      subject,
      classLevel,
      board,
      paperType: normalizedType,
      chapterIds,
    });

    return successResponse(paperData, "Past paper questions generated");
  } catch (error: unknown) {
    console.error("Generate paper error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate paper";
    return errorResponse(message, 500);
  }
}
