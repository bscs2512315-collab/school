/**
 * Centralized constants exports
 */
export * from "./endpoints";

/**
 * Application Constants
 */
export const APP_NAME = "ExBoard AI";
export const APP_DESCRIPTION = "AI-Powered Exam Preparation Platform";

/**
 * Default Board
 */
export const DEFAULT_BOARD = "AKUEB";

/**
 * Supported Classes
 */
export const SUPPORTED_CLASSES = ["IX", "X", "XI", "XII"] as const;

/**
 * Subject parent categories (streams/groups).
 * "General" covers subjects common to every stream (English, Urdu, etc.).
 */
export const SUBJECT_CATEGORIES = [
  "General",
  "Pre Medical",
  "Pre Engineering",
  "Computer Science",
  "Commerce",
  "Humanities",
] as const;

export type SubjectCategory = (typeof SUBJECT_CATEGORIES)[number];

/**
 * Which stream categories apply at each class level. Computer Science is an
 * IX–X stream while Pre Engineering / Humanities are XI–XII streams; General is
 * everywhere.
 */
export const SUBJECT_CATEGORIES_BY_LEVEL: Record<string, SubjectCategory[]> = {
  IX: ["General", "Pre Medical", "Computer Science", "Commerce"],
  X: ["General", "Pre Medical", "Computer Science", "Commerce"],
  XI: ["General", "Pre Medical", "Pre Engineering", "Computer Science", "Commerce", "Humanities"],
  XII: ["General", "Pre Medical", "Pre Engineering", "Computer Science", "Commerce", "Humanities"],
};

/**
 * Subjects that are live today. Every other subject is treated as "Coming Soon":
 * hidden from students and only visible (with a badge) in the admin panel.
 */
export const LIVE_SUBJECTS = [
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Mathematics",
] as const;

/**
 * Student groups (streams). Which groups a student can pick depends on their
 * class level. Pre Engineering is XI–XII only; Computer Science exists at both.
 */
export const STUDENT_GROUPS_BY_LEVEL: Record<string, string[]> = {
  IX: ["Pre Medical", "Computer Science", "Commerce"],
  X: ["Pre Medical", "Computer Science", "Commerce"],
  XI: ["Pre Medical", "Pre Engineering", "Computer Science", "Commerce"],
  XII: ["Pre Medical", "Pre Engineering", "Computer Science", "Commerce"],
};

export const STUDENT_GROUPS = [
  "Pre Medical",
  "Pre Engineering",
  "Computer Science",
  "Commerce",
] as const;

/**
 * Common compulsory subjects taken by students across all academic groups.
 */
export const COMMON_COMPULSORY_SUBJECTS: string[] = [
  "English",
  "Urdu",
  "Islamiat",
  "Islamiat (Urdu)",
  "Pakistan Studies",
  "Pakistan Studies (Urdu)",
  "General Mathematics",
];

/**
 * Which live subjects each group studies — includes elective stream subjects + common compulsory subjects.
 */
export const GROUP_SUBJECTS: Record<string, string[]> = {
  "Pre Medical": ["Biology", "Chemistry", "Physics", ...COMMON_COMPULSORY_SUBJECTS],
  "Pre Engineering": ["Physics", "Chemistry", "Mathematics", ...COMMON_COMPULSORY_SUBJECTS],
  "Computer Science": ["Physics", "Computer Science", "Mathematics", ...COMMON_COMPULSORY_SUBJECTS],
  Commerce: ["Accounting", "Banking", "Commerce", "Economics", ...COMMON_COMPULSORY_SUBJECTS],
};

/** Groups available for a given class level (empty for unknown levels). */
export function getGroupsForClass(classLevel?: string | null): string[] {
  if (!classLevel) return [...STUDENT_GROUPS];
  return STUDENT_GROUPS_BY_LEVEL[classLevel] ?? [...STUDENT_GROUPS];
}

/**
 * OTP Configuration
 */
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
} as const;

/**
 * JWT Configuration
 */
export const JWT_CONFIG = {
  DEFAULT_EXPIRY: "7d",
} as const;

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Supported Pakistan Cities
 */
export const PAKISTAN_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Faisalabad",
  "Rawalpindi",
  "Multan",
  "Hyderabad",
  "Peshawar",
  "Quetta",
  "Gujranwala",
  "Sargodha",
  "Bahawalpur",
  "Sialkot",
  "Sukkur",
  "Larkana",
  "Sheikhupura",
  "Rahim Yar Khan",
  "Jhang",
  "Dera Ghazi Khan",
  "Gujrat",
  "Sahiwal",
  "Wah Cantonment",
  "Mardan",
  "Kasur",
  "Okara",
  "Mingora",
  "Nawabshah",
  "Chiniot",
  "Kotri",
  "Kāmoke",
  "Hafizabad",
  "Sadiqabad",
  "Mirpur Khas",
  "Burewala",
  "Kohat",
  "Khanewal",
  "Shikarpur",
  "Muzaffargarh",
  "Mandi Bahauddin",
  "Abbottabad",
  "Muridke",
  "Pakpattan",
  "Khuzdar",
  "Jhelum",
  "Khanpur",
  "Jacobabad",
  "Khairpur",
  "Pishin",
] as const;
