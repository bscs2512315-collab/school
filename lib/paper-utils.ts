import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { resolveSubjectMapping } from "@/lib/paper/subject-mapping";

export interface GeneratePaperParams {
  userId: string;
  subject: string;
  classLevel: string;
  board: string;
  paperType: string;
  chapterIds: string[];
}

export interface GeneratedPaperData {
  generatedPaperId: string;
  paperType: number;
  subject: string;
  classLevel: string;
  board: string;
  totalMarks: number;
  totalQuestions: number;
  questions: any[];
  _correctAnswers?: Record<string, string>;
}

export async function generatePaperLogic(
  params: GeneratePaperParams,
): Promise<GeneratedPaperData> {
  const { userId, subject, classLevel, board, paperType, chapterIds } = params;

  // Lazy migration: create generated_papers tracking table
  await db
    .query(
      `CREATE TABLE IF NOT EXISTS generated_papers (
          id UUID PRIMARY KEY,
          user_id TEXT NOT NULL,
          paper_type VARCHAR(10) NOT NULL,
          subject TEXT NOT NULL,
          class TEXT NOT NULL,
          board TEXT NOT NULL,
          chapter_ids JSONB NOT NULL,
          question_ids JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,
    )
    .catch(() => {});

  const questionTypes = paperType === "2" ? ["CRQ", "ERQ"] : ["MCQ"];

  // Build chapter_ids placeholder for SQL
  const chapterPlaceholders = chapterIds
    .map((_: string, i: number) => `$${i + 1}`)
    .join(",");

  const questionTypePlaceholders = questionTypes
    .map((_: string, i: number) => `$${chapterIds.length + i + 1}`)
    .join(",");

  const resolved = resolveSubjectMapping(subject);
  const targetSubject = resolved.pastPaperSubject;

  // 1. Get questions from selected chapters matching the question type and medium/subject
  let allQuestions: any[] = [];

  // Try exact match with board and subject medium
  const pBoardIdx = chapterIds.length + questionTypes.length + 1;
  const pClassIdx = pBoardIdx + 1;
  const pSubjIdx = pClassIdx + 1;
  const pRawSubjIdx = pSubjIdx + 1;

  const { rows: exactMatchQuestions } = await db.query(
    `SELECT
         q.id,
         q.question_number,
         q.question_part,
         q.question_text,
         q.question_type,
         q.marks,
         q.mcq_data,
         q.chapter_id,
         q.chapter_name,
         q.image_url,
         ch.chapter_name as ch_name
       FROM questions q
       INNER JOIN past_papers pp ON q.past_paper_id = pp.id
       LEFT JOIN chapters ch ON q.chapter_id = ch.id
       WHERE q.chapter_id IN (${chapterPlaceholders})
         AND q.question_type IN (${questionTypePlaceholders})
         AND pp.board ILIKE $${pBoardIdx}
         AND pp.class ILIKE $${pClassIdx}
         AND (pp.subject ILIKE $${pSubjIdx} OR pp.subject ILIKE $${pRawSubjIdx})
       ORDER BY q.question_number ASC`,
    [...chapterIds, ...questionTypes, board, classLevel, targetSubject, subject],
  );

  allQuestions = exactMatchQuestions;

  // Fallback 1: match by class and subject medium without board restriction
  if (allQuestions.length === 0) {
    const { rows: classSubjectQuestions } = await db.query(
      `SELECT
           q.id,
           q.question_number,
           q.question_part,
           q.question_text,
           q.question_type,
           q.marks,
           q.mcq_data,
           q.chapter_id,
           q.chapter_name,
           q.image_url,
           ch.chapter_name as ch_name
         FROM questions q
         INNER JOIN past_papers pp ON q.past_paper_id = pp.id
         LEFT JOIN chapters ch ON q.chapter_id = ch.id
         WHERE q.chapter_id IN (${chapterPlaceholders})
           AND q.question_type IN (${questionTypePlaceholders})
           AND pp.class ILIKE $${chapterIds.length + questionTypes.length + 1}
           AND (pp.subject ILIKE $${chapterIds.length + questionTypes.length + 2} OR pp.subject ILIKE $${chapterIds.length + questionTypes.length + 3})
         ORDER BY q.question_number ASC`,
      [...chapterIds, ...questionTypes, classLevel, targetSubject, subject],
    );
    allQuestions = classSubjectQuestions;
  }

  // Fallback 2: any question in the selected chapters
  if (allQuestions.length === 0) {
    const { rows: anyQuestions } = await db.query(
      `SELECT
           q.id,
           q.question_number,
           q.question_part,
           q.question_text,
           q.question_type,
           q.marks,
           q.mcq_data,
           q.chapter_id,
           q.chapter_name,
           q.image_url,
           ch.chapter_name as ch_name
         FROM questions q
         LEFT JOIN chapters ch ON q.chapter_id = ch.id
         WHERE q.chapter_id IN (${chapterPlaceholders})
           AND q.question_type IN (${questionTypePlaceholders})
         ORDER BY q.question_number ASC`,
      [...chapterIds, ...questionTypes],
    );
    allQuestions = anyQuestions;
  }

  if (allQuestions.length === 0) {
    throw new Error(
      "No questions found for the selected chapters and paper type",
    );
  }

  // 2. Get previously served question IDs for this user + same chapters + same paper type
  const { rows: prevPapers } = await db.query(
    `SELECT question_ids FROM generated_papers
       WHERE user_id = $1 AND paper_type = $2 AND subject = $3 AND class = $4`,
    [userId, `paper${paperType}`, subject, classLevel],
  );

  const previouslyServedIds = new Set<string>();
  for (const p of prevPapers) {
    const ids =
      typeof p.question_ids === "string"
        ? JSON.parse(p.question_ids)
        : p.question_ids;
    for (const id of ids) previouslyServedIds.add(id);
  }

  // 3. Get wrong answer question IDs from exam_attempts
  const { rows: attempts } = await db.query(
    `SELECT answers_data FROM exam_attempts WHERE user_id = $1`,
    [userId],
  );

  const wrongQuestionIds = new Set<string>();
  for (const att of attempts) {
    if (!att.answers_data) continue;
    const data =
      typeof att.answers_data === "string"
        ? JSON.parse(att.answers_data)
        : att.answers_data;
    for (const [qId, result] of Object.entries(data)) {
      if (
        result &&
        typeof result === "object" &&
        (result as any).correct === false
      ) {
        wrongQuestionIds.add(qId);
      }
    }
  }

  // 4. Categorize questions by priority
  const unattempted: any[] = [];
  const wrong: any[] = [];
  const rest: any[] = [];

  for (const q of allQuestions) {
    if (!previouslyServedIds.has(q.id)) {
      unattempted.push(q);
    } else if (wrongQuestionIds.has(q.id)) {
      wrong.push(q);
    } else {
      rest.push(q);
    }
  }

  // Priority pool: unattempted first, then wrong, then rest
  const priorityPool = [...unattempted, ...wrong, ...rest];

  // 5. Select questions based on paper type
  let selectedQuestions: any[];

  if (paperType === "2") {
    // Paper 2: max 2 ERQ + 6 CRQ
    const erqs = shuffleArray(
      priorityPool.filter((q) => q.question_type === "ERQ"),
    ).slice(0, 2);
    const erqIds = new Set(erqs.map((q) => q.id));
    const crqs = shuffleArray(
      priorityPool.filter(
        (q) => q.question_type === "CRQ" && !erqIds.has(q.id),
      ),
    ).slice(0, 6);
    selectedQuestions = [...crqs, ...erqs].sort(
      (a, b) => a.question_number - b.question_number,
    );
  } else {
    // Paper 1: cap at 25 MCQs
    selectedQuestions = shuffleArray(priorityPool).slice(
      0,
      Math.min(priorityPool.length, 25),
    );
    selectedQuestions.sort((a, b) => a.question_number - b.question_number);
  }

  if (selectedQuestions.length === 0) {
    throw new Error("Not enough questions found");
  }

  // 6. Record the generated paper
  const generatedPaperId = randomUUID();
  const selectedIds = selectedQuestions.map((q) => q.id);

  await db.query(
    `INSERT INTO generated_papers (id, user_id, paper_type, subject, class, board, chapter_ids, question_ids)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      generatedPaperId,
      userId,
      `paper${paperType}`,
      subject,
      classLevel,
      board,
      JSON.stringify(chapterIds),
      JSON.stringify(selectedIds),
    ],
  );

  // 7. Format questions for response
  const formattedQuestions = selectedQuestions.map((q) => {
    let mcqOptions = null;
    let correctAnswer = null;
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

    return {
      id: q.id,
      questionNumber: q.question_number,
      questionPart: q.question_part || null,
      questionText: q.question_text,
      questionType: q.question_type,
      marks: q.marks || 1,
      chapterName: q.ch_name || q.chapter_name || null,
      imageUrl: q.image_url || null,
      // Only send options (not answers) for Paper 1 MCQs
      ...(paperType === "1" ? { mcqOptions } : {}),
    };
  });

  // Calculate total marks
  const totalMarks = formattedQuestions.reduce((sum, q) => sum + q.marks, 0);

  return {
    generatedPaperId,
    paperType: parseInt(paperType, 10),
    subject,
    classLevel,
    board,
    totalMarks,
    totalQuestions: formattedQuestions.length,
    questions: formattedQuestions,
    // Store correct answers for internal use (if needed)
    _correctAnswers:
      paperType === "1"
        ? selectedQuestions.reduce((acc: Record<string, string>, q: any) => {
            if (q.mcq_data) {
              try {
                const d =
                  typeof q.mcq_data === "string"
                    ? JSON.parse(q.mcq_data)
                    : q.mcq_data;
                if (d.correctAnswer) acc[q.id] = d.correctAnswer;
              } catch {}
            }
            return acc;
          }, {})
        : undefined,
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
