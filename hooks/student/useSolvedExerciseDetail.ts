"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import type { SolvedExerciseDetail } from "@/types/solved-notes";

export function useSolvedExerciseDetail(id: string) {
  return useApiQuery<SolvedExerciseDetail>({
    queryKey: queryKeys.student.solvedExercise(id),
    queryFn: () => apiGet<SolvedExerciseDetail>(API_ENDPOINTS.STUDENT.SOLVED_NOTES_BY_ID(id)),
    enabled: Boolean(id),
  });
}
