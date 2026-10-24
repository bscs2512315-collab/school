"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import type { StudentMilestone } from "@/types/student";

export function useStudentMilestones() {
  return useApiQuery<StudentMilestone[]>({
    queryKey: queryKeys.student.milestones(),
    queryFn: () => apiGet<StudentMilestone[]>(API_ENDPOINTS.STUDENT.MILESTONES),
    retry: false,
  });
}
