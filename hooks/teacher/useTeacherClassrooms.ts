"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { classesMatch } from "@/lib/teacher/class-level";

export interface TeacherClassroomOption {
  id: string;
  name?: string | null;
  teacherId: string;
  teacherName: string;
  teacherImage: string | null;
  subject: string;
  classLevel: string;
  board?: string;
  pinCode?: string | null;
  pin?: string | null;
  schoolName: string | null;
  visibility: "school" | "private";
  paperCount?: number;
}

export function useTeacherClassrooms(enabled = true) {
  return useApiQuery<TeacherClassroomOption[]>({
    queryKey: queryKeys.teacher.classrooms(),
    queryFn: () =>
      apiGet<TeacherClassroomOption[]>(API_ENDPOINTS.CLASSROOMS.LIST),
    enabled,
  });
}

export function filterClassroomsForPaper(
  classrooms: TeacherClassroomOption[] | undefined,
  subject: string,
  classLevel: string,
): TeacherClassroomOption[] {
  if (!classrooms?.length) return [];
  const subjectKey = subject.trim().toLowerCase();
  return classrooms.filter(
    (c) =>
      c.subject.trim().toLowerCase() === subjectKey &&
      classesMatch(c.classLevel, classLevel),
  );
}

export function classroomPublishLabel(c: TeacherClassroomOption): string {
  const displayName =
    c.name && !c.name.includes("__")
      ? c.name
      : `${c.subject} · Class ${c.classLevel}`;
  const pin = c.pinCode || c.pin;
  return pin ? `${displayName} (PIN: ${pin})` : displayName;
}
