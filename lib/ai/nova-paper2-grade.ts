import { z } from "zod";
import { after } from "next/server";
import {
  generateGeminiContentWithRetry,
  getGeminiPaperModelsToTry,
} from "@/lib/ai/gemini";
import { fetchImageAsBase64 } from "@/lib/ai/vision-image";
import { parsePaperIIData } from "@/lib/bot/paper-ii-data";
import { db } from "@/lib/db";
import { sendGradingResultEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { awardStudentProgressPoints } from "@/lib/gamification/award-progress-points";
import { getClassroomSettings } from "@/lib/teacher/classroom-schema";
import { formatMathToUnicode } from "@/lib/utils/math-notation";

export interface Paper2QuestionGradeResult {
  score: number;
  maxMarks: number;
  feedback: string;
  imageUrl: string | null;
  imageUrls?: string[];
  gradedBy: "nova";
}

export interface NovaPaper2GradeResult {
  attemptId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  pointsAwarded: number;
  gradingResults: Record<string, Paper2QuestionGradeResult>;
  alreadyGraded?: boolean;
}

interface Paper2QuestionRow {
  id: string;
  text: string;
  marks: number;
  paper_ii_data: unknown;
  question_number: number;
  part: string | null;
  section: string | null;
}

interface ExamAttemptRow {
  id: string;
  user_id: string;
  paper_id: string | null;
  generated_paper_id: string | null;
  teacher_paper_id?: string | null;
  subject: string;
  grading_status: string;
  answers_data: unknown;
}

const novaQuestionGradeSchema = z.object({
  score: z.number(),
  feedback: z.string(),
});

const GRADING_CONCURRENCY = 4;

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

function parseQuestionIds(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((id): id is string => typeof id === "string");
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === "string")
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function loadQuestionsForAttempt(attempt: ExamAttemptRow): Promise<Paper2QuestionRow[]> {
  if (attempt.teacher_paper_id) {
    const { rows } = await db.query(
      `SELECT questions_snapshot FROM teacher_papers WHERE id = $1`,
      [attempt.teacher_paper_id],
    );
    const snapshotRaw = rows[0]?.questions_snapshot;
    const snapshot =
      typeof snapshotRaw === "string" ? JSON.parse(snapshotRaw) : snapshotRaw;
    if (!Array.isArray(snapshot)) return [];
    return snapshot.map((q: Record<string, unknown>) => ({
      id: String(q.id),
      text: String(q.questionText ?? ""),
      marks: Number(q.marks) || 1,
      paper_ii_data: q.paperIIData ?? null,
      question_number: Number(q.questionNumber) || 0,
      part: (q.questionPart as string | null) ?? null,
      section: null,
    }));
  }

  if (attempt.generated_paper_id) {
    const { rows: genPaper } = await db.query(
      `SELECT question_ids, questions_snapshot FROM generated_papers WHERE id = $1`,
      [attempt.generated_paper_id],
    );

    const snapshotRaw = genPaper[0]?.questions_snapshot;
    const snapshot =
      typeof snapshotRaw === "string" ? JSON.parse(snapshotRaw) : snapshotRaw;
    if (Array.isArray(snapshot) && snapshot.length > 0) {
      return snapshot.map((q: Record<string, unknown>) => ({
        id: String(q.id),
        text: String(q.questionText ?? ""),
        marks: Number(q.marks) || 1,
        paper_ii_data: q.paperIIData ?? null,
        question_number: Number(q.questionNumber) || 0,
        part: (q.questionPart as string | null) ?? null,
        section: null,
      }));
    }

    const questionIds = parseQuestionIds(genPaper[0]?.question_ids);
    if (questionIds.length === 0) {
      return [];
    }

    const placeholders = questionIds.map((_, index) => `$${index + 1}`).join(",");
    const { rows } = await db.query<Paper2QuestionRow>(
      `SELECT id, question_text AS text, marks, paper_ii_data, question_number, question_part AS part, NULL::text AS section
       FROM questions WHERE id IN (${placeholders})
       ORDER BY question_number ASC`,
      questionIds,
    );
    return rows;
  }

  if (attempt.paper_id) {
    const { rows } = await db.query<Paper2QuestionRow>(
      `SELECT id, question_text AS text, marks, paper_ii_data, question_number, question_part AS part, NULL::text AS section
       FROM questions WHERE past_paper_id = $1
       ORDER BY question_number ASC`,
      [attempt.paper_id],
    );
    return rows;
  }

  return [];
}

function buildNovaGradingPrompt(params: {
  questionText: string;
  maxMarks: number;
  part: string | null;
  section: string | null;
  betterResponse: string | null;
  weakerResponse: string | null;
  markingNotes: string | null;
}): string {
  const exemplarBlock =
    params.betterResponse || params.weakerResponse || params.markingNotes
      ? `
REFERENCE EXEMPLARS (from ExBoard question bank — use these as your rubric):
${params.betterResponse ? `\n★ STRONG RESPONSE (benchmark for high marks):\n${params.betterResponse}` : ""}
${params.weakerResponse ? `\n△ WEAKER RESPONSE (benchmark for partial marks):\n${params.weakerResponse}` : ""}
${params.markingNotes ? `\n📋 MARKING NOTES:\n${params.markingNotes}` : ""}

Compare the student's handwritten answer image against the strong and weaker exemplars.
Award marks proportionally: answers closer to the strong exemplar earn more; answers resembling the weaker exemplar earn fewer.
`
      : `
No stored exemplars exist for this question. Grade using standard Pakistani board exam criteria for ${params.part || "CRQ/ERQ"} questions.
`;

  return `You are Nova, ExBoard's AI exam grader. You grade Paper II (CRQ/ERQ) handwritten answers for Pakistani board students.

QUESTION (${params.part || "Paper II"} · ${params.section || "Section"} · ${params.maxMarks} marks):
${params.questionText}
${exemplarBlock}
INSTRUCTIONS:
1. Read the student's handwritten answer from the attached image carefully.
2. If the image is blank, unreadable, or unrelated, award 0 marks and explain why.
3. Award an integer score from 0 to ${params.maxMarks}.
4. Write concise, constructive feedback (2–4 sentences) referencing what the student did well and what to improve.
5. Be fair and consistent with board marking standards.
6. MATH & NOTATION: Write equations, variables, and formulas in clean text with Unicode symbols (e.g., x², x³, ±, √, ≤, ≥, ≠). NEVER use LaTeX math delimiters ($ or $$), NEVER write carets like x^2, and NEVER use LaTeX commands like \frac. Write equations directly (e.g., 2x² + 5x + 2 = 0).

Respond with ONLY valid JSON (no markdown fences):
{"score": <integer 0-${params.maxMarks}>, "feedback": "<your feedback>"}`;
}

async function gradeQuestionWithNova(params: {
  question: Paper2QuestionRow;
  imageUrls: string[];
}): Promise<Paper2QuestionGradeResult> {
  const maxMarks = params.question.marks || 1;
  const paperData = parsePaperIIData(params.question.paper_ii_data);
  const baseResult: Paper2QuestionGradeResult = {
    score: 0,
    maxMarks,
    feedback: "",
    imageUrl: params.imageUrls[0] ?? null,
    imageUrls: params.imageUrls,
    gradedBy: "nova",
  };

  if (!params.imageUrls || params.imageUrls.length === 0) {
    return {
      ...baseResult,
      feedback: "No answer was submitted for this question.",
    };
  }

  try {
    const imageResults = await Promise.allSettled(
      params.imageUrls.map((url) => fetchImageAsBase64(url)),
    );
    const inlineParts = imageResults
      .filter(
        (r): r is PromiseFulfilledResult<{ base64: string; mimeType: string }> =>
          r.status === "fulfilled",
      )
      .map((r) => ({
        inlineData: { mimeType: r.value.mimeType, data: r.value.base64 },
      }));

    if (inlineParts.length === 0) {
      throw new Error("Nova could not fetch any submitted answer images");
    }

    const prompt = buildNovaGradingPrompt({
      questionText: params.question.text,
      maxMarks,
      part: params.question.part,
      section: params.question.section,
      betterResponse: paperData?.betterResponse ?? null,
      weakerResponse: paperData?.weakerResponse ?? null,
      markingNotes: paperData?.markingNotes ?? null,
    });

    const result = await generateGeminiContentWithRetry(
      {
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              ...(inlineParts.length > 1
                ? [
                    {
                      text:
                        "The student submitted multiple images for this answer. Review all of them together before scoring.",
                    },
                  ]
                : []),
              ...inlineParts,
            ],
          },
        ],
      },
      { modelsToTry: getGeminiPaperModelsToTry() },
    );

    const rawText = result.response.text();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Nova returned an invalid grading response");
    }

    const parsed = novaQuestionGradeSchema.parse(JSON.parse(jsonMatch[0]));
    const clampedScore = Math.max(0, Math.min(maxMarks, Math.round(parsed.score)));
    const cleanedFeedback = formatMathToUnicode(parsed.feedback.trim());

    return {
      ...baseResult,
      score: clampedScore,
      feedback: cleanedFeedback || "Graded by Nova.",
    };
  } catch (error) {
    console.error(`[Nova] Failed to grade question ${params.question.id}:`, error);
    return {
      ...baseResult,
      feedback:
        "Nova could not read or grade this answer. Please contact support if this persists.",
    };
  }
}

async function awardPointsAndMilestones(
  userId: string,
  input: Parameters<typeof awardStudentProgressPoints>[1],
): Promise<number> {
  const { pointsAwarded } = await awardStudentProgressPoints(userId, input);
  return pointsAwarded;
}

export async function gradePaper2AttemptWithNova(
  attemptId: string,
): Promise<NovaPaper2GradeResult> {
  const { rows: attempts } = await db.query(
    `SELECT id, user_id, paper_id, generated_paper_id, teacher_paper_id, subject, grading_status, answers_data
     FROM exam_attempts WHERE id = $1`,
    [attemptId],
  );

  if (attempts.length === 0) {
    throw new Error("Attempt not found");
  }

  const attempt = attempts[0] as ExamAttemptRow;

  if (
    attempt.grading_status === "graded" ||
    attempt.grading_status === "awaiting_approval"
  ) {
    const existingAnswers = parseJsonRecord(attempt.answers_data);
    let existingScore = 0;
    let existingTotal = 0;

    for (const entry of Object.values(existingAnswers)) {
      if (entry && typeof entry === "object") {
        if ("score" in entry) {
          existingScore += Number((entry as { score: number }).score || 0);
        }
        if ("maxMarks" in entry) {
          existingTotal += Number((entry as { maxMarks: number }).maxMarks || 0);
        }
      }
    }

    return {
      attemptId,
      score: existingScore,
      totalMarks: existingTotal,
      percentage: existingTotal > 0 ? Math.round((existingScore / existingTotal) * 100) : 0,
      pointsAwarded: 0,
      gradingResults: existingAnswers as Record<string, Paper2QuestionGradeResult>,
      alreadyGraded: true,
    };
  }

  const questions = await loadQuestionsForAttempt(attempt);
  if (questions.length === 0) {
    await db.query(`UPDATE exam_attempts SET grading_status = 'failed' WHERE id = $1`, [attemptId]);
    throw new Error("No questions found for this attempt");
  }

  const studentAnswers = parseJsonRecord(attempt.answers_data);
  const gradingResults: Record<string, Paper2QuestionGradeResult> = {};

  // Check if this attempt belongs to a Sindh Board paper
  let isSindhBoard = false;
  if (attempt.paper_id) {
    const { rows: pRows } = await db.query<{ board: string | null }>(
      `SELECT board FROM past_papers WHERE id = $1`,
      [attempt.paper_id]
    );
    if (pRows[0]?.board?.toLowerCase().includes("sindh")) {
      isSindhBoard = true;
    }
  }

  const entries = questions.map((question) => {
    const maxMarks = question.marks || 1;

    const answerEntry = studentAnswers[question.id];
    const entryRecord =
      answerEntry && typeof answerEntry === "object"
        ? (answerEntry as Record<string, unknown>)
        : null;

    const imageUrls = Array.isArray(entryRecord?.imageUrls)
      ? entryRecord.imageUrls.filter((url): url is string => typeof url === "string")
      : typeof entryRecord?.imageUrl === "string"
        ? [entryRecord.imageUrl]
        : [];

    return { question, maxMarks, imageUrls };
  });

  const results = await mapLimit(
    entries,
    GRADING_CONCURRENCY,
    async ({ question, imageUrls }) => ({
      question,
      result: await gradeQuestionWithNova({ question, imageUrls }),
    }),
  );

  for (const { question, result } of results) {
    gradingResults[question.id] = result;
  }

  let totalScore = 0;
  let totalMarks = 0;

  if (isSindhBoard) {
    // SINDH BOARD SPECIFIC GRADING LOGIC
    // Group choice questions (e.g. Q10 & Q11 OR, Q16 & Q17 OR)
    let i = 0;
    while (i < entries.length) {
      const curr = entries[i];
      const next = entries[i + 1];
      const nextIsOr =
        next &&
        ((next.question.part || "").toUpperCase().includes("OR") &&
          (next.question.question_number === curr.question.question_number ||
            !next.question.question_number));

      if (nextIsOr) {
        // Choice pair! Max marks is counted once.
        const resCurr = gradingResults[curr.question.id];
        const resNext = gradingResults[next.question.id];
        const pairMaxMarks = Math.max(curr.maxMarks, next.maxMarks);
        totalMarks += pairMaxMarks;

        const currAttempted = curr.imageUrls.length > 0;
        const nextAttempted = next.imageUrls.length > 0;

        if (currAttempted && !nextAttempted) {
          // Student answered Option A, left Option B unattempted -> No penalty
          totalScore += resCurr ? resCurr.score : 0;
        } else if (!currAttempted && nextAttempted) {
          // Student answered Option B, left Option A unattempted -> No penalty
          totalScore += resNext ? resNext.score : 0;
        } else if (currAttempted && nextAttempted) {
          // Student answered both options -> award higher score
          const scoreA = resCurr ? resCurr.score : 0;
          const scoreB = resNext ? resNext.score : 0;
          totalScore += Math.max(scoreA, scoreB);
        } else {
          // Neither answered
          totalScore += 0;
        }

        i += 2;
      } else {
        // Standard mandatory question
        const res = gradingResults[curr.question.id];
        totalMarks += curr.maxMarks;
        totalScore += res ? res.score : 0;
        i += 1;
      }
    }
  } else {
    // STANDARD GRADING LOGIC (AKUEB & others)
    for (const entry of entries) {
      totalMarks += entry.maxMarks;
      const res = gradingResults[entry.question.id];
      totalScore += res ? res.score : 0;
    }
  }

  const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
  const isTeacherPaper = Boolean(attempt.teacher_paper_id);

  const { rows: paperRows } = await db.query<{
    teacher_id: string;
    classroom_id: string;
    title: string;
  }>(
    `SELECT teacher_id, classroom_id, title FROM teacher_papers WHERE id = $1`,
    [attempt.teacher_paper_id],
  );
  const paper = paperRows[0];

  const autoApprove = paper
    ? (await getClassroomSettings(paper.classroom_id)).autoApprovePaper2
    : false;

  // Classroom Practice Tests: hold for teacher edit/approve unless the
  // classroom has Auto-approve enabled.
  if (isTeacherPaper && paper && !autoApprove) {
    await db.query(
      `UPDATE exam_attempts
       SET score = $1, total_marks = $2, answers_data = $3, grading_status = 'awaiting_approval'
       WHERE id = $4`,
      [totalScore, totalMarks, JSON.stringify(gradingResults), attemptId],
    );

    const { rows: studentRows } = await db.query<{ name: string | null }>(
      `SELECT name FROM users WHERE id = $1`,
      [attempt.user_id],
    );
    const studentName = studentRows[0]?.name || "A student";

    try {
      await createNotification({
        userId: paper.teacher_id,
        type: "PAPER_AWAITING_APPROVAL",
        title: "AI grading ready for review",
        message: `${studentName} — ${paper.title}: ${totalScore}/${totalMarks} (${percentage}%). Review and approve.`,
        link: FRONTEND_ROUTES.TEACHER_CLASSROOM_ATTEMPT(
          paper.classroom_id,
          attemptId,
        ),
        metadata: {
          attemptId,
          classroomId: paper.classroom_id,
          teacherPaperId: attempt.teacher_paper_id,
          action: "review_result",
        },
      });
    } catch (notificationError) {
      console.error("[Nova] Failed to notify teacher for approval:", notificationError);
    }

    return {
      attemptId,
      score: totalScore,
      totalMarks,
      percentage,
      pointsAwarded: 0,
      gradingResults,
    };
  }

  const pointsAwarded = await awardPointsAndMilestones(attempt.user_id, {
    score: totalScore,
    totalMarks,
    percentage,
    paperType: "paper2",
    questionCount: entries.length,
  });

  await db.query(
    `UPDATE exam_attempts
     SET score = $1, total_marks = $2, answers_data = $3, grading_status = 'graded', updated_at = NOW()
     WHERE id = $4`,
    [totalScore, totalMarks, JSON.stringify(gradingResults), attemptId],
  );

  const { rows: userRows } = await db.query(`SELECT name, email FROM users WHERE id = $1`, [
    attempt.user_id,
  ]);
  const student = userRows[0];

  if (student?.email) {
    try {
      await sendGradingResultEmail(student.email, student.name || "Student", {
        attemptId,
        subject: attempt.subject,
        score: totalScore,
        totalMarks,
        percentage,
        pointsAwarded,
        gradingResults,
      });
    } catch (emailError) {
      console.error("[Nova] Failed to send grading email:", emailError);
    }
  }

  try {
    await createNotification({
      userId: attempt.user_id,
      type: "PAPER_GRADED",
      title: "Paper II Graded by Nova",
      message: `Nova graded your ${attempt.subject} Paper II: ${totalScore}/${totalMarks} (${percentage}%).`,
      link: FRONTEND_ROUTES.STUDENT_HISTORY_DETAIL(attemptId),
    });
  } catch (notificationError) {
    console.error("[Nova] Failed to create notification:", notificationError);
  }

  return {
    attemptId,
    score: totalScore,
    totalMarks,
    percentage,
    pointsAwarded,
    gradingResults,
  };
}

export function scheduleNovaPaper2Grading(attemptId: string): void {
  after(async () => {
    try {
      await gradePaper2AttemptWithNova(attemptId);
    } catch (error) {
      console.error(`[Nova] Async grading failed for attempt ${attemptId}:`, error);
      await db
        .query(`UPDATE exam_attempts SET grading_status = 'failed' WHERE id = $1`, [attemptId])
        .catch(() => {});
    }
  });
}

export async function enqueuePendingManualAttemptsForNovaGrading(): Promise<number> {
  const { rows } = await db.query(
    `UPDATE exam_attempts
     SET grading_status = 'pending'
     WHERE paper_type = 'paper2' AND grading_status = 'pending_manual'
     RETURNING id`,
  );

  for (const row of rows) {
    scheduleNovaPaper2Grading(row.id);
  }

  return rows.length;
}

/**
 * Recover attempts stuck in `pending` (e.g. when the background `after()` task
 * never ran or was killed on the hosting platform). Returns ids re-scheduled.
 * Optionally pass `cutoffMinutes` to only pick up attempts older than that.
 * When `gradeNow` is false the attempts are only re-scheduled; when true they
 * are graded inline within this call.
 */
export async function recoverStuckPendingGradings(options?: {
  cutoffMinutes?: number;
  gradeNow?: boolean;
  limit?: number;
}): Promise<string[]> {
  const cutoffMinutes = options?.cutoffMinutes ?? 5;
  const gradeNow = options?.gradeNow ?? false;
  const limit = options?.limit ?? 10;

  const { rows } = await db.query<{ id: string }>(
    `SELECT id
     FROM exam_attempts
     WHERE paper_type = 'paper2'
       AND grading_status IN ('pending', 'failed')
       AND created_at < (NOW() - ($1::int || ' minutes')::interval)
     ORDER BY created_at ASC
     LIMIT $2`,
    [cutoffMinutes, limit],
  );

  const ids = rows.map((row) => row.id);

  if (gradeNow) {
    const processed: string[] = [];
    for (const id of ids) {
      try {
        await gradePaper2AttemptWithNova(id);
        processed.push(id);
      } catch (error) {
        console.error(`[Nova] Inline recover failed for attempt ${id}:`, error);
      }
    }
    return processed;
  }

  for (const id of ids) {
    scheduleNovaPaper2Grading(id);
  }
  return ids;
}
