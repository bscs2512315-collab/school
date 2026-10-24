"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";

export interface TeacherStudent {
  id: string;
  name: string;
  email: string;
  username: string;
  class: string;
  points: number;
  profile_image: string | null;
  avg_score: number;
  attempts_count: number;
  assigned_count: number;
  completion_rate: number;
  last_active_at: string | null;
  classrooms: TeacherStudentClassroom[];
  subjects: TeacherStudentSubjectProgress[];
  recent_activity: TeacherStudentActivity[];
}

export interface TeacherStudentClassroom {
  id: string;
  name: string;
  subject: string;
  classLevel: string;
}

export interface TeacherStudentChapterProgress {
  chapter: string;
  progress: number;
  questions: number;
}

export interface TeacherStudentSubjectProgress {
  subject: string;
  progress: number;
  attempts: number;
  assigned: number;
  chapters: TeacherStudentChapterProgress[];
}

export interface TeacherStudentActivity {
  id: string;
  title: string;
  subject: string;
  paperType: string;
  status: string;
  score: number | null;
  timeTaken: number;
  attemptedAt: string;
}

export function useTeacherStudents(enabled = true) {
  return useApiQuery<TeacherStudent[]>({
    queryKey: queryKeys.teacher.students(),
    queryFn: () => apiGet<TeacherStudent[]>(API_ENDPOINTS.TEACHER.STUDENTS),
    enabled,
  });
}
