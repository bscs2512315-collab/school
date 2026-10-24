export interface PastPaperSummary {
  id: string;
  class: string;
  subject: string;
  board: string;
  year: number;
  session: string | null;
  paperNumber: number;
  questionCount: number;
}

interface AdminPastPapersListResponse {
  pastPapers?: PastPaperSummary[];
}

export type AdminPastPapersApiData = PastPaperSummary[] | AdminPastPapersListResponse;

export interface AdminPastPaperPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminPastPaperListData {
  pastPapers: PastPaperSummary[];
  pagination: AdminPastPaperPagination;
  availableYears: number[];
}

export interface AdminPastPaperFilters {
  paperNumber?: number;
  class?: string;
  board?: string;
  subject?: string;
  year?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PastPaperQuestionOption {
  id: string;
  text: string;
}

export interface PastPaperQuestion {
  id: string;
  questionNumber: number;
  questionPart: string | null;
  questionText: string;
  questionType: string;
  chapterId?: string | null;
  chapterName?: string | null;
  marks?: number;
  mcqOptions?: PastPaperQuestionOption[];
  correctAnswer?: string | null;
  imageUrl?: string | null;
}

export interface PastPaperDetail {
  id: string;
  class: string;
  subject: string;
  board: string;
  year: number;
  paperNumber?: number;
  strictMode?: boolean;
  allowResume?: boolean;
  questions: PastPaperQuestion[];
}

interface AdminPastPaperDetailResponse {
  pastPaper?: PastPaperDetail;
}

export type AdminPastPaperDetailApiData = PastPaperDetail | AdminPastPaperDetailResponse;

export interface ReviewExamAttempt {
  id: string;
  student_name?: string;
  student_email?: string;
  subject: string;
  score?: number;
  total_marks?: number;
  grading_status: string;
  created_at: string;
}

export interface ReviewExamsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReviewExamsCounts {
  pending: number;
  graded: number;
  total: number;
}

export interface ReviewExamsFilters {
  status?: "pending" | "graded";
  page?: number;
  limit?: number;
}

export interface ReviewExamsListData {
  attempts: ReviewExamAttempt[];
  pagination: ReviewExamsPagination;
  counts: ReviewExamsCounts;
}

export interface ReviewExamQuestion {
  id: string;
  question_number: number;
  question_part: string | null;
  question_text: string;
  question_type: string;
  marks: number;
}

export interface ReviewExamDetailAttempt extends ReviewExamAttempt {
  answers_data?: string | Record<string, unknown>;
  paper_id?: string;
}

export interface ReviewExamDetailData {
  attempt: ReviewExamDetailAttempt;
  questions: ReviewExamQuestion[];
}

export interface AdminMilestone {
  id: number;
  level?: number;
  name: string;
  points_required: number;
  icon: string;
  color: string;
  bg_color: string;
}

import type { Chapter, Question } from "@/types/admin";

export interface PastPaperQuestionsData {
  questions: Question[];
  chapters: Chapter[];
}
