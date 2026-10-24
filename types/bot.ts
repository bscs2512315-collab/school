export enum BOT_SOURCE_TYPE {
  SYLLABUS_SLO = "syllabus_slo",
  PAST_PAPER_MCQ = "past_paper_mcq",
  PAST_PAPER_P2 = "past_paper_p2",
  ADMIN_FAQ = "admin_faq",
}

export enum BOT_QUERY_INTENT {
  SYLLABUS_CONCEPT = "syllabus_concept",
  PAST_PAPER_HELP = "past_paper_help",
  EXAM_TECHNIQUE = "exam_technique",
  PAPER2_WRITING = "paper2_writing",
  OFF_TOPIC = "off_topic",
  ACADEMIC_DISHONESTY = "academic_dishonesty",
}

export interface BotKnowledgeChunk {
  id: string;
  sourceType: BOT_SOURCE_TYPE;
  sourceId: string | null;
  board: string | null;
  class: string | null;
  subject: string | null;
  chapterId: string | null;
  title: string | null;
  content: string;
  metadata: Record<string, unknown>;
}

export interface ChatSource {
  chunkId: string;
  sourceType: string;
  title: string;
  label: string;
}

export interface ChatPaperAction {
  type: "generate_paper";
  label: string;
  paperType: 1 | 2;
  subject: string;
  classLevel: string;
  board: string;
  chapterIds: string[];
  chapterLabel: string;
  questionCount?: number;
  /** true = syllabus SLOs; false = past paper bank */
  useSlos?: boolean;
  difficulty?: "Alpha" | "Beta" | "Gamma";
}

export interface ChatImagePaperAction {
  type: "generate_paper_from_image";
  label: string;
  paperType: 1 | 2;
  questionCount?: number;
  /** Optional — client may re-send last uploaded image URL */
  imageUrl?: string;
  difficulty?: "Alpha" | "Beta" | "Gamma";
  userPrompt?: string;
}

export interface ChatSubjectChip {
  type: "subject_chip";
  label: string;
  message: string;
}

export interface ChatClassChip {
  type: "class_chip";
  label: string;
  message: string;
}

export interface ChatPaperTypeChip {
  type: "paper_type_chip";
  label: string;
  message: string;
}

export interface ChatPaperSourceChip {
  type: "paper_source_chip";
  label: string;
  message: string;
}

export interface ChatChapterChip {
  type: "chapter_chip";
  label: string;
  message: string;
  chapterId?: string;
  chapterNumber?: number | null;
  chapterName?: string;
}

export interface ChatDifficultyChip {
  type: "difficulty_chip";
  label: string;
  message: string;
  difficulty: "Alpha" | "Beta" | "Gamma";
}

export interface ChatQuestionCountChip {
  type: "question_count_chip";
  label: string;
  message: string;
}

export interface ChatPracticeModeChip {
  type: "practice_mode_chip";
  label: string;
  message: string;
}

export interface ChatChallengeTypeChip {
  type: "challenge_type_chip";
  label: string;
  message: string;
}

export interface ChatNavigateAction {
  type: "navigate";
  label: string;
  href: string;
}

export type ChatAction =
  | ChatPaperAction
  | ChatImagePaperAction
  | ChatSubjectChip
  | ChatClassChip
  | ChatPaperTypeChip
  | ChatPaperSourceChip
  | ChatChapterChip
  | ChatDifficultyChip
  | ChatQuestionCountChip
  | ChatPracticeModeChip
  | ChatChallengeTypeChip
  | ChatNavigateAction;

export function isChatPaperAction(action: ChatAction): action is ChatPaperAction {
  return action.type === "generate_paper";
}

export function isChatImagePaperAction(
  action: ChatAction,
): action is ChatImagePaperAction {
  return action.type === "generate_paper_from_image";
}

export interface BotSettings {
  systemPrompt: string;
  refusalMessage: string;
  maxTokens: number;
  temperature: number;
  topKChunks: number;
  rateLimitPerHour: number;
}

export interface PaperIIExemplar {
  id: string;
  questionNumber: number;
  questionPart: string | null;
  questionText: string;
  questionType: string | null;
  chapterName: string | null;
  marks: number | null;
  board: string;
  class: string;
  subject: string;
  year: number;
  paperIIData: {
    betterResponse?: string;
    weakerResponse?: string;
    botApproved?: boolean;
    markingNotes?: string;
  } | null;
}
