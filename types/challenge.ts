import type { GenerateMode } from "@/types/generate";

export interface ChallengeSummary {
  id: string;
  subject: string;
  classLevel: string;
  board: string;
  paperType: number;
  status: string;
  createdAt: string;
  startedAt: string | null;
  creatorName: string;
  creatorUsername: string | null;
  creatorImage: string | null;
  isCreator: boolean;
  myStatus: string;
  totalParticipants: number;
  acceptedCount: number;
  completedCount: number;
}

export interface ChallengeParticipant {
  userId: string;
  name: string;
  username: string;
  profileImage: string | null;
  status: string;
  score: number | null;
  totalMarks: number | null;
  percentage: number | null;
  timeTaken: number | null;
}

export interface ChallengeQuestion {
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

export interface ChallengeDetail {
  id: string;
  subject: string;
  classLevel: string;
  board: string;
  paperType: number;
  status: string;
  createdAt: string;
  startedAt: string | null;
  myStartedAt: string | null;
  maxWaitMinutes: number;
  creatorName: string;
  creatorUsername: string | null;
  creatorImage: string | null;
  isCreator: boolean;
  myStatus: string;
  paper: {
    generatedPaperId: string;
    totalQuestions: number;
    totalMarks: number;
    questions: ChallengeQuestion[];
  } | null;
  participants: ChallengeParticipant[];
}

export interface ChallengeSubmitResult {
  score: number;
  totalMarks: number;
  percentage: number;
  pointsAwarded: number;
  questionResults: Record<
    string,
    { correct: boolean; selectedAnswer: string; correctAnswer: string }
  >;
}

export interface ChapterSloItem {
  sloNumber: string;
  sloText: string;
  cognitiveLevel: string;
  subtopicNumber?: string;
  subtopicName?: string;
}

export interface ChapterSubtopicItem {
  subtopicNumber: string;
  subtopicName: string;
  slos: ChapterSloItem[];
}

export interface GeneratePaperChapter {
  id: string;
  chapterNumber: number;
  chapterName: string;
  questionCount: number;
  subtopics?: ChapterSubtopicItem[];
  slos?: ChapterSloItem[];
  totalSlos?: number;
}

interface CreateChallengePayload {
  subject: string;
  classLevel: string;
  board: string;
  paperType: string;
  chapterIds?: string[];
  sloNumbers?: string[];
  inviteUsernames: string[];
  mode?: GenerateMode;
  prompt?: string;
  imageUrls?: string[];
}

interface CreateChallengeResponse {
  challengeId: string;
}

export type { CreateChallengePayload, CreateChallengeResponse };

