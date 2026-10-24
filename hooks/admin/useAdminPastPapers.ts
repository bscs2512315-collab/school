"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiDelete, apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "@/hooks/api/useApiMutation";
import type { AdminPastPaperFilters, AdminPastPaperListData } from "@/types/past-paper";

const DEFAULT_LIMIT = 12;

function buildPastPapersUrl(filters: AdminPastPaperFilters): string {
  const params = new URLSearchParams({
    paperNumber: String(filters.paperNumber),
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? DEFAULT_LIMIT),
  });

  if (filters.class && filters.class !== "all") {
    params.append("class", filters.class);
  }
  if (filters.board && filters.board !== "all") {
    params.append("board", filters.board);
  }
  if (filters.subject && filters.subject !== "all") {
    params.append("subject", filters.subject);
  }
  if (filters.year && filters.year !== "all") {
    params.append("year", filters.year);
  }
  if (filters.search?.trim()) {
    params.append("search", filters.search.trim());
  }

  return `${API_ENDPOINTS.ADMIN.PAST_PAPER}?${params.toString()}`;
}

export function useAdminPastPapers(filters: AdminPastPaperFilters) {
  return useApiQuery<AdminPastPaperListData>({
    queryKey: queryKeys.admin.pastPapers(filters),
    queryFn: () => apiGet<AdminPastPaperListData>(buildPastPapersUrl(filters)),
    retry: false,
  });
}

export function useDeleteAdminPastPaper() {
  return useApiMutation<null, string>({
    mutationFn: (paperId) => apiDelete<null>(API_ENDPOINTS.ADMIN.PAST_PAPER_BY_ID(paperId)),
    invalidateKeys: [queryKeys.admin.all],
  });
}
