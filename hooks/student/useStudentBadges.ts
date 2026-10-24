"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import type { StudentBadgesResponse, UserBadgeStatus, PeriodicHonorBadge, ActivePeriodRace } from "@/lib/gamification/badges";

export function useStudentBadges() {
  return useApiQuery<StudentBadgesResponse>({
    queryKey: queryKeys.student.badges(),
    queryFn: () => apiGet<StudentBadgesResponse>(API_ENDPOINTS.STUDENT.BADGES),
    retry: false,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export type { StudentBadgesResponse, UserBadgeStatus, PeriodicHonorBadge, ActivePeriodRace };
