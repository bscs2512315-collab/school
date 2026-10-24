"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiPost } from "@/lib/api/api-client";
import { useApiMutation } from "@/hooks/api/useApiMutation";
import type { GeneratePaperChapter } from "@/types/challenge";
import type { GenerateMode } from "@/types/generate";

export interface GeneratedPaperQuestion {
  id: string;
  questionNumber: number;
  questionPart: string | null;
  questionText: string;
  questionType: string;
  marks: number;
  chapterName: string | null;
  imageUrl?: string | null;
  correctAnswer?: string | null;
  mcqOptions?: Array<{ id: string; text: string }>;
}

export interface GeneratedPaper {
  generatedPaperId: string;
  paperType: number;
  subject: string;
  classLevel: string;
  board: string;
  totalMarks: number;
  totalQuestions: number;
  questions: GeneratedPaperQuestion[];
}

export interface GeneratePaperPayload {
  userId?: string;
  subject: string;
  classLevel: string;
  board: string;
  paperType: number | string;
  chapterIds?: string[];
  sloNumbers?: string[];
  mode?: GenerateMode;
  title?: string;
  prompt?: string;
  imageUrls?: string[];
  manualQuestions?: any[];
  questionCount?: number;
  difficulty?: "Alpha" | "Beta" | "Gamma";
  isPublic?: boolean;
}

export interface GeneratePaperSubmitResult {
  score: number;
  totalMarks: number;
  percentage: number;
  pointsAwarded: number;
  questionResults: Record<
    string,
    { correct: boolean; correctAnswer: string | null; selectedAnswer: string | null }
  >;
}

interface SubmitGeneratedPaperPayload {
  userId?: string;
  generatedPaperId: string;
  paperType: number;
  subject: string;
  answers: Record<string, unknown>;
  timeTaken: number;
}

export function useGeneratePaper() {
  return useApiMutation<GeneratedPaper, GeneratePaperPayload>({
    mutationFn: (payload) => apiPost<GeneratedPaper>(API_ENDPOINTS.STUDENT.GENERATE_PAPER, payload),
  });
}

export function useSubmitGeneratedPaper() {
  return useApiMutation<GeneratePaperSubmitResult, SubmitGeneratedPaperPayload>({
    mutationFn: (payload) =>
      apiPost<GeneratePaperSubmitResult>(API_ENDPOINTS.STUDENT.GENERATE_PAPER_SUBMIT, payload),
  });
}

export type { GeneratePaperChapter };
