import { Class, Board, Subject } from "./enums";

export interface AdminCurriculum {
  id: string;
  class: string;
  board: string;
  subject: string;
  fileName: string;
  fileUrl: string;
  chaptersCount: number;
  createdAt: string;
  updatedAt: string;
}

export type AdminCurriculumSummary = Pick<
  AdminCurriculum,
  "id" | "class" | "board" | "subject" | "fileName" | "chaptersCount" | "createdAt"
> & {
  fileUrl?: string;
  updatedAt?: string;
};

export interface AdminCurriculumPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminCurriculumListData {
  curriculums: AdminCurriculumSummary[];
  pagination: AdminCurriculumPagination;
}

export interface AdminCurriculumFilters {
  class?: string;
  board?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Curriculum interface
 */
export interface Curriculum {
  id: string;
  class: Class;
  board: Board;
  subject: Subject;
  fileUrl: string;
  fileName: string;
  analyzedContent?: CurriculumAnalysis | null;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Curriculum Analysis (from AI)
 */
export interface CurriculumAnalysis {
  chapters: ChapterInfo[];
  summary?: string;
  extractedAt: Date;
}

/**
 * Chapter Information
 */
export interface ChapterInfo {
  chapterNumber?: number;
  chapterName: string;
  description?: string;
  learningObjectives?: string[];
}

/**
 * Past Paper interface
 */
export interface PastPaper {
  id: string;
  class: Class;
  board: Board;
  subject: Subject;
  year: number;
  paperNumber?: number;
  fileUrl: string;
  fileName: string;
  totalQuestions: number;
  status: PastPaperStatus;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Past Paper Status
 */
export enum PastPaperStatus {
  PENDING = "pending",
  ANALYZING = "analyzing",
  COMPLETED = "completed",
  FAILED = "failed",
}

/**
 * Question interface
 */
export interface Question {
  id: string;
  pastPaperId: string;
  questionNumber: number;
  questionPart?: string | null;
  questionText: string;
  questionType?: string;
  chapterId?: string | null;
  chapterName?: string | null;
  marks?: number | null;
  aiConfidence?: number | null;
  isVerified: boolean;
  verifiedBy?: string | null;
  imageUrl?: string | null;
  paperIIData?: {
    betterResponse?: string;
    weakerResponse?: string;
    type?: string;
  } | null;
  mcqData?: {
    options: Array<{ id: string; text: string }>;
    correctAnswer: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Chapter (from database)
 */
export interface Chapter {
  id: string;
  curriculumId: string;
  chapterNumber?: number | null;
  chapterName: string;
  description?: string | null;
  createdAt: Date;
}

/**
 * Upload Curriculum Request
 */
export interface UploadCurriculumRequest {
  class: Class;
  board: Board;
  subject: Subject;
  file: File;
}

/**
 * Upload Past Paper Request
 */
export interface UploadPastPaperRequest {
  class: Class;
  board: Board;
  subject: Subject;
  year: number;
  file: File;
}

/**
 * Question Review Data
 */
export interface QuestionReviewData {
  question: Question;
  availableChapters: Chapter[];
}

/**
 * Save Questions Request
 */
export interface SaveQuestionsRequest {
  pastPaperId: string;
  questions: Array<{
    questionNumber: number;
    questionText: string;
    questionType?: string;
    chapterId?: string | null;
    chapterName?: string | null;
  }>;
}
