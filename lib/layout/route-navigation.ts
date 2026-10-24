import { FRONTEND_ROUTES } from "@/constants/endpoints";

/**
 * Top-level parent roots across all portals.
 * Parent pages should NEVER display a top-header back button (unless a component
 * on that page explicitly sets a custom headerBack callback, e.g. multi-step wizard).
 */
const PARENT_ROUTES = new Set<string>([
  // Student Portal Parent Routes
  "/student/dashboard",
  "/student/classrooms",
  "/student/lectures",
  "/student/lab-game",
  "/student/practical-journals",
  "/student/solved-notes",
  "/student/curriculums",
  "/student/curriculum",
  "/student/past-papers-1",
  "/student/past-papers-2",
  "/student/generate",
  "/student/custom-quizzes",
  "/student/nova",
  "/student/leaderboard",
  "/student/history",
  "/student/friends",
  "/student/settings",
  "/student/account",
  "/student/notifications",
  "/student/onboarding",

  // Teacher Portal Parent Routes
  "/teacher/dashboard",
  "/teacher/classrooms",
  "/teacher/elections",
  "/teacher/students",
  "/teacher/activities",
  "/teacher/curriculums",
  "/teacher/curriculum",
  "/teacher/past-papers-1",
  "/teacher/past-papers-2",
  "/teacher/create-paper",
  "/teacher/nova",
  "/teacher/leaderboard",
  "/teacher/settings",
  "/teacher/account",

  // Admin Portal Parent Routes
  "/admin/dashboard",
  "/admin/stories",
  "/admin/curriculums",
  "/admin/curriculum",
  "/admin/subjects",
  "/admin/schools",
  "/admin/users",
  "/admin/activities",
  "/admin/past-papers-1",
  "/admin/past-papers-2",
  "/admin/upload-past-paper",
  "/admin/question-bank",
  "/admin/review-exams",
  "/admin/leaderboard",
  "/admin/friends",
  "/admin/milestones",
  "/admin/train-bot",
  "/admin/settings",
  "/admin/account",
  "/admin/upload-curriculum",
  "/admin/create-curriculum",
  "/admin/review-questions",
  "/admin/syllabus/add",
  "/admin/boards",
  "/admin/advertisements",

  // School Portal Parent Routes
  "/school/dashboard",
  "/school/classrooms",
  "/school/leaderboard",
  "/school/settings",
]);

/**
 * Checks if a given pathname represents a child / detail page.
 */
export function isChildRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const normalized = pathname.replace(/\/+$/, "") || "/";

  // If it's in the set of known parent routes, it is NOT a child page
  if (PARENT_ROUTES.has(normalized)) {
    return false;
  }

  // Root or auth pages are not child pages in dashboard shell
  if (
    normalized === "" ||
    normalized === "/" ||
    normalized === "/dashboard" ||
    normalized === "/login" ||
    normalized === "/register" ||
    normalized === "/forgot-password" ||
    normalized === "/reset-password" ||
    normalized === "/verify-otp"
  ) {
    return false;
  }

  // Check portal prefix
  if (
    normalized.startsWith("/student/") ||
    normalized.startsWith("/teacher/") ||
    normalized.startsWith("/admin/") ||
    normalized.startsWith("/school/")
  ) {
    return true;
  }

  return false;
}

/**
 * Resolves the deterministic, appropriate parent route for any child page
 * instead of falling back to browser history (-1).
 */
export function getParentRoute(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  const normalized = pathname.replace(/\/+$/, "") || "/";

  // Parent routes have no parent
  if (PARENT_ROUTES.has(normalized)) {
    return null;
  }

  // ==========================================
  // STUDENT PORTAL RESOLUTION
  // ==========================================
  if (normalized.startsWith("/student/")) {
    // 1. Chapter detail under curriculum: /student/curriculum/[id]/chapter/[chapterId] -> /student/curriculum/[id]
    const chapterMatch = normalized.match(/^\/student\/curriculum\/([^/]+)\/chapter\/[^/]+$/);
    if (chapterMatch) {
      return `/student/curriculum/${chapterMatch[1]}`;
    }

    // 2. Curriculum detail: /student/curriculum/[id] -> /student/curriculums
    if (/^\/student\/curriculum\/[^/]+$/.test(normalized)) {
      return FRONTEND_ROUTES.STUDENT_CURRICULUMS;
    }

    // 3. Classrooms detail / join: /student/classrooms/[id]... -> /student/classrooms
    if (/^\/student\/classrooms\/[^/]+/.test(normalized)) {
      return FRONTEND_ROUTES.STUDENT_CLASSROOMS;
    }

    // 4. Teacher paper attempt: /student/teacher-papers/[id]/attempt -> /student/classrooms
    if (/^\/student\/teacher-papers\/[^/]+/.test(normalized)) {
      return FRONTEND_ROUTES.STUDENT_CLASSROOMS;
    }

    // 5. Past paper attempt / view:
    if (/^\/student\/past-paper\/[^/]+\/attempt-paper2$/.test(normalized)) {
      return FRONTEND_ROUTES.STUDENT_PAST_PAPERS_2;
    }
    if (/^\/student\/past-paper\/[^/]+/.test(normalized)) {
      return FRONTEND_ROUTES.STUDENT_PAST_PAPERS_1;
    }

    // 6. Custom quizzes create / edit / solve:
    if (/^\/student\/custom-quizzes\/(?:create|[^/]+\/(?:edit|solve))$/.test(normalized)) {
      return FRONTEND_ROUTES.STUDENT_CUSTOM_QUIZZES;
    }

    // 7. Challenges: /student/challenge/[id] -> /student/generate
    if (/^\/student\/challenge(?:\/[^/]+)?$/.test(normalized)) {
      return FRONTEND_ROUTES.STUDENT_GENERATE;
    }

    // 8. Solved Notes routes:
    // 8a. Solved Notes exercise under subject: /student/solved-notes/[subject]/[id] -> /student/solved-notes/[subject]
    const solvedExerciseMatch = normalized.match(/^\/student\/solved-notes\/([^/]+)\/[^/]+$/);
    if (solvedExerciseMatch) {
      return `/student/solved-notes/${solvedExerciseMatch[1]}`;
    }
    // 8b. Solved Notes subject or standalone exercise: /student/solved-notes/[subject] -> /student/solved-notes
    if (/^\/student\/solved-notes\/[^/]+$/.test(normalized)) {
      return FRONTEND_ROUTES.STUDENT_SOLVED_NOTES;
    }

    // 9. Practical Journals experiment: /student/practical-journals/[subject]/[exp] -> /student/practical-journals/[subject]
    const expMatch = normalized.match(/^\/student\/practical-journals\/([^/]+)\/[^/]+$/);
    if (expMatch) {
      return `/student/practical-journals/${expMatch[1]}`;
    }
    // Practical Journals subject: /student/practical-journals/[subject] -> /student/practical-journals
    if (/^\/student\/practical-journals\/[^/]+$/.test(normalized)) {
      return FRONTEND_ROUTES.STUDENT_PRACTICAL_JOURNALS;
    }

    // 10. Lab Game sub-games: /student/lab-game/[game] -> /student/lab-game
    if (/^\/student\/lab-game\/[^/]+$/.test(normalized)) {
      return FRONTEND_ROUTES.STUDENT_LAB_GAME;
    }

    // 11. History detail: /student/history/[id] -> /student/history
    if (/^\/student\/history\/[^/]+$/.test(normalized)) {
      return FRONTEND_ROUTES.STUDENT_HISTORY;
    }

    // 12. Friends & Network detail: /student/friends/[id] or /student/network/[id] -> /student/friends
    if (/^\/student\/(?:friends|network)\/[^/]+$/.test(normalized)) {
      return FRONTEND_ROUTES.STUDENT_FRIENDS;
    }

    // 13. Lightning arena: /student/lightning/[id] -> /student/dashboard
    if (/^\/student\/lightning\/[^/]+$/.test(normalized)) {
      return FRONTEND_ROUTES.STUDENT_DASHBOARD;
    }

    // Default fallback for student child routes:
    const segments = normalized.split("/").filter(Boolean);
    if (segments.length >= 2) {
      return `/student/${segments[1]}`;
    }
    return FRONTEND_ROUTES.STUDENT_DASHBOARD;
  }

  // ==========================================
  // TEACHER PORTAL RESOLUTION
  // ==========================================
  if (normalized.startsWith("/teacher/")) {
    // 1. Chapter detail: /teacher/curriculum/[id]/chapter/[chapterId] -> /teacher/curriculum/[id]
    const teacherChapterMatch = normalized.match(/^\/teacher\/curriculum\/([^/]+)\/chapter\/[^/]+$/);
    if (teacherChapterMatch) {
      return `/teacher/curriculum/${teacherChapterMatch[1]}`;
    }

    // 2. Curriculum detail: /teacher/curriculum/[id] -> /teacher/curriculums
    if (/^\/teacher\/curriculum\/[^/]+$/.test(normalized)) {
      return FRONTEND_ROUTES.TEACHER_CURRICULUMS;
    }

    // 3. Classroom attempt review: /teacher/classrooms/[id]/attempts/[attemptId] -> /teacher/classrooms/[id]?tab=attempted
    const classroomAttemptMatch = normalized.match(/^\/teacher\/classrooms\/([^/]+)\/attempts\/[^/]+$/);
    if (classroomAttemptMatch) {
      return `/teacher/classrooms/${classroomAttemptMatch[1]}?tab=attempted`;
    }

    // 4. Classroom detail: /teacher/classrooms/[id] -> /teacher/classrooms
    if (/^\/teacher\/classrooms\/[^/]+$/.test(normalized)) {
      return FRONTEND_ROUTES.TEACHER_CLASSROOMS;
    }

    // 5. Student report detail: /teacher/students/[studentId] -> /teacher/students
    if (/^\/teacher\/students\/[^/]+$/.test(normalized)) {
      return FRONTEND_ROUTES.TEACHER_STUDENTS;
    }

    // 6. Election analytics: /teacher/elections/[id]/analytics -> /teacher/elections/[id]
    const electionAnalyticsMatch = normalized.match(/^\/teacher\/elections\/([^/]+)\/analytics$/);
    if (electionAnalyticsMatch) {
      return `/teacher/elections/${electionAnalyticsMatch[1]}`;
    }

    // 7. Election detail: /teacher/elections/[id] -> /teacher/elections
    if (/^\/teacher\/elections\/[^/]+$/.test(normalized)) {
      return FRONTEND_ROUTES.TEACHER_ELECTIONS;
    }

    // 8. Check papers: /teacher/check-papers/[attemptId] -> /teacher/classrooms
    if (/^\/teacher\/check-papers\/[^/]+$/.test(normalized)) {
      return FRONTEND_ROUTES.TEACHER_CLASSROOMS;
    }

    // 9. Lightning arena: /teacher/lightning/[id] -> /teacher/activities
    if (/^\/teacher\/lightning\/[^/]+$/.test(normalized)) {
      return FRONTEND_ROUTES.TEACHER_ACTIVITIES;
    }

    // Default fallback for teacher child routes:
    const segments = normalized.split("/").filter(Boolean);
    if (segments.length >= 2) {
      return `/teacher/${segments[1]}`;
    }
    return FRONTEND_ROUTES.TEACHER_DASHBOARD;
  }

  // ==========================================
  // ADMIN PORTAL RESOLUTION
  // ==========================================
  if (normalized.startsWith("/admin/")) {
    // 1. Chapter detail: /admin/curriculum/[id]/chapter/[chapterId] -> /admin/curriculum/[id]
    const adminChapterMatch = normalized.match(/^\/admin\/curriculum\/([^/]+)\/chapter\/[^/]+$/);
    if (adminChapterMatch) {
      return `/admin/curriculum/${adminChapterMatch[1]}`;
    }

    // 2. Curriculum sub-pages (edit/add-chapters/slos): /admin/curriculum/[id]/(add-chapters|edit|slos) -> /admin/curriculum/[id]
    const adminCurriculumSubMatch = normalized.match(/^\/admin\/curriculum\/([^/]+)\/(?:add-chapters|edit|slos)$/);
    if (adminCurriculumSubMatch) {
      return `/admin/curriculum/${adminCurriculumSubMatch[1]}`;
    }

    // 3. Curriculum detail: /admin/curriculum/[id] -> /admin/curriculums
    if (/^\/admin\/curriculum\/[^/]+$/.test(normalized)) {
      return FRONTEND_ROUTES.ADMIN_CURRICULUMS;
    }

    // 4. Past paper view/edit: /admin/past-paper/[id]/(view|edit) -> /admin/past-papers-1
    if (/^\/admin\/past-paper\/[^/]+/.test(normalized)) {
      return FRONTEND_ROUTES.ADMIN_PAST_PAPERS_1;
    }

    // 5. Review exam detail: /admin/review-exams/[id] -> /admin/review-exams
    if (/^\/admin\/review-exams\/[^/]+$/.test(normalized)) {
      return FRONTEND_ROUTES.ADMIN_REVIEW_EXAMS;
    }

    // 6. User detail: /admin/users/[id] -> /admin/users
    if (/^\/admin\/users\/[^/]+$/.test(normalized)) {
      return FRONTEND_ROUTES.ADMIN_USERS;
    }

    // 7. School detail: /admin/schools/[id] -> /admin/schools
    if (/^\/admin\/schools\/[^/]+$/.test(normalized)) {
      return FRONTEND_ROUTES.ADMIN_SCHOOLS;
    }

    // Default fallback for admin child routes:
    const segments = normalized.split("/").filter(Boolean);
    if (segments.length >= 2) {
      return `/admin/${segments[1]}`;
    }
    return FRONTEND_ROUTES.ADMIN_DASHBOARD;
  }

  // ==========================================
  // SCHOOL PORTAL RESOLUTION
  // ==========================================
  if (normalized.startsWith("/school/")) {
    if (normalized === "/school/add-teacher" || normalized === "/school/add-students") {
      return FRONTEND_ROUTES.SCHOOL_DASHBOARD;
    }
    if (/^\/school\/classrooms\/[^/]+$/.test(normalized)) {
      return "/school/classrooms";
    }
    const segments = normalized.split("/").filter(Boolean);
    if (segments.length >= 2) {
      return `/school/${segments[1]}`;
    }
    return FRONTEND_ROUTES.SCHOOL_DASHBOARD;
  }

  return null;
}
