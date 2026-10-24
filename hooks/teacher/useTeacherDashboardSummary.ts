"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";

export interface DashboardStudent {
  id: string;
  name: string;
  class: string;
  profile_image: string | null;
  avg_score: number;
  attempts_count: number;
}

export interface TeacherDashboardSummary {
  studentCount: number;
  avgScore: number;
  topStudents: DashboardStudent[];
}

export function useTeacherDashboardSummary() {
  return useApiQuery<TeacherDashboardSummary>({
    queryKey: queryKeys.teacher.dashboardSummary(),
    queryFn: () => apiGet<TeacherDashboardSummary>(API_ENDPOINTS.TEACHER.DASHBOARD_SUMMARY),
  });
}
