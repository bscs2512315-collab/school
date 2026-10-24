import type { CustomQuizQuestion } from "@/types/custom-quiz";

/**
 * Parses pasted plain-text into custom quiz questions.
 *
 * Supported shape (whitespace/case tolerant):
 *
 *   Q1: What is a cursor?
 *   A- A programming language
 *   B) React library
 *   C. Framework
 *   D: AI powered IDE
 *   Correct Option: D
 *   Explanation: Cursor is an AI-first IDE.   (optional)
 *
 * Question lines may start with `Q1:`, `1.`, `1)`, or just text followed by
 * options. Option markers accept `A-`, `A)`, `A.`, `A:`. The answer line
 * accepts `Correct Option`, `Correct Answer`, `Answer`, `Ans`, `Correct`
 * followed by a letter (A–H) or the full option text. Scientific notation
 * tokens like `(subscript=2)`, `^2`, and Greek symbols are preserved verbatim.
 */

const LETTERS = "ABCDEFGH";

const QUESTION_LINE = /^\s*(?:Q\s*)?(\d+)\s*[.):-]\s*(.*)$/i;
const OPTION_LINE = /^\s*\(?([A-H])\)?\s*[-.):]\s*(.+)$/;
const ANSWER_LINE =
  /^\s*(?:correct\s*option|correct\s*answer|correct|answer|ans)\s*[:.\-)]?\s*(.+)$/i;
const EXPLANATION_LINE = /^\s*(?:explanation|reason|why)\s*[:.\-)]?\s*(.+)$/i;

interface ParsedDraftQuestion {
  text: string;
  options: string[];
  answerRaw: string | null;
  explanation: string | null;
}

export interface ParseQuizResult {
  questions: CustomQuizQuestion[];
  errors: string[];
}

function makeId(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}

function resolveCorrectOption(
  answerRaw: string,
  options: string[],
): number {
  const trimmed = answerRaw.trim();

  // Single letter answer, e.g. "D" or "(D)"
  const letterMatch = trimmed.match(/^\(?([A-H])\)?[.):]?\s*$/i);
  if (letterMatch) {
    const idx = LETTERS.indexOf(letterMatch[1].toUpperCase());
    if (idx >= 0 && idx < options.length) return idx;
  }

  // Leading letter then text, e.g. "D- AI Powered IDE"
  const leadingLetter = trimmed.match(/^\(?([A-H])\)?\s*[-.):]\s*(.+)$/i);
  if (leadingLetter) {
    const idx = LETTERS.indexOf(leadingLetter[1].toUpperCase());
    if (idx >= 0 && idx < options.length) return idx;
  }

  // Match by full option text (case-insensitive)
  const byText = options.findIndex(
    (opt) => opt.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (byText >= 0) return byText;

  return -1;
}

function flushQuestion(
  draft: ParsedDraftQuestion,
  order: number,
  errors: string[],
): CustomQuizQuestion | null {
  const label = `Question ${order}`;

  if (!draft.text.trim()) {
    errors.push(`${label}: missing question text`);
    return null;
  }
  if (draft.options.length < 2) {
    errors.push(`${label}: needs at least 2 options`);
    return null;
  }
  if (!draft.answerRaw) {
    errors.push(`${label}: missing "Correct Option" line`);
    return null;
  }

  const correctIndex = resolveCorrectOption(draft.answerRaw, draft.options);
  if (correctIndex < 0) {
    errors.push(
      `${label}: could not match correct answer "${draft.answerRaw.trim()}" to an option`,
    );
    return null;
  }

  const options = draft.options.map((text, index) => ({
    id: makeId(`q${order}-opt`, index + 1),
    text: text.trim(),
  }));

  return {
    id: makeId("q", order),
    text: draft.text.trim(),
    options,
    correctOptionId: options[correctIndex].id,
    ...(draft.explanation ? { explanation: draft.explanation.trim() } : {}),
  };
}

export function parseQuizText(input: string): ParseQuizResult {
  const errors: string[] = [];
  const questions: CustomQuizQuestion[] = [];

  if (!input.trim()) {
    return { questions, errors: ["Paste some text to generate questions."] };
  }

  const lines = input.replace(/\r\n/g, "\n").split("\n");

  let current: ParsedDraftQuestion | null = null;
  let order = 0;

  const commit = () => {
    if (!current) return;
    order += 1;
    const parsed = flushQuestion(current, order, errors);
    if (parsed) questions.push(parsed);
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;

    const optionMatch = line.match(OPTION_LINE);
    const answerMatch = line.match(ANSWER_LINE);
    const explanationMatch = line.match(EXPLANATION_LINE);
    const questionMatch = line.match(QUESTION_LINE);

    // Answer / explanation take priority so an option-looking answer such as
    // "Answer: A" is not mistaken for an option.
    if (answerMatch && current) {
      current.answerRaw = answerMatch[1];
      continue;
    }

    if (explanationMatch && current) {
      current.explanation = explanationMatch[1];
      continue;
    }

    if (optionMatch && current && !current.answerRaw) {
      current.options.push(optionMatch[2]);
      continue;
    }

    if (questionMatch) {
      commit();
      current = {
        text: questionMatch[2],
        options: [],
        answerRaw: null,
        explanation: null,
      };
      continue;
    }

    // A non-marker line: start a new question if none is open or the current
    // one already has options; otherwise treat as a wrapped question line.
    if (!current || current.options.length > 0 || current.answerRaw) {
      commit();
      current = { text: line.trim(), options: [], answerRaw: null, explanation: null };
    } else {
      current.text = current.text ? `${current.text} ${line.trim()}` : line.trim();
    }
  }

  commit();

  if (questions.length === 0 && errors.length === 0) {
    errors.push("No questions found. Check the format and try again.");
  }

  return { questions, errors };
}

export const PASTE_QUIZ_EXAMPLE = `Q1: What is Cursor?
A- A programming language
B- React library
C- A framework
D- An AI-powered IDE
Correct Option: D
Explanation: Cursor is an AI-first code editor.

Q2: The chemical formula for water is H(subscript=2)O. How many hydrogen atoms are present?
A- 1
B- 2
C- 3
Correct Option: B`;
