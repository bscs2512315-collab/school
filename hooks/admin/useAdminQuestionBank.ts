"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiDelete, apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "@/hooks/api/useApiMutation";
import type {
  QuestionBankData,
  QuestionBankFilters,
  QuestionBankChaptersData,
  QuestionBankSummary,
} from "@/types/question-bank";

function buildQuestionsUrl(filters: QuestionBankFilters): string {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 20),
  });

  if (filters.class) {
    params.append("class", filters.class);
  }
  if (filters.board) {
    params.append("board", filters.board);
  }
  if (filters.subject) {
    params.append("subject", filters.subject);
  }
  if (filters.questionType) {
    params.append("questionType", filters.questionType);
  }
  if (filters.paperNumber) {
    params.append("paperNumber", String(filters.paperNumber));
  }
  if (filters.chapterName) {
    params.append("chapterName", filters.chapterName);
  }
  if (filters.search) {
    params.append("search", filters.search);
  }

  return `${API_ENDPOINTS.ADMIN.QUESTIONS}?${params.toString()}`;
}

export function useAdminQuestionBankSummary() {
  return useApiQuery<QuestionBankSummary>({
    queryKey: queryKeys.admin.questionsSummary(),
    queryFn: () => apiGet<QuestionBankSummary>(API_ENDPOINTS.ADMIN.QUESTIONS_SUMMARY),
    retry: false,
  });
}

export function useAdminQuestions(filters: QuestionBankFilters, enabled = true) {
  return useApiQuery<QuestionBankData>({
    queryKey: queryKeys.admin.questions(filters),
    queryFn: () => apiGet<QuestionBankData>(buildQuestionsUrl(filters)),
    retry: false,
    enabled,
  });
}

function buildChaptersUrl(filters: {
  class: string;
  subject: string;
  paperNumber: number;
}): string {
  const params = new URLSearchParams({
    class: filters.class,
    subject: filters.subject,
    paperNumber: String(filters.paperNumber),
  });

  return `${API_ENDPOINTS.ADMIN.QUESTIONS_CHAPTERS}?${params.toString()}`;
}

export function useAdminQuestionBankChapters(
  filters: { class: string; subject: string; paperNumber: number } | null,
) {
  return useApiQuery<QuestionBankChaptersData>({
    queryKey: filters
      ? queryKeys.admin.questionsChapters(filters)
      : [...queryKeys.admin.all, "questions", "chapters", "idle"],
    queryFn: () => apiGet<QuestionBankChaptersData>(buildChaptersUrl(filters!)),
    retry: false,
    enabled: Boolean(filters),
  });
}

export function useDeleteAdminQuestion() {
  return useApiMutation<null, string>({
    mutationFn: (questionId) =>
      apiDelete<null>(`${API_ENDPOINTS.ADMIN.QUESTIONS}?id=${questionId}`),
    invalidateKeys: [queryKeys.admin.all],
  });
}
