"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import type { StudentCurriculum } from "@/types/student";

export function useStudentCurriculums() {
  return useApiQuery<StudentCurriculum[]>({
    queryKey: queryKeys.student.curriculums(),
    queryFn: () => apiGet<StudentCurriculum[]>(API_ENDPOINTS.STUDENT.CURRICULUM),
  });
}
