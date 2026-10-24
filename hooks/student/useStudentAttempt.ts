"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiPost } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiMutation } from "@/hooks/api/useApiMutation";

export function useUploadStudentAnswer() {
  return useApiMutation<{ fileUrl: string; fileName: string }, FormData>({
    mutationFn: (formData) =>
      apiPost<{ fileUrl: string; fileName: string }>(API_ENDPOINTS.STUDENT.ANSWERS_UPLOAD, formData, {
        headers: { "Content-Type": undefined },
      }),
  });
}

export function useSubmitPaper1Attempt() {
  return useApiMutation<unknown, Record<string, unknown>>({
    mutationFn: (payload) => apiPost(API_ENDPOINTS.STUDENT.ATTEMPT, payload),
    invalidateKeys: [queryKeys.student.history()],
  });
}

export function useSubmitPaper2Attempt() {
  return useApiMutation<unknown, Record<string, unknown>>({
    mutationFn: (payload) => apiPost(API_ENDPOINTS.STUDENT.ATTEMPT_PAPER2, payload),
    invalidateKeys: [queryKeys.student.history()],
  });
}
