"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import type { StudentHistoryDetail } from "@/types/student";

export function useStudentHistoryDetail(attemptId?: string) {
  return useApiQuery<StudentHistoryDetail>({
    queryKey: queryKeys.student.historyDetail(attemptId ?? "unknown"),
    queryFn: () => apiGet<StudentHistoryDetail>(API_ENDPOINTS.STUDENT.HISTORY_BY_ID(attemptId!)),
    enabled: Boolean(attemptId),
    retry: false,
  });
}
