import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { serializePaperIIData } from "@/lib/bot/paper-ii-data";
import { PastPaperStatus } from "@/types/admin";

/**
 * Single source of truth for turning extracted/reviewed questions into
 * `questions` rows. Used by both the in-app confirm route (verified=true) and
 * the batch extraction script (verified=false → lands in the review UI).
 *
 * Centralizing the write path keeps `mcq_data` serialization, default marks,
 * and the column list from drifting between the two callers.
 */
export interface ExtractedQuestionInput {
  questionNumber: number;
  questionPart?: string | null;
  questionText: string;
  questionType: "MCQ" | "CRQ" | "ERQ";
  chapterId?: string | null;
  chapterName?: string | null;
  marks?: number | null;
  mcqOptions?: Array<{ id: string; text: string }> | null;
  correctAnswer?: string | null;
  imageUrl?: string | null;
  paperIIData?: unknown;
}

export interface InsertExtractedOptions {
  /** Mark rows as verified (admin-reviewed). Defaults to false → review UI. */
  verified?: boolean;
  /** Admin user id to record when verified. */
  verifiedBy?: string | null;
  /** Delete existing questions for this paper first (re-upload). Defaults true. */
  replaceExisting?: boolean;
  /** If set, also update past_papers.status + total_questions. */
  updatePaperStatus?: PastPaperStatus | null;
}

const DEFAULT_MARKS: Record<string, number> = {
  MCQ: 1,
  CRQ: 3,
  ERQ: 5,
};

export async function insertExtractedQuestions(
  pastPaperId: string,
  questions: ExtractedQuestionInput[],
  options: InsertExtractedOptions = {},
): Promise<{ inserted: number }> {
  const {
    verified = false,
    verifiedBy = null,
    replaceExisting = true,
    updatePaperStatus = null,
  } = options;

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    if (replaceExisting) {
      await client.query(`DELETE FROM questions WHERE past_paper_id = $1`, [
        pastPaperId,
      ]);
    }

    for (const question of questions) {
      const mcqData =
        question.questionType === "MCQ" && question.mcqOptions
          ? JSON.stringify({
              options: question.mcqOptions,
              correctAnswer: question.correctAnswer ?? null,
            })
          : null;

      const marks =
        question.marks || DEFAULT_MARKS[question.questionType] || 1;

      await client.query(
        `INSERT INTO questions (
          id, past_paper_id, question_number, question_part, question_text,
          question_type, chapter_id, chapter_name, marks, is_verified, verified_by, mcq_data, image_url, paper_ii_data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          randomUUID(),
          pastPaperId,
          question.questionNumber,
          question.questionPart || null,
          question.questionText,
          question.questionType,
          question.chapterId || null,
          question.chapterName || null,
          marks,
          verified,
          verified ? verifiedBy : null,
          mcqData,
          question.imageUrl || null,
          serializePaperIIData(question.paperIIData as never),
        ],
      );
    }

    if (updatePaperStatus) {
      await client.query(
        `UPDATE past_papers SET status = $1, total_questions = $2, updated_at = NOW() WHERE id = $3`,
        [updatePaperStatus, questions.length, pastPaperId],
      );
    }

    await client.query("COMMIT");
    return { inserted: questions.length };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
