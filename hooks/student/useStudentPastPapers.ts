"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import type { PastPaperSummary } from "@/types/past-paper";

export interface StudentPastPapersOptions {
  limit?: number;
  page?: number;
  class?: string;
  board?: string;
  subject?: string;
  year?: string;
  paperNumber?: number;
  search?: string;
}

export function useStudentPastPapers(options?: StudentPastPapersOptions) {
  const queryParams = new URLSearchParams();
  if (options?.limit) queryParams.set("limit", String(options.limit));
  if (options?.page) queryParams.set("page", String(options.page));
  if (options?.class && options.class !== "all") queryParams.set("class", options.class);
  if (options?.board && options.board !== "all") queryParams.set("board", options.board);
  if (options?.subject && options.subject !== "all") queryParams.set("subject", options.subject);
  if (options?.year && options.year !== "all") queryParams.set("year", options.year);
  if (options?.paperNumber) queryParams.set("paperNumber", String(options.paperNumber));
  if (options?.search) queryParams.set("search", options.search);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `${API_ENDPOINTS.STUDENT.PAST_PAPER}?${queryString}` : API_ENDPOINTS.STUDENT.PAST_PAPER;

  return useApiQuery<PastPaperSummary[]>({
    queryKey: options ? [...queryKeys.student.pastPapers(), options] : queryKeys.student.pastPapers(),
    queryFn: () => apiGet<PastPaperSummary[]>(endpoint),
    retry: false,
  });
}
