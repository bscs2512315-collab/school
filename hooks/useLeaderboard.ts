"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import type { LeaderboardSchool, LeaderboardUser } from "@/types/leaderboard";

export function useLeaderboard(
  params?: Record<string, string>,
  options?: { enabled?: boolean },
) {
  return useApiQuery<LeaderboardUser[]>({
    queryKey: [...queryKeys.leaderboard.all, "students", params ?? {}],
    queryFn: () => apiGet<LeaderboardUser[]>(API_ENDPOINTS.LEADERBOARD, { params }),
    retry: false,
    staleTime: 1000 * 60 * 2, // 2 minutes fresh cache
    gcTime: 1000 * 60 * 10,   // 10 minutes memory persistence
    enabled: options?.enabled,
  });
}

export function useSchoolLeaderboard(
  params?: Record<string, string>,
  options?: { enabled?: boolean },
) {
  return useApiQuery<LeaderboardSchool[]>({
    queryKey: [...queryKeys.leaderboard.all, "schools", params ?? {}],
    queryFn: () =>
      apiGet<LeaderboardSchool[]>(API_ENDPOINTS.LEADERBOARD, {
        params: { ...params, type: "schools" },
      }),
    retry: false,
    staleTime: 1000 * 60 * 2, // 2 minutes fresh cache
    gcTime: 1000 * 60 * 10,   // 10 minutes memory persistence
    enabled: options?.enabled,
  });
}
