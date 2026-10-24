"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import type { StudentHistoryItem } from "@/types/student";

export function useStudentHistory(options?: { limit?: number }) {
  const limit = options?.limit;
  const endpoint = limit ? `${API_ENDPOINTS.STUDENT.HISTORY}?limit=${limit}` : API_ENDPOINTS.STUDENT.HISTORY;
  return useApiQuery<StudentHistoryItem[]>({
    queryKey: limit ? [...queryKeys.student.history(), { limit }] : queryKeys.student.history(),
    queryFn: () => apiGet<StudentHistoryItem[]>(endpoint),
    retry: false,
  });
}
