"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";

export interface TeacherPendingPaper {
  id: string;
  user_id?: string;
  paper_id?: string;
  classroom_name?: string | null;
  subject: string;
  created_at: string;
  student_name: string;
  student_image: string | null;
}

export function useTeacherPendingPapers(enabled = true) {
  return useApiQuery<TeacherPendingPaper[]>({
    queryKey: queryKeys.teacher.pendingPapers(),
    queryFn: () =>
      apiGet<TeacherPendingPaper[]>(API_ENDPOINTS.TEACHER.PENDING_PAPERS),
    enabled,
  });
}
