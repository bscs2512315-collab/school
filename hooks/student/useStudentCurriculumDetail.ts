"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import type { StudentCurriculumDetail } from "@/types/student";

export function useStudentCurriculumDetail(curriculumId?: string) {
  return useApiQuery<StudentCurriculumDetail>({
    queryKey: queryKeys.student.curriculum(curriculumId ?? "unknown"),
    queryFn: () => apiGet<StudentCurriculumDetail>(API_ENDPOINTS.STUDENT.CURRICULUM_BY_ID(curriculumId!)),
    enabled: Boolean(curriculumId),
  });
}
