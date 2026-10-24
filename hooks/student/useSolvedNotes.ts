"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import type { SolvedNotesListResponse } from "@/types/solved-notes";

export interface SolvedNotesFilterParams {
  class?: string;
  board?: string;
  subject?: string;
  chapter?: string;
  search?: string;
}

export function useSolvedNotes(params: SolvedNotesFilterParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.class && params.class !== "all") queryParams.set("class", params.class);
  if (params.board && params.board !== "all") queryParams.set("board", params.board);
  if (params.subject && params.subject !== "all") queryParams.set("subject", params.subject);
  if (params.chapter && params.chapter !== "all") queryParams.set("chapter", params.chapter);
  if (params.search) queryParams.set("search", params.search);

  const endpoint = `${API_ENDPOINTS.STUDENT.SOLVED_NOTES}?${queryParams.toString()}`;

  return useApiQuery<SolvedNotesListResponse>({
    queryKey: queryKeys.student.solvedNotes(params as Record<string, string | undefined>),
    queryFn: () => apiGet<SolvedNotesListResponse>(endpoint),
  });
}
