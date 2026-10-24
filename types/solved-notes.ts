export interface SolvedExercise {
  id: string;
  chapterId?: string | null;
  curriculumId: string;
  board: string;
  class: string;
  subject: string;
  chapterNumber: number;
  exerciseNumber: string;
  title: string;
  pageCount: number;
  questionCount?: number | null;
  thumbnailUrl?: string | null;
  solutionVideoUrl?: string | null;
  sourceCredit?: string | null;
  createdAt: string;
  chapterName?: string | null;
  isAvailable?: boolean;
  isLocked?: boolean;
  cognitiveLevel?: string | null;
}

export interface SolvedExerciseAdjacent {
  id: string;
  chapterNumber: number;
  exerciseNumber: string;
  title: string;
}

export interface SolvedExerciseDetail extends SolvedExercise {
  imageUrls: string[];
  prevExercise?: SolvedExerciseAdjacent | null;
  nextExercise?: SolvedExerciseAdjacent | null;
  chapterExercises?: SolvedExerciseAdjacent[];
}

export interface SolvedNotesStats {
  totalExercises: number;
  availableCount?: number;
  lockedCount?: number;
  totalQuestions: number;
  totalPages: number;
  totalChapters: number;
}

export interface SolvedNotesListResponse {
  exercises: SolvedExercise[];
  stats: SolvedNotesStats;
}
