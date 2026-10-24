"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiDelete, apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "@/hooks/api/useApiMutation";
import type { AdminCurriculumFilters, AdminCurriculumListData } from "@/types/admin";

const DEFAULT_LIMIT = 12;

function buildCurriculumsUrl(filters: AdminCurriculumFilters): string {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? DEFAULT_LIMIT),
  });

  if (filters.class && filters.class !== "all") {
    params.append("class", filters.class);
  }
  if (filters.board && filters.board !== "all") {
    params.append("board", filters.board);
  }
  if (filters.search?.trim()) {
    params.append("search", filters.search.trim());
  }

  return `${API_ENDPOINTS.ADMIN.CURRICULUM}?${params.toString()}`;
}

export function useAdminCurriculums(filters: AdminCurriculumFilters = {}) {
  return useApiQuery<AdminCurriculumListData>({
    queryKey: queryKeys.admin.curriculums(filters),
    queryFn: () => apiGet<AdminCurriculumListData>(buildCurriculumsUrl(filters)),
  });
}

export function useDeleteAdminCurriculum() {
  return useApiMutation<null, string>({
    mutationFn: (curriculumId) =>
      apiDelete<null>(API_ENDPOINTS.ADMIN.CURRICULUM_BY_ID(curriculumId)),
    invalidateKeys: [queryKeys.admin.all],
  });
}
