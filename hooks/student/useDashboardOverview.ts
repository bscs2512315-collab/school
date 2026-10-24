"use client";

import { apiGet } from "@/lib/api/api-client";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { queryKeys } from "@/lib/api/query-keys";
import type { LeaderboardSchool, LeaderboardUser } from "@/types/leaderboard";
import type { StudentHistoryItem } from "@/types/student";
import type { PastPaperSummary } from "@/types/past-paper";

export interface DashboardOverview {
  students: LeaderboardUser[];
  schools: LeaderboardSchool[];
  rank: number | null;
  history: StudentHistoryItem[];
  pastPapers: PastPaperSummary[];
}

export function useDashboardOverview(userId?: string) {
  return useApiQuery<DashboardOverview>({
    queryKey: [...queryKeys.student.all, "dashboard-overview", userId ?? "unknown"],
    queryFn: () => apiGet<DashboardOverview>("/student/dashboard/overview"),
    retry: false,
    staleTime: 0,
    gcTime: 10 * 60_000,
    enabled: Boolean(userId),
  });
}
