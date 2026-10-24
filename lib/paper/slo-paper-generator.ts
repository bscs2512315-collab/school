import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { extractSlosFromAnalyzedContent } from "@/lib/paper/extract-slos";
import {
  generateQuestionsFromSlos,
  type SloGeneratedQuestion,
} from "@/lib/ai/generate-questions-from-slos";
import { ensureClassroomSchema } from "@/lib/teacher/classroom-schema";

export interface GenerateSloPaperParams {
  userId: string;
  subject: string;
  classLevel: string;
  board: string;
  paperType: "1" | "2";
  chapterIds: string[];
  questionCount?: number;
  /** Restrict generation to these SLO numbers (e.g. ["15.1", "15.2"]). When empty, all chapter SLOs are used. */
  sloNumbers?: string[];
  /** When true, include correctAnswer / paperIIData for teacher preview & edit */
  includeAnswers?: boolean;
  /** Use SLO text directly instead of loosely matching existing bank questions. */
  aiOnly?: boolean;
  /** Difficulty tier: Alpha (Easy), Beta (Medium), Gamma (Hard) */
  difficulty?: "Alpha" | "Beta" | "Gamma";
  /** Visibility in Papers Bank (defaults to true) */
  isPublic?: boolean;
  /** Custom test/paper title */
  title?: string;
  /** Creator role ('STUDENT' | 'TEACHER') */
  creatorRole?: string;
}

export interface GeneratedSloPaperQuestion {
  id: string;
  questionNumber: number;
  questionPart: string | null;
  questionText: string;
  questionType: string;
  marks: number;
  sloNumber?: string | null;
  chapterName: string | null;
  chapterId?: string | null;
  imageUrl: string | null;
  difficulty?: "Alpha" | "Beta" | "Gamma" | string | null;
  explanation?: string | null;
  mcqOptions?: Array<{ id: string; text: string }> | null;
  correctAnswer?: string | null;
  paperIIData?: {
    betterResponse?: string;
    weakerResponse?: string;
    markingNotes?: string;
  } | null;
}

export interface GeneratedSloPaperData {
  generatedPaperId: string;
  paperType: number;
  subject: string;
  classLevel: string;
  board: string;
  totalMarks: number;
  totalQuestions: number;
  questions: GeneratedSloPaperQuestion[];
  source: "bank" | "slo_ai" | "hybrid";
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function defaultQuestionCount(paperType: "1" | "2", requested?: number): number {
  if (typeof requested === "number" && requested > 0) {
    return Math.min(Math.max(requested, 1), 50);
  }
  return 25;
}

function normalizeMcqOptions(
  options: unknown[] | null | undefined,
): Array<{ id: string; text: string }> | null {
  if (!options?.length) return null;
  return options.map((opt, index) => {
    if (opt && typeof opt === "object" && "id" in (opt as object)) {
      const o = opt as { id: string; text: string };
      return { id: String(o.id), text: String(o.text ?? "") };
    }
    const text = String(opt ?? "");
    const letter = String.fromCharCode(65 + index);
    const cleaned = text.replace(/^[A-D][).:\-]\s*/i, "").trim() || text;
    return { id: letter, text: cleaned };
  });
}

function toClientQuestions(
  questions: SloGeneratedQuestion[],
  paperType: "1" | "2",
) {
  return questions.map((q) => ({
    id: q.id,
    questionNumber: q.questionNumber,
    questionPart: q.questionPart,
    questionText: q.questionText,
    questionType: q.questionType,
    marks: q.marks,
    sloNumber: q.sloNumber || null,
    chapterName: q.chapterName,
    imageUrl: q.imageUrl,
    ...(paperType === "1"
      ? { mcqOptions: normalizeMcqOptions(q.mcqOptions) }
      : {}),
  }));
}

/**
 * Generate a Paper 1/2 from chapter SLOs.
 * Prefers question-bank items mapped to those chapters; fills remaining slots with AI from SLOs.
 */
export async function generateSloAlignedPaper(
  params: GenerateSloPaperParams,
): Promise<GeneratedSloPaperData> {
  const {
    includeAnswers = false,
    userId,
    subject,
    classLevel,
    board,
    paperType,
    chapterIds,
    sloNumbers,
    aiOnly = false,
    difficulty = "Beta",
  } = params;

  if (!chapterIds.length) {
    throw new Error("Select at least one chapter");
  }

  const selectedSloSet = new Set(
    (sloNumbers ?? [])
      .map((n) => n.trim().toLowerCase())
      .filter((n) => n.length > 0),
  );
  const hasSloFilter = selectedSloSet.size > 0;

  await ensureClassroomSchema();

  const targetCount = defaultQuestionCount(paperType, params.questionCount);
  const questionTypes = paperType === "2" ? ["CRQ", "ERQ"] : ["MCQ"];

  const chapterPlaceholders = chapterIds.map((_, i) => `$${i + 1}`).join(",");
  const typePlaceholders = questionTypes
    .map((_, i) => `$${chapterIds.length + i + 1}`)
    .join(",");

  const { rows: chapters } = await db.query(
    `SELECT id, chapter_number, chapter_name, analyzed_content
     FROM chapters
     WHERE id IN (${chapterPlaceholders})`,
    chapterIds,
  );

  if (chapters.length === 0) {
    throw new Error("Selected chapters were not found");
  }

  const chaptersWithSlos = chapters.map((ch) => {
    let slos = extractSlosFromAnalyzedContent(ch.analyzed_content);
    if (slos.length === 0) {
      // Fallback synthetic SLOs so generation always succeeds even without pre-analyzed syllabus content
      slos = [
        {
          sloNumber: `${ch.chapter_number || "1"}.1`,
          sloText: `Understand core concepts, definitions, formulas, and problem solving in ${ch.chapter_name || "the syllabus"}.`,
          cognitiveLevel: "U",
        },
        {
          sloNumber: `${ch.chapter_number || "1"}.2`,
          sloText: `Apply analytical knowledge, calculations, and practical problem solving related to ${ch.chapter_name || "the syllabus"}.`,
          cognitiveLevel: "A",
        },
      ];
    }
    const kept =
      hasSloFilter && slos.length > 0
        ? slos.filter((s) => selectedSloSet.has(s.sloNumber.trim().toLowerCase()))
        : slos;
    return { chapter: ch, slos: kept.length > 0 ? kept : slos };
  });

  const hasAnySlos = chaptersWithSlos.some((c) => c.slos.length > 0);
  if (!hasAnySlos) {
    throw new Error(
      "No valid syllabus topics found for the selected chapters. Please try other chapters.",
    );
  }

  const { rows: bankQuestions } =
    hasSloFilter || aiOnly || Boolean(params.difficulty)
      ? { rows: [] }
      : await db.query(
    `SELECT
       q.id,
       q.question_number,
       q.question_part,
       q.question_text,
       q.question_type,
       q.marks,
       q.mcq_data,
       q.paper_ii_data,
       q.chapter_id,
       q.chapter_name,
       q.image_url,
       ch.chapter_name as ch_name
     FROM questions q
     LEFT JOIN chapters ch ON q.chapter_id = ch.id
     WHERE q.chapter_id IN (${chapterPlaceholders})
       AND q.question_type IN (${typePlaceholders})
     ORDER BY q.question_number ASC`,
    [...chapterIds, ...questionTypes],
  );

  // Explicit SLO selection cannot be verified against legacy bank questions,
  // which have no reliable SLO mapping. Generate from the selected SLO text.
  const eligibleBank = bankQuestions;

  let selectedBank: typeof bankQuestions = [];

  if (paperType === "2") {
    const erqs = shuffleArray(
      eligibleBank.filter((q) => q.question_type === "ERQ"),
    ).slice(0, Math.min(2, targetCount));
    const remaining = Math.max(targetCount - erqs.length, 0);
    const erqIds = new Set(erqs.map((q) => q.id));
    const crqs = shuffleArray(
      eligibleBank.filter(
        (q) => q.question_type === "CRQ" && !erqIds.has(q.id),
      ),
    ).slice(0, remaining);
    selectedBank = [...crqs, ...erqs];
  } else {
    selectedBank = shuffleArray(eligibleBank).slice(0, targetCount);
  }

  const bankMapped: SloGeneratedQuestion[] = selectedBank.map((q, index) => {
    let mcqOptions: string[] | null = null;
    let correctAnswer: string | null = null;
    let paperIIData = null;

    if (q.mcq_data) {
      try {
        const mcqData =
          typeof q.mcq_data === "string" ? JSON.parse(q.mcq_data) : q.mcq_data;
        mcqOptions = mcqData.options || null;
        correctAnswer = mcqData.correctAnswer || null;
      } catch {
        // ignore
      }
    }

    if (q.paper_ii_data) {
      try {
        paperIIData =
          typeof q.paper_ii_data === "string"
            ? JSON.parse(q.paper_ii_data)
            : q.paper_ii_data;
      } catch {
        paperIIData = null;
      }
    }

    return {
      id: q.id,
      questionNumber: index + 1,
      questionPart: q.question_part || null,
      questionText: q.question_text,
      questionType: q.question_type as "MCQ" | "CRQ" | "ERQ",
      marks: q.marks || 1,
      chapterName: q.ch_name || q.chapter_name || null,
      chapterId: q.chapter_id,
      imageUrl: q.image_url || null,
      mcqOptions,
      correctAnswer,
      paperIIData,
    };
  });

  const remaining = Math.max(targetCount - bankMapped.length, 0);
  let aiQuestions: SloGeneratedQuestion[] = [];

  if (remaining > 0) {
    const eligibleChapters = chaptersWithSlos.filter(({ slos }) => slos.length > 0);
    // Limit to at most 2 chapters in parallel so total execution finishes in ~5-8s well below serverless timeout limits
    const selectedChapters = eligibleChapters.slice(0, 2);
    const perChapter = Math.ceil(remaining / Math.max(1, selectedChapters.length));

    const batchPromises = selectedChapters.map(({ chapter, slos }, idx) => {
      const need = idx === selectedChapters.length - 1
        ? remaining - perChapter * idx
        : perChapter;
      return generateQuestionsFromSlos({
        paperType,
        subject,
        classLevel,
        board,
        chapterName: chapter.chapter_name,
        chapterId: chapter.id,
        slos,
        count: Math.max(1, need),
        strictSloMatch: false,
        difficulty,
      });
    });

    const settled = await Promise.allSettled(batchPromises);
    const generated: SloGeneratedQuestion[] = [];
    for (const res of settled) {
      if (res.status === "fulfilled" && Array.isArray(res.value)) {
        generated.push(...res.value);
      }
    }

    aiQuestions = generated.slice(0, remaining).map((q, index) => ({
      ...q,
      questionNumber: bankMapped.length + index + 1,
    }));
  }

  const allQuestions = [...bankMapped, ...aiQuestions];
  if (allQuestions.length === 0) {
    throw new Error(
      "Could not generate questions from SLOs or the question bank for these chapters.",
    );
  }

  const source: GeneratedSloPaperData["source"] =
    bankMapped.length === 0
      ? "slo_ai"
      : aiQuestions.length === 0
        ? "bank"
        : "hybrid";

  const generatedPaperId = randomUUID();
  const snapshot = allQuestions.map((q) => ({
    id: q.id,
    questionNumber: q.questionNumber,
    questionPart: q.questionPart,
    questionText: q.questionText,
    questionType: q.questionType,
    marks: q.marks,
    sloNumber: q.sloNumber ?? null,
    chapterName: q.chapterName,
    chapterId: q.chapterId,
    imageUrl: q.imageUrl,
    mcqOptions: q.mcqOptions ?? null,
    correctAnswer: q.correctAnswer ?? null,
    paperIIData: q.paperIIData ?? null,
  }));

  const isPublic = params.isPublic !== undefined ? Boolean(params.isPublic) : true;
  const paperTitle = params.title?.trim() || `${subject} Class ${classLevel} · Paper ${paperType}`;
  const creatorRole = params.creatorRole || "STUDENT";
  
  // Extract unique chapter names
  const uniqueChapterNames = Array.from(
    new Set(allQuestions.map((q) => q.chapterName).filter(Boolean) as string[])
  );

  const totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);

  await db.query(
    `INSERT INTO generated_papers
       (id, user_id, paper_type, subject, class, board, chapter_ids, question_ids, questions_snapshot, question_count, is_public, title, mode, creator_role, total_marks, chapter_names)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [
      generatedPaperId,
      userId,
      `paper${paperType}`,
      subject,
      classLevel,
      board,
      JSON.stringify(chapterIds),
      JSON.stringify(allQuestions.map((q) => q.id)),
      JSON.stringify(snapshot),
      allQuestions.length,
      isPublic,
      paperTitle,
      "slos",
      creatorRole,
      totalMarks,
      JSON.stringify(uniqueChapterNames),
    ],
  );

  const clientQuestions: GeneratedSloPaperQuestion[] = includeAnswers
    ? snapshot.map((q) => ({
        id: q.id,
        questionNumber: q.questionNumber,
        questionPart: q.questionPart,
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        sloNumber: q.sloNumber ?? null,
        chapterName: q.chapterName,
        chapterId: q.chapterId,
        imageUrl: q.imageUrl,
        mcqOptions: normalizeMcqOptions(
          Array.isArray(q.mcqOptions) ? q.mcqOptions : null,
        ),
        correctAnswer: q.correctAnswer ?? null,
        paperIIData: q.paperIIData ?? null,
      }))
    : toClientQuestions(allQuestions, paperType);

  return {
    generatedPaperId,
    paperType: parseInt(paperType, 10),
    subject,
    classLevel,
    board,
    totalMarks,
    totalQuestions: clientQuestions.length,
    questions: clientQuestions,
    source,
  };
}
