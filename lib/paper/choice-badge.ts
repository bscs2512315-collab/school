interface QuestionLike {
  questionNumber?: number | string | null;
  questionPart?: string | null;
}

function formatQuestionBadgeNum(
  q: QuestionLike,
  fallbackIdx: number,
  isSindh: boolean,
): string {
  if (isSindh) return String(fallbackIdx + 1);
  const part = (q.questionPart || "").replace(/\s*OR\s*/i, "").trim();
  return `${q.questionNumber ?? fallbackIdx + 1}${part}`;
}

/**
 * Returns a user-friendly choice label when questions form an OR pair (e.g. "Attempt Q16 OR Q17" or "Attempt Q10 OR Q11").
 * Both questions in the pair receive the exact same label.
 */
export function getChoiceBadgeLabel(
  questions: QuestionLike[] | undefined | null,
  idx: number,
  isSindh: boolean,
): string | null {
  if (!questions || idx < 0 || idx >= questions.length) return null;

  const curr = questions[idx];
  if (!curr) return null;

  const prev = questions[idx - 1];
  const next = questions[idx + 1];

  const currPart = (curr.questionPart || "").toUpperCase();
  const nextPart = next ? (next.questionPart || "").toUpperCase() : "";

  const currIsOr = currPart.includes("OR");
  const nextIsOr = nextPart.includes("OR");

  // Case 1: curr has "OR" -> paired with prev question
  if (currIsOr && prev) {
    const q1 = formatQuestionBadgeNum(prev, idx - 1, isSindh);
    const q2 = formatQuestionBadgeNum(curr, idx, isSindh);
    return `Attempt Q${q1} OR Q${q2}`;
  }

  // Case 2: next has "OR" -> curr is paired with next question
  if (next && nextIsOr && (next.questionNumber === curr.questionNumber || !next.questionNumber || isSindh)) {
    const q1 = formatQuestionBadgeNum(curr, idx, isSindh);
    const q2 = formatQuestionBadgeNum(next, idx + 1, isSindh);
    return `Attempt Q${q1} OR Q${q2}`;
  }

  return null;
}
