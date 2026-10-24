/** Paper I timer: 1.77777777778 minutes (~106.67s) per MCQ. */
export const SECONDS_PER_QUESTION = 1.77777777778 * 60;
export const CRQ_SECONDS = 9 * 60;
export const ERQ_SECONDS = 12 * 60;

interface TimedQuestion {
  questionType?: string | null;
}

export function examDurationFromQuestionCount(
  questionCount: number,
  options?: { minSeconds?: number; maxSeconds?: number },
): number {
  const count = Math.max(0, Math.floor(questionCount));
  const raw = Math.round(count * SECONDS_PER_QUESTION);
  const min = options?.minSeconds ?? 0;
  const max = options?.maxSeconds ?? Number.POSITIVE_INFINITY;
  return Math.min(Math.max(raw, min), max);
}

/**
 * Paper II allows 5 minutes per CRQ and 10 minutes per ERQ.
 * Unknown Paper II question types receive the CRQ allowance.
 */
export function examDurationFromQuestions(
  questions: TimedQuestion[],
  options?: {
    paperType?: string | number;
    minSeconds?: number;
    maxSeconds?: number;
  },
): number {
  const isPaperTwo = String(options?.paperType) === "2";
  if (!isPaperTwo) {
    return examDurationFromQuestionCount(questions.length, options);
  }

  const raw = Math.round(questions.reduce((total, question) => {
    const questionType = question.questionType?.toUpperCase();
    return total + (questionType === "ERQ" ? ERQ_SECONDS : CRQ_SECONDS);
  }, 0));
  const min = options?.minSeconds ?? 0;
  const max = options?.maxSeconds ?? 2 * 60 * 60;

  return Math.min(Math.max(raw, min), max);
}
