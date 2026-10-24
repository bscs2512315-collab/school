import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { UserRole } from "@/types/enums";

export function getStoredUserRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("exboard_user");
    if (!raw) return null;
    const user = JSON.parse(raw) as { role?: string };
    return user.role ?? null;
  } catch {
    return null;
  }
}

/** Role-aware routes for syllabus / past papers / Nova / settings shared by student + teacher. */
export function getLearningRoutes(role?: string | null) {
  const isTeacher = role === UserRole.TEACHER;

  return {
    curriculums: isTeacher
      ? FRONTEND_ROUTES.TEACHER_CURRICULUMS
      : FRONTEND_ROUTES.STUDENT_CURRICULUMS,
    curriculum: (id: string) =>
      isTeacher
        ? FRONTEND_ROUTES.TEACHER_CURRICULUM(id)
        : FRONTEND_ROUTES.STUDENT_CURRICULUM(id),
    curriculumChapter: (curriculumId: string, chapterId: string) =>
      isTeacher
        ? FRONTEND_ROUTES.TEACHER_CURRICULUM_CHAPTER(curriculumId, chapterId)
        : FRONTEND_ROUTES.STUDENT_CURRICULUM_CHAPTER(curriculumId, chapterId),
    pastPapers1: isTeacher
      ? FRONTEND_ROUTES.TEACHER_PAST_PAPERS_1
      : FRONTEND_ROUTES.STUDENT_PAST_PAPERS_1,
    pastPapers2: isTeacher
      ? FRONTEND_ROUTES.TEACHER_PAST_PAPERS_2
      : FRONTEND_ROUTES.STUDENT_PAST_PAPERS_2,
    pastPaperAttempt: (id: string) => FRONTEND_ROUTES.STUDENT_PAST_PAPER_ATTEMPT(id),
    pastPaperAttemptPaper2: (id: string) =>
      FRONTEND_ROUTES.STUDENT_PAST_PAPER_ATTEMPT_PAPER2(id),
    pastPaperView: (id: string) => FRONTEND_ROUTES.STUDENT_PAST_PAPER_VIEW(id),
    nova: isTeacher ? FRONTEND_ROUTES.TEACHER_NOVA : FRONTEND_ROUTES.STUDENT_NOVA,
    settings: isTeacher
      ? FRONTEND_ROUTES.TEACHER_SETTINGS
      : FRONTEND_ROUTES.STUDENT_SETTINGS,
  };
}
