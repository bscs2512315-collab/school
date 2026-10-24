export interface QuestionBankPastPaper {
  class: string;
  board: string;
  subject: string;
  year: number;
  fileName: string;
  paperNumber?: number;
}

export interface QuestionBankItem {
  id: string;
  pastPaperId: string;
  questionNumber: number;
  questionPart: string | null;
  questionText: string;
  questionType: string | null;
  chapterId: string | null;
  chapterName: string | null;
  marks?: number | null;
  mcqOptions: Array<{ id: string; text: string }> | null;
  correctAnswer: string | null;
  imageUrl?: string | null;
  paperIIData?: {
    betterResponse?: string;
    weakerResponse?: string;
    markingNotes?: string;
    botApproved?: boolean;
  } | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  pastPaper: QuestionBankPastPaper;
}

export interface QuestionBankPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface QuestionBankData {
  questions: QuestionBankItem[];
  pagination: QuestionBankPagination;
}

export interface QuestionBankFilters {
  class?: string;
  board?: string;
  subject?: string;
  questionType?: string;
  paperNumber?: number;
  chapterName?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface QuestionBankChapter {
  name: string;
  count: number;
}

export interface QuestionBankChaptersData {
  chapters: QuestionBankChapter[];
}

export interface QuestionBankFacet {
  class: string;
  subject: string;
  paperNumber: number;
  count: number;
}

export interface QuestionBankSummary {
  facets: QuestionBankFacet[];
}
