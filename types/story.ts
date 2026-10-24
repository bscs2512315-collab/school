export interface CharacterProfile {
  id: string;
  name: string;
  title: string;
  avatarUrl?: string;
  voiceGender: "male" | "female";
  voiceTone: string;
  visualDescription: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface SLOCheckpoint {
  id: string;
  sloId: string;
  sloText: string;
  sceneIndex: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  boardExamMarks: number;
  boardExamTip: string;
}

export interface ProductionAssetPrompts {
  imagePrompt: string;
  negativePrompt?: string;
  cameraMovement: string;
  voicePrompt: {
    actorName: string;
    emotion: string;
    speed: number;
    pitch: number;
  };
  lipsyncParams: {
    engine: "hedra-character-1" | "live-portrait" | "synclabs";
    headMovement: "subtle" | "expressive" | "authoritative";
    blinkRate: "normal" | "frequent";
  };
}

export interface StoryScene {
  id: string;
  sceneNumber: number;
  title: string;
  durationSeconds: number;
  settingDescription: string;
  backgroundTheme: "historical_day" | "historical_night" | "palace_interior" | "monument" | "geographic_mountains" | "classroom";
  backgroundImageUrl?: string;
  character: CharacterProfile;
  characterAction: string;
  dialogueEnglish: string;
  dialogueUrdu: string;
  historicalContextNote: string;
  examKeyPoint: string;
  soundEffect?: string;
  backgroundMusicMood: "inspirational" | "tense" | "celebratory" | "patriotic" | "thoughtful";
  checkpoint?: SLOCheckpoint;
  productionPrompts: ProductionAssetPrompts;
}

export interface StoryEpisode {
  id: string;
  title: string;
  urduTitle: string;
  chapterNumber: number;
  chapterName: string;
  subject: string;
  targetGrade: string;
  sloIds: string[];
  sloSummary: string;
  totalDurationSeconds: number;
  synopsis: string;
  videoUrl?: string;
  scenes: StoryScene[];
  keyHistoricalDates: { date: string; event: string }[];
  examQuestionsCovered: {
    marks: number;
    question: string;
    sloCode: string;
  }[];
}

export interface GenerateStoryRequest {
  topicOrSlo: string;
  chapterName?: string;
  grade?: string;
  languageMode?: "bilingual" | "english" | "urdu";
  sceneCount?: number;
}
