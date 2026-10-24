import { db } from "@/lib/db";
import { computeProgressPoints } from "@/lib/gamification/award-progress-points";
import type {
  CustomQuiz,
  CustomQuizPayload,
  CustomQuizQuestion,
} from "@/types/custom-quiz";

export const CUSTOM_QUIZ_LIMITS = {
  TITLE_MAX: 150,
  DESCRIPTION_MAX: 500,
  SUBJECT_MAX: 60,
  QUESTION_TEXT_MAX: 1000,
  EXPLANATION_MAX: 1000,
  OPTION_TEXT_MAX: 300,
  MIN_QUESTIONS: 1,
  MAX_QUESTIONS: 50,
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 6,
} as const;

let ensureTablePromise: Promise<void> | null = null;

/**
 * Lazily creates the custom_quizzes + custom_quiz_shares tables so the feature
 * works without a manual migration step (mirrors
 * scripts/create-custom-quiz-tables.js).
 */
export function ensureCustomQuizTable(): Promise<void> {
  if (!ensureTablePromise) {
    ensureTablePromise = (async () => {
      await db.query(
        `CREATE TABLE IF NOT EXISTS custom_quizzes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          subject TEXT,
          questions JSONB NOT NULL DEFAULT '[]',
          attempt_count INTEGER NOT NULL DEFAULT 0,
          best_score DECIMAL(5,2),
          last_score DECIMAL(5,2),
          last_attempted_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`,
      );
      // A quiz can be shared with friends (challenge-style). Each row tracks
      // one recipient's access + their best score on the owner's quiz.
      await db.query(
        `CREATE TABLE IF NOT EXISTS custom_quiz_shares (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          quiz_id UUID REFERENCES custom_quizzes(id) ON DELETE CASCADE,
          owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          shared_with_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'PENDING',
          attempt_count INTEGER NOT NULL DEFAULT 0,
          best_score DECIMAL(5,2),
          last_score DECIMAL(5,2),
          last_attempted_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(quiz_id, shared_with_id)
        )`,
      );
      await db.query(
        `CREATE INDEX IF NOT EXISTS idx_custom_quiz_shares_shared_with
         ON custom_quiz_shares (shared_with_id)`,
      );
    })()
      .then(() => undefined)
      .catch((error) => {
        ensureTablePromise = null;
        throw error;
      });
  }
  return ensureTablePromise;
}

import type { ComputeProgressPointsInput } from "@/lib/gamification/award-progress-points";

/**
 * Points awarded for solving a custom quiz — mirrors past-paper attempt reward logic.
 */
export function computeQuizPoints(input: ComputeProgressPointsInput): number {
  return computeProgressPoints(input);
}

export interface QuizAccess {
  quiz: CustomQuiz;
  isOwner: boolean;
}

/**
 * Loads a quiz if the user is allowed to solve it — either the owner or
 * someone it has been shared with. Returns null when not found or no access.
 */
export async function getAccessibleQuiz(
  quizId: string,
  userId: string,
): Promise<QuizAccess | null> {
  const { rows } = await db.query(
    `SELECT cq.*
     FROM custom_quizzes cq
     WHERE cq.id = $1
       AND (
         cq.student_id = $2
         OR EXISTS (
           SELECT 1 FROM custom_quiz_shares s
           WHERE s.quiz_id = cq.id AND s.shared_with_id = $2
         )
       )`,
    [quizId, userId],
  );

  if (rows.length === 0) return null;

  const quiz = mapCustomQuizRow(rows[0] as never);
  return { quiz, isOwner: rows[0].student_id === userId };
}

/**
 * Validates a create/update payload. Returns a sanitized payload or throws
 * an Error with a user-facing message.
 */
export function validateCustomQuizPayload(body: unknown): CustomQuizPayload {
  const limits = CUSTOM_QUIZ_LIMITS;
  const payload = (body ?? {}) as Partial<CustomQuizPayload>;

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (!title) throw new Error("Quiz title is required");
  if (title.length > limits.TITLE_MAX) {
    throw new Error(`Quiz title must be at most ${limits.TITLE_MAX} characters`);
  }

  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";
  if (description.length > limits.DESCRIPTION_MAX) {
    throw new Error(`Description must be at most ${limits.DESCRIPTION_MAX} characters`);
  }

  const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
  if (subject.length > limits.SUBJECT_MAX) {
    throw new Error(`Subject must be at most ${limits.SUBJECT_MAX} characters`);
  }

  if (!Array.isArray(payload.questions) || payload.questions.length < limits.MIN_QUESTIONS) {
    throw new Error("Add at least one question");
  }
  if (payload.questions.length > limits.MAX_QUESTIONS) {
    throw new Error(`A quiz can have at most ${limits.MAX_QUESTIONS} questions`);
  }

  const questions: CustomQuizQuestion[] = payload.questions.map((question, index) => {
    const label = `Question ${index + 1}`;
    const text = typeof question?.text === "string" ? question.text.trim() : "";
    if (!text) throw new Error(`${label}: question text is required`);
    if (text.length > limits.QUESTION_TEXT_MAX) {
      throw new Error(`${label}: text must be at most ${limits.QUESTION_TEXT_MAX} characters`);
    }

    const rawOptions = Array.isArray(question?.options) ? question.options : [];
    if (rawOptions.length < limits.MIN_OPTIONS) {
      throw new Error(`${label}: add at least ${limits.MIN_OPTIONS} options`);
    }
    if (rawOptions.length > limits.MAX_OPTIONS) {
      throw new Error(`${label}: a question can have at most ${limits.MAX_OPTIONS} options`);
    }

    const options = rawOptions.map((option, optionIndex) => {
      const optionText = typeof option?.text === "string" ? option.text.trim() : "";
      if (!optionText) {
        throw new Error(`${label}: option ${optionIndex + 1} text is required`);
      }
      if (optionText.length > limits.OPTION_TEXT_MAX) {
        throw new Error(
          `${label}: options must be at most ${limits.OPTION_TEXT_MAX} characters`,
        );
      }
      const id =
        typeof option?.id === "string" && option.id.trim()
          ? option.id.trim()
          : `opt-${optionIndex + 1}`;
      return { id, text: optionText };
    });

    if (new Set(options.map((option) => option.id)).size !== options.length) {
      throw new Error(`${label}: option ids must be unique`);
    }

    const correctOptionId =
      typeof question?.correctOptionId === "string" ? question.correctOptionId : "";
    if (!options.some((option) => option.id === correctOptionId)) {
      throw new Error(`${label}: mark one option as the correct answer`);
    }

    const explanation =
      typeof question?.explanation === "string" ? question.explanation.trim() : "";
    if (explanation.length > limits.EXPLANATION_MAX) {
      throw new Error(`${label}: explanation must be at most ${limits.EXPLANATION_MAX} characters`);
    }

    const id =
      typeof question?.id === "string" && question.id.trim()
        ? question.id.trim()
        : `q-${index + 1}`;

    return {
      id,
      text,
      options,
      correctOptionId,
      ...(explanation ? { explanation } : {}),
    };
  });

  if (new Set(questions.map((question) => question.id)).size !== questions.length) {
    throw new Error("Question ids must be unique");
  }

  return {
    title,
    description: description || undefined,
    subject: subject || undefined,
    questions,
  };
}

interface CustomQuizRow {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  questions: CustomQuizQuestion[];
  attempt_count: number;
  best_score: string | null;
  last_score: string | null;
  last_attempted_at: string | null;
  created_at: string;
  updated_at: string;
}

function toNumberOrNull(value: string | number | null): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function mapCustomQuizRow(row: CustomQuizRow): CustomQuiz {
  const questions = Array.isArray(row.questions) ? row.questions : [];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    subject: row.subject,
    questions,
    questionCount: questions.length,
    attemptCount: row.attempt_count ?? 0,
    bestScore: toNumberOrNull(row.best_score),
    lastScore: toNumberOrNull(row.last_score),
    lastAttemptedAt: row.last_attempted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
