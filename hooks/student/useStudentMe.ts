"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import type { StudentMe } from "@/types/student";

export function useStudentMe() {
  return useApiQuery<StudentMe>({
    queryKey: queryKeys.student.me(),
    queryFn: () => apiGet<StudentMe>(API_ENDPOINTS.STUDENT.ME),
    retry: false,
  });
}
