"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import type { PastPaperDetail } from "@/types/past-paper";

export function useStudentPastPaperDetail(paperId?: string) {
  return useApiQuery<PastPaperDetail>({
    queryKey: queryKeys.student.pastPaper(paperId ?? "unknown"),
    queryFn: () => apiGet<PastPaperDetail>(API_ENDPOINTS.STUDENT.PAST_PAPER_BY_ID(paperId!)),
    enabled: Boolean(paperId),
    retry: false,
  });
}
