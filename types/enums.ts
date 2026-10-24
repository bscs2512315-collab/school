/**
 * User Roles Enum
 * Centralized definition of all user roles in the system
 */
export enum UserRole {
  STUDENT = "STUDENT",
  SCHOOL = "SCHOOL",
  TEACHER = "TEACHER",
  ADMIN = "ADMIN",
  QA = "QA",
}

/**
 * Board Enum
 * Supported examination boards
 */
export enum Board {
  AKUEB = "AKUEB",
  SINDH_BOARD = "Sindh Board",
  PUNJAB_BOARD = "Punjab Board",
  KPK_BOARD = "KPK Board",
  BALOCHISTAN_BOARD = "Balochistan Board",
  FEDERAL_BOARD = "Federal Board",
}

/**
 * Subject Enum
 * Supported subjects
 */
export enum Subject {
  ENGLISH = "English",
  URDU = "Urdu",
  MATHEMATICS = "Mathematics",
  PAKISTAN_STUDIES = "Pakistan Studies",
  ISLAMIAT = "Islamiat",
  PHYSICS = "Physics",
  CHEMISTRY = "Chemistry",
  BIOLOGY = "Biology",
  COMPUTER_SCIENCE = "Computer Science",
}

/**
 * Class Enum
 * Supported classes (IX-XII)
 */
export enum Class {
  IX = "IX",
  X = "X",
  XI = "XI",
  XII = "XII",
}

/**
 * Auth Guard Type
 * Defines whether a route requires authentication
 */
export enum AuthGuardType {
  PUBLIC = "public",
  PRIVATE = "private",
}

/**
 * Registration Role Type
 * Used in registration flow
 */
export enum RegistrationRole {
  STUDENT = "student",
  SCHOOL = "school",
  TEACHER = "teacher",
}

/**
 * Registration Step
 * Steps in the registration process
 */
export enum RegistrationStep {
  ROLE = "role",
  FORM = "form",
}

/**
 * OTP Type
 * Types of OTP verification
 */
export enum OtpType {
  REGISTRATION = "registration",
  RESET = "reset",
}

/**
 * Gender Enum
 */
export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

/**
 * Paper Type Enum
 */
export enum PaperType {
  PAPER_1 = "paper1", // MCQs only
  PAPER_2 = "paper2", // CRQs + ERQs
  BOTH = "both",
}

/**
 * Question Type Enum
 */
export enum QuestionType {
  MCQ = "mcq",
  CRQ = "crq", // Constructed Response Question
  ERQ = "erq", // Extended Response Question
}

/**
 * Leaderboard Tab Enum
 */
export enum LeaderboardTab {
  STUDENTS = "Students",
  SCHOOLS = "Schools",
}

/**
 * Performance Trend Enum
 */
export enum PerformanceTrend {
  UP = "up",
  DOWN = "down",
  STABLE = "stable",
}

export enum AccountTab {
  AWARDS = "awards",
  ACTIVITY = "activity",
  STATS = "stats",
}

/**
 * Challenge Tab Enum
 */
export enum ChallengeTab {
  CREATE = "create",
  MY_CHALLENGES = "my-challenges",
  INVITATIONS = "invitations",
}

/**
 * Challenge Create Step Enum
 */
export enum ChallengeCreateStep {
  MODE = "mode",
  CONFIGURE = "configure",
  CHAPTERS = "chapters",
  INVITE = "invite",
}

/**
 * Teacher Content Type Enum
 */
export enum TeacherContentType {
  ASSIGNMENT = "assignment",
  QUIZ = "quiz",
  HOMEWORK = "homework",
  PRACTICE_QUESTION = "practice_question",
}

/**
 * Classroom membership invite status
 */
export enum ClassroomMemberStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
}

/**
 * Grading Status Enum for Paper 2
 */
export enum GradingStatus {
  PENDING_AI = "pending",
  PENDING_MANUAL = "pending_manual",
  /** AI graded a classroom Practice Test — waiting for teacher edit/approve */
  AWAITING_APPROVAL = "awaiting_approval",
  GRADED = "graded",
  REJECTED = "rejected",
  FAILED = "failed",
}

/**
 * Public election window — independent of platform user accounts.
 */
export enum ElectionStatus {
  UPCOMING = "upcoming",
  LIVE = "live",
  ENDED = "ended",
}
