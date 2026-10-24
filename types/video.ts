export type VideoVisibility = "public" | "unlisted" | "draft";

export interface VideoCaption {
  id: string;
  language: "English" | "Urdu" | "Bilingual";
  label: string;
  text?: string;
  srtUrl?: string;
}

export interface VideoKeyMoment {
  timeSeconds: number;
  formattedTime: string; // e.g. "02:30"
  title: string;
  description?: string;
}

export interface AdminVideo {
  id: string;
  title: string;
  urduTitle?: string;
  description: string;
  videoUrl: string;
  videoType: "upload" | "url" | "embed";
  fileSize?: string;
  durationSeconds: number;
  formattedDuration: string; // e.g. "14:20"
  thumbnailUrl: string;
  subject: string;
  grade: string;
  chapterNumber?: number;
  chapterName?: string;
  sloTags: string[];
  captions: VideoCaption[];
  keyMoments: VideoKeyMoment[];
  visibility: VideoVisibility;
  views: number;
  likes: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_CURATED_VIDEOS: AdminVideo[] = [
  {
    id: "vid-pak-studies-1940",
    title: "The Lahore Resolution 1940: Complete Historic & Constitutional Analysis",
    urduTitle: "قراردادِ لاہور ۱۹۴۰ — پس منظر، نکات اور تاریخی اہمیت",
    description:
      "A comprehensive board-exam focused breakdown of the Lahore Resolution (March 23, 1940). Covers key historical context from 1937–39 Congress ministries, the 27-point charter drafted by the Muslim League working committee, Fazl-ul-Haq's presentation at Minto Park, and Quaid-e-Azam's presidential address.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    videoType: "url",
    fileSize: "48.5 MB",
    durationSeconds: 765,
    formattedDuration: "12:45",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=1280&q=80",
    subject: "Pakistan Studies",
    grade: "Class 9 & 10 (Matric & O-Level)",
    chapterNumber: 4,
    chapterName: "The Pakistan Movement (1940–1947)",
    sloTags: ["SLO 4.1", "SLO 4.2", "Board Exam 2026", "5-Mark Question"],
    captions: [
      {
        id: "cap-1",
        language: "English",
        label: "English (Automated)",
        text: "00:00:00,000 --> 00:00:05,000\nWelcome to Pakistan Studies Chapter 4: The 1940 Resolution.\n\n00:00:05,500 --> 00:00:12,000\nToday we analyze the 27-point charter and Quaid-e-Azam's landmark presidential address.",
      },
      {
        id: "cap-2",
        language: "Urdu",
        label: "اردو (Urdu)",
        text: "00:00:00,000 --> 00:00:05,000\nپاکستان اسٹڈیز باب چہارم میں خوش آمدید: قراردادِ لاہور ۱۹۴۰۔",
      },
    ],
    keyMoments: [
      { timeSeconds: 0, formattedTime: "00:00", title: "Introduction & Congress Ministries Backstory" },
      { timeSeconds: 145, formattedTime: "02:25", title: "Working Committee Draft & Key Clauses" },
      { timeSeconds: 380, formattedTime: "06:20", title: "Quaid-e-Azam's Historic Presidential Address" },
      { timeSeconds: 590, formattedTime: "09:50", title: "Board Exam Model Answers (4 & 8 Marks)" },
    ],
    visibility: "public",
    views: 1420,
    likes: 185,
    commentsCount: 24,
    createdAt: "2026-09-20T14:30:00Z",
    updatedAt: "2026-09-24T18:15:00Z",
  },
  {
    id: "vid-physics-newton-laws",
    title: "Newton's Laws of Motion & Momentum Conservation with Real-Life Demonstrations",
    urduTitle: "حرکت کے قوانین اور مومینٹم کا تحفظ",
    description:
      "Deep dive into Newton's First, Second, and Third Laws of Motion with free-body diagrams, derivation of F = ma, momentum conservation in collisions, and AKUEB board exam numerical solutions.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    videoType: "url",
    fileSize: "72.1 MB",
    durationSeconds: 1100,
    formattedDuration: "18:20",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=1280&q=80",
    subject: "Physics",
    grade: "Class 9 & 10 (Matric & O-Level)",
    chapterNumber: 3,
    chapterName: "Dynamics & Laws of Motion",
    sloTags: ["SLO 3.1", "SLO 3.3", "Physics Numericals", "Derivation"],
    captions: [
      {
        id: "cap-3",
        language: "English",
        label: "English Subtitles",
        text: "00:00:00,000 --> 00:00:06,000\nUnderstanding Newton's laws through vectors and free body diagrams.",
      },
    ],
    keyMoments: [
      { timeSeconds: 0, formattedTime: "00:00", title: "Inertia and Newton's First Law" },
      { timeSeconds: 260, formattedTime: "04:20", title: "Derivation of F = ma & Impulse" },
      { timeSeconds: 610, formattedTime: "10:10", title: "Newton's 3rd Law & Action-Reaction Pairs" },
      { timeSeconds: 890, formattedTime: "14:50", title: "Past Paper Numerical Step-by-Step" },
    ],
    visibility: "public",
    views: 2890,
    likes: 310,
    commentsCount: 42,
    createdAt: "2026-09-18T10:00:00Z",
    updatedAt: "2026-09-23T11:20:00Z",
  },
  {
    id: "vid-bio-photosynthesis",
    title: "Bioenergetics: Light & Dark Reactions of Photosynthesis (Calvin Cycle)",
    urduTitle: "بائیو انرجیٹکس — فوٹوسنتھیسس کے نوری اور غیر نوری ردعمل",
    description:
      "Detailed 3D animated walkthrough of chloroplast structure, thylakoid membrane electron transport chain, ATP synthesis via chemiosmosis, and the RuBisCO enzyme in the Calvin cycle.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    videoType: "url",
    fileSize: "55.4 MB",
    durationSeconds: 850,
    formattedDuration: "14:10",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&w=1280&q=80",
    subject: "Biology",
    grade: "Class 11 & 12 (Inter & A-Level)",
    chapterNumber: 7,
    chapterName: "Bioenergetics & Cellular Energy",
    sloTags: ["SLO 7.2", "Calvin Cycle", "Light Reactions", "Diagrams"],
    captions: [
      {
        id: "cap-4",
        language: "English",
        label: "English Subtitles",
        text: "00:00:00,000 --> 00:00:05,000\nPhotolysis of water and photon absorption in Photosystem II.",
      },
    ],
    keyMoments: [
      { timeSeconds: 0, formattedTime: "00:00", title: "Chloroplast Ultrastructure & Pigments" },
      { timeSeconds: 210, formattedTime: "03:30", title: "Z-Scheme & Electron Transport Chain" },
      { timeSeconds: 520, formattedTime: "08:40", title: "Carbon Fixation & Calvin-Benson Cycle" },
    ],
    visibility: "public",
    views: 940,
    likes: 120,
    commentsCount: 16,
    createdAt: "2026-09-15T09:15:00Z",
    updatedAt: "2026-09-22T14:40:00Z",
  },
  {
    id: "vid-math-quadratic-roots",
    title: "Quadratic Equations: Nature of Roots, Discriminant & Word Problems",
    urduTitle: "دو درجی مساوات — روٹس کی نوعیت اور فرق کنندہ کا فارمولا",
    description:
      "Master quadratic formulas, discriminant analysis (D > 0, D = 0, D < 0), sum and product of roots, and solve difficult board exam word problems in geometry and speed-distance.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    videoType: "url",
    fileSize: "83.2 MB",
    durationSeconds: 1265,
    formattedDuration: "21:05",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1280&q=80",
    subject: "Mathematics",
    grade: "Class 9 & 10 (Matric & O-Level)",
    chapterNumber: 2,
    chapterName: "Theory of Quadratic Equations",
    sloTags: ["SLO 2.1", "SLO 2.4", "Discriminant", "Past Papers"],
    captions: [
      {
        id: "cap-5",
        language: "English",
        label: "English Subtitles",
        text: "00:00:00,000 --> 00:00:06,000\nCalculating the discriminant b^2 - 4ac and testing real vs complex roots.",
      },
    ],
    keyMoments: [
      { timeSeconds: 0, formattedTime: "00:00", title: "Standard Form & Quadratic Formula Review" },
      { timeSeconds: 340, formattedTime: "05:40", title: "The Discriminant (b² - 4ac) & 4 Cases" },
      { timeSeconds: 780, formattedTime: "13:00", title: "Sum and Product of Roots Relationship" },
      { timeSeconds: 1050, formattedTime: "17:30", title: "Board Exam Word Problem Walkthrough" },
    ],
    visibility: "public",
    views: 3150,
    likes: 420,
    commentsCount: 58,
    createdAt: "2026-09-10T11:00:00Z",
    updatedAt: "2026-09-25T08:30:00Z",
  },
  {
    id: "vid-chem-periodic-trends",
    title: "Periodic Trends: Atomic Radii, Ionization Energy & Electronegativity (Draft)",
    urduTitle: "پیریوڈک جدول کے رجحانات",
    description:
      "Periodic table group and period trends explained with nuclear charge, shielding effect, and noble gas electron configurations.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    videoType: "url",
    fileSize: "39.0 MB",
    durationSeconds: 570,
    formattedDuration: "09:30",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1280&q=80",
    subject: "Chemistry",
    grade: "Class 9 & 10 (Matric & O-Level)",
    chapterNumber: 3,
    chapterName: "Periodic Table and Periodicity of Properties",
    sloTags: ["SLO 3.2", "Electronegativity", "Draft"],
    captions: [],
    keyMoments: [
      { timeSeconds: 0, formattedTime: "00:00", title: "Effective Nuclear Charge & Shielding" },
      { timeSeconds: 240, formattedTime: "04:00", title: "Trends Across Periods vs Down Groups" },
    ],
    visibility: "draft",
    views: 0,
    likes: 0,
    commentsCount: 0,
    createdAt: "2026-09-25T16:00:00Z",
    updatedAt: "2026-09-25T16:00:00Z",
  },
];

const LOCAL_STORAGE_KEY = "exboard_admin_videos";

export function getStoredVideos(): AdminVideo[] {
  if (typeof window === "undefined") return INITIAL_CURATED_VIDEOS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_CURATED_VIDEOS));
      return INITIAL_CURATED_VIDEOS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_CURATED_VIDEOS;
  } catch (err) {
    console.error("Failed to load videos from localStorage", err);
    return INITIAL_CURATED_VIDEOS;
  }
}

export function saveStoredVideos(videos: AdminVideo[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(videos));
  } catch (err) {
    console.error("Failed to save videos to localStorage", err);
  }
}

export function formatSecondsToTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map((p) => parseInt(p.trim(), 10) || 0);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return parseInt(timeStr, 10) || 0;
}
