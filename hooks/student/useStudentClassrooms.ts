"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";

export interface StudentClassroom {
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
  visibility?: "school" | "private";
  paperCount?: number;
}

export function useStudentClassrooms() {
  return useApiQuery<StudentClassroom[]>({
    queryKey: queryKeys.student.classrooms(),
    queryFn: () => apiGet<StudentClassroom[]>(API_ENDPOINTS.CLASSROOMS.LIST),
  });
}
