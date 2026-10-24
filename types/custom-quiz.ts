/**
 * Types for the student custom quiz feature.
 */

export interface CustomQuizOption {
  id: string;
  text: string;
}

export interface CustomQuizQuestion {
  id: string;
  text: string;
  options: CustomQuizOption[];
  correctOptionId: string;
  explanation?: string;
}

export interface CustomQuizSummary {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  questionCount: number;
  attemptCount: number;
  bestScore: number | null;
  lastScore: number | null;
  lastAttemptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomQuiz extends CustomQuizSummary {
  questions: CustomQuizQuestion[];
}

export interface CustomQuizPayload {
  title: string;
  description?: string;
  subject?: string;
  questions: CustomQuizQuestion[];
}

export interface CustomQuizQuestionResult {
  questionId: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean;
}

export interface CustomQuizAttemptResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  bestScore: number;
  pointsAwarded: number;
  results: CustomQuizQuestionResult[];
}

export interface CustomQuizDetail extends CustomQuiz {
  isOwner: boolean;
}

/** A quiz shared with the current student by a friend. */
export interface SharedCustomQuiz extends CustomQuizSummary {
  ownerName: string;
  ownerUsername: string | null;
  ownerImage: string | null;
  shareStatus: string;
}

export interface QuizShareResult {
  invited: string[];
  notFound: string[];
  alreadyShared: string[];
}
