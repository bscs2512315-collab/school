import type { GeneratedPaper, GeneratePaperSubmitResult } from "@/hooks/student/useGeneratePaper";
import type { ChapterSloItem, ChapterSubtopicItem, GeneratePaperChapter } from "@/types/challenge";

export type GenerateStep = "mode" | "configure" | "chapters" | "attempt" | "result" | "pending";

export type GenerateMode = "past_papers" | "slos" | "custom" | "lightning";

export type PaperType = "1" | "2";

export type UploadStatus = "idle" | "uploading" | "uploaded" | "failed";

export interface UploadItem {
  id: string;
  file: File | null;
  previewUrl: string | null;
  imageUrl: string | null;
  status: UploadStatus;
}

export interface UploadState {
  status: UploadStatus;
  imageUrl: string | null;
  imageUrls?: string[];
  previewUrl: string | null;
  previewUrls?: string[];
  file: File | null;
  files?: UploadItem[];
}

export interface GenerateCurriculum {
  id: string;
  class: string;
  board: string;
  subject: string;
  chaptersCount: number;
}

export interface PersistedExamData {
  paperType: PaperType;
  subject: string;
  userClass: string;
  userBoard: string;
  generatedPaper: GeneratedPaper;
  mcqAnswers?: Record<string, string>;
  uploads?: Record<string, UploadState>;
  timeLeft?: number;
  currentQuestionIndex?: number;
  autoResume?: boolean;
}

export type {
  GeneratedPaper,
  GeneratePaperSubmitResult,
  GeneratePaperChapter,
  ChapterSloItem,
  ChapterSubtopicItem,
};

