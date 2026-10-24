export interface StudentMe {
  id: string;
  name: string;
  email: string;
  class: string | null;
  schoolName: string | null;
  points: number;
  role: string;
  rank: string;
  profileImage: string | null;
}

export interface StudentHistoryItem {
  id: string;
  paper_id: string | null;
  teacher_paper_id?: string | null;
  title?: string;
  subject: string;
  score: number;
  total_marks: number;
  time_taken: number;
  created_at: string;
  grading_status: string;
  paper_type: string;
  classroom_id?: string | null;
  attempt_number?: number;
}

export interface StudentCurriculum {
  id: string;
  class: string;
  board: string;
  subject: string;
  chaptersCount: number;
  fileName?: string;
  createdAt?: string;
}

export interface StudentCurriculumChapter {
  id: string;
  chapterNumber: number;
  chapterName: string;
  isAnalyzed: boolean;
  analyzedContent?: {
    subtopics?: unknown[];
  };
  exercises?: Array<{
    id: string;
    chapterNumber: number;
    exerciseNumber: string;
    title: string;
    pageCount: number;
    questionCount?: number | null;
    thumbnailUrl?: string | null;
    solutionVideoUrl?: string | null;
  }>;
  exercisesCount?: number;
}

export interface StudentCurriculumDetail {
  id: string;
  class: string;
  board: string;
  subject: string;
  chaptersCount: number;
  chapters: StudentCurriculumChapter[];
}

export interface StudentHistoryDetail {
  id: string;
  paper_id: string | null;
  teacher_paper_id?: string | null;
  title?: string;
  subject: string;
  score: number | null;
  total_marks: number;
  time_taken: number;
  answers_data: string | Record<string, unknown>;
  created_at: string;
  images_archived_at?: string | null;
  paper_type?: string;
  grading_status?: string;
  classroom_id?: string | null;
  paperDetails: {
    year?: number | string | null;
    board?: string | null;
    class_level?: string | null;
    paper_number: number;
  };
}

export interface StudentMilestone {
  id: string;
  name: string;
  description?: string;
  points_required: number;
  icon?: string;
  unlocked: boolean;
  progress: string;
  [key: string]: unknown;
}
