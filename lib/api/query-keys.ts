import type { QuestionBankFilters } from "@/types/question-bank";
import type { AdminCurriculumFilters } from "@/types/admin";
import type { AdminPastPaperFilters, ReviewExamsFilters } from "@/types/past-paper";

export const queryKeys = {
  auth: {
    all: ["auth"] as const,
  },
  subjects: {
    all: ["subjects"] as const,
    list: () => [...queryKeys.subjects.all, "list"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    summary: () => [...queryKeys.notifications.all, "summary"] as const,
    list: (pageSize = 15) => [...queryKeys.notifications.all, "list", pageSize] as const,
  },
  student: {
    all: ["student"] as const,
    me: () => [...queryKeys.student.all, "me"] as const,
    classrooms: () => [...queryKeys.student.all, "classrooms"] as const,
    curriculums: () => [...queryKeys.student.all, "curriculums"] as const,
    curriculum: (id: string) => [...queryKeys.student.all, "curriculum", id] as const,
    solvedNotes: (filters: Record<string, string | undefined> = {}) =>
      [...queryKeys.student.all, "solved-notes", filters] as const,
    solvedExercise: (id: string) => [...queryKeys.student.all, "solved-notes", id] as const,
    pastPapers: () => [...queryKeys.student.all, "past-papers"] as const,
    pastPaper: (id: string) => [...queryKeys.student.all, "past-paper", id] as const,
    history: () => [...queryKeys.student.all, "history"] as const,
    historyDetail: (id: string) => [...queryKeys.student.all, "history", id] as const,
    milestones: () => [...queryKeys.student.all, "milestones"] as const,
    badges: () => [...queryKeys.student.all, "badges"] as const,
    customQuizzes: () => [...queryKeys.student.all, "custom-quizzes"] as const,
    customQuizzesShared: () => [...queryKeys.student.all, "custom-quizzes", "shared"] as const,
    customQuiz: (id: string) => [...queryKeys.student.all, "custom-quizzes", id] as const,
    classroomAttempts: (classroomId: string) =>
      [...queryKeys.student.all, "classroom-attempts", classroomId] as const,
    classroomResults: (classroomId: string) =>
      [...queryKeys.student.all, "classroom-results", classroomId] as const,
    chat: {
      all: () => [...queryKeys.student.all, "chat"] as const,
      sessions: () => [...queryKeys.student.chat.all(), "sessions"] as const,
      session: (id: string) => [...queryKeys.student.chat.all(), "session", id] as const,
    },
  },
  admin: {
    all: ["admin"] as const,
    curriculums: (filters: AdminCurriculumFilters = {}) =>
      [...queryKeys.admin.all, "curriculums", filters] as const,
    curriculum: (id: string) => [...queryKeys.admin.all, "curriculum", id] as const,
    curriculumChapters: (id: string) => [...queryKeys.admin.all, "curriculum", id, "chapters"] as const,
    pastPapers: (filters: AdminPastPaperFilters = {}) =>
      [...queryKeys.admin.all, "past-papers", filters] as const,
    pastPaper: (id: string) => [...queryKeys.admin.all, "past-paper", id] as const,
    pastPaperQuestions: (id: string) => [...queryKeys.admin.all, "past-paper", id, "questions"] as const,
    reviewExams: (filters: ReviewExamsFilters = {}) =>
      [...queryKeys.admin.all, "review-exams", filters] as const,
    reviewExam: (id: string) => [...queryKeys.admin.all, "review-exams", id] as const,
    milestones: () => [...queryKeys.admin.all, "milestones"] as const,
    settings: (key: string) => [...queryKeys.admin.all, "settings", key] as const,
    questions: (filters: QuestionBankFilters) =>
      [...queryKeys.admin.all, "questions", filters] as const,
    questionsSummary: () => [...queryKeys.admin.all, "questions", "summary"] as const,
    dashboardStats: () => [...queryKeys.admin.all, "dashboard", "stats"] as const,
    questionsChapters: (filters: {
      class: string;
      subject: string;
      paperNumber: number;
    }) => [...queryKeys.admin.all, "questions", "chapters", filters] as const,
    bot: {
      all: () => [...queryKeys.admin.all, "bot"] as const,
      exemplars: () => [...queryKeys.admin.all, "bot", "exemplars"] as const,
      knowledge: () => [...queryKeys.admin.all, "bot", "knowledge"] as const,
      settings: () => [...queryKeys.admin.all, "bot", "settings"] as const,
    },
  },
  user: {
    all: ["user"] as const,
    profile: () => [...queryKeys.user.all, "profile"] as const,
  },
  users: {
    all: ["users"] as const,
    profile: (id: string) => ["users", id, "profile"] as const,
    search: (q: string, role?: string) => ["users", "search", q, role ?? "all"] as const,
    followers: (userId: string, type: string) =>
      ["users", userId, "followers", type] as const,
  },
  leaderboard: {
    all: ["leaderboard"] as const,
  },
  challenges: {
    all: ["challenges"] as const,
    list: () => [...queryKeys.challenges.all, "list"] as const,
    detail: (id: string) => [...queryKeys.challenges.all, "detail", id] as const,
  },
  teacher: {
    all: ["teacher"] as const,
    dashboardSummary: () => [...queryKeys.teacher.all, "dashboard-summary"] as const,
    classrooms: () => [...queryKeys.teacher.all, "classrooms"] as const,
    classroomAttempts: (classroomId: string, tab?: string) =>
      [...queryKeys.teacher.all, "classroom-attempts", classroomId, tab ?? "all"] as const,
    classroomAttempt: (classroomId: string, attemptId: string) =>
      [...queryKeys.teacher.all, "classroom-attempt", classroomId, attemptId] as const,
    pendingPapers: () => [...queryKeys.teacher.all, "pending-papers"] as const,
    students: () => [...queryKeys.teacher.all, "students"] as const,
    elections: () => [...queryKeys.teacher.all, "elections"] as const,
    election: (id: string) => [...queryKeys.teacher.all, "elections", id] as const,
    electionVotes: (id: string) =>
      [...queryKeys.teacher.all, "elections", id, "votes"] as const,
    electionAnalytics: (id: string) =>
      [...queryKeys.teacher.all, "elections", id, "analytics"] as const,
  },
  elections: {
    all: ["elections"] as const,
    public: (slug: string) => [...queryKeys.elections.all, "public", slug] as const,
    analytics: (slug: string) =>
      [...queryKeys.elections.all, "analytics", slug] as const,
    register: (slug: string) =>
      [...queryKeys.elections.all, "register", slug] as const,
  },
} as const;
