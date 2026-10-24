"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiDelete, apiGet, apiPost } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "@/hooks/api/useApiMutation";
import type { FollowResponse, UserSearchData } from "@/types/user";

export function useUserSearch(
  query: string,
  options?: { limit?: number; studentsOnly?: boolean },
) {
  const trimmed = query.trim();
  const limit = options?.limit ?? 20;
  const studentsOnly = Boolean(options?.studentsOnly);

  return useApiQuery<UserSearchData>({
    queryKey: queryKeys.users.search(trimmed, studentsOnly ? "STUDENT" : undefined),
    queryFn: () => {
      const params = new URLSearchParams({
        q: trimmed,
        limit: String(limit),
      });
      if (studentsOnly) {
        params.set("studentsOnly", "true");
        params.set("role", "STUDENT");
      }
      return apiGet<UserSearchData>(
        `${API_ENDPOINTS.USER.SEARCH}?${params.toString()}`,
      );
    },
    enabled: Boolean(trimmed),
    retry: false,
  });
}

export function useFollowUser() {
  return useApiMutation<FollowResponse, string>({
    mutationFn: (userId) => apiPost<FollowResponse>(API_ENDPOINTS.USER.FOLLOW(userId), {}),
    invalidateKeys: [queryKeys.users.all],
  });
}

export function useUnfollowUser() {
  return useApiMutation<FollowResponse, string>({
    mutationFn: (userId) => apiDelete<FollowResponse>(API_ENDPOINTS.USER.FOLLOW(userId)),
    invalidateKeys: [queryKeys.users.all],
  });
}
