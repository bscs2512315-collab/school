"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import apiInstance from "@/lib/api-instance";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "@/hooks/api/useApiMutation";
import type {
  AdminMilestone,
  AdminPastPaperDetailApiData,
  PastPaperDetail,
  PastPaperQuestionsData,
  ReviewExamAttempt,
  ReviewExamDetailAttempt,
  ReviewExamDetailData,
  ReviewExamsFilters,
  ReviewExamQuestion,
  ReviewExamsListData,
} from "@/types/past-paper";

function normalizePastPaperDetail(data: AdminPastPaperDetailApiData): PastPaperDetail {
  if ("pastPaper" in data && data.pastPaper) {
    return data.pastPaper;
  }
  return data as PastPaperDetail;
}

export function useAdminPastPaperDetail(paperId?: string) {
  return useApiQuery<PastPaperDetail>({
    queryKey: queryKeys.admin.pastPaper(paperId ?? "unknown"),
    queryFn: async () => {
      const response = await apiGet<AdminPastPaperDetailApiData>(
        API_ENDPOINTS.ADMIN.PAST_PAPER_BY_ID(paperId!),
      );
      if (!response.success) {
        throw new Error("Request failed");
      }
      return {
        success: true,
        message: response.message,
        data: normalizePastPaperDetail(response.data),
      };
    },
    enabled: Boolean(paperId),
    retry: false,
  });
}

export function useAdminPastPaperQuestions(paperId?: string) {
  return useApiQuery<PastPaperQuestionsData>({
    queryKey: queryKeys.admin.pastPaperQuestions(paperId ?? "unknown"),
    queryFn: () => apiGet<PastPaperQuestionsData>(API_ENDPOINTS.ADMIN.PAST_PAPER_QUESTIONS(paperId!)),
    enabled: Boolean(paperId),
    retry: false,
  });
}

export function useSaveAdminPastPaperQuestions(paperId: string) {
  return useApiMutation<unknown, { questions: unknown[] }>({
    mutationFn: (payload) =>
      apiPost(API_ENDPOINTS.ADMIN.PAST_PAPER_QUESTIONS(paperId), payload),
    invalidateKeys: [queryKeys.admin.pastPaper(paperId), queryKeys.admin.pastPaperQuestions(paperId)],
  });
}

function buildReviewExamsUrl(filters: ReviewExamsFilters): string {
  const params = new URLSearchParams({
    status: filters.status ?? "pending",
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 20),
  });

  return `${API_ENDPOINTS.ADMIN.REVIEW_EXAMS}?${params.toString()}`;
}

export function useAdminReviewExams(filters: ReviewExamsFilters = {}) {
  return useApiQuery<ReviewExamsListData>({
    queryKey: queryKeys.admin.reviewExams(filters),
    queryFn: async () => {
      const response = (await apiInstance.get(buildReviewExamsUrl(filters))) as {
        success: boolean;
        attempts?: ReviewExamAttempt[];
        pagination?: ReviewExamsListData["pagination"];
        counts?: ReviewExamsListData["counts"];
        message?: string;
      };
      if (!response.success) {
        throw new Error("Request failed");
      }
      return {
        success: true,
        message: response.message ?? "",
        data: {
          attempts: response.attempts ?? [],
          pagination: response.pagination ?? {
            page: filters.page ?? 1,
            limit: filters.limit ?? 20,
            total: response.attempts?.length ?? 0,
            totalPages: 1,
          },
          counts: response.counts ?? {
            pending: 0,
            graded: 0,
            total: 0,
          },
        },
      };
    },
    retry: false,
  });
}

export function useAdminReviewExamDetail(attemptId?: string) {
  return useApiQuery<ReviewExamDetailData>({
    queryKey: queryKeys.admin.reviewExam(attemptId ?? "unknown"),
    queryFn: async () => {
      const response = (await apiInstance.get(
        API_ENDPOINTS.ADMIN.REVIEW_EXAM_BY_ID(attemptId!),
      )) as {
        success: boolean;
        attempt?: ReviewExamDetailAttempt;
        questions?: ReviewExamQuestion[];
        message?: string;
      };
      if (!response.success || !response.attempt) {
        throw new Error(response.message ?? "Failed to load details");
      }
      return {
        success: true,
        message: response.message ?? "",
        data: {
          attempt: response.attempt,
          questions: response.questions ?? [],
        },
      };
    },
    enabled: Boolean(attemptId),
    retry: false,
  });
}

interface GradeExamPayload {
  gradingResults: Record<
    string,
    { score: number; maxMarks: number; feedback: string; imageUrl: string | null }
  >;
}

export function useGradeAdminReviewExam(attemptId: string) {
  return useApiMutation<unknown, GradeExamPayload>({
    mutationFn: (payload) => apiPost(API_ENDPOINTS.ADMIN.REVIEW_EXAM_GRADE(attemptId), payload),
    invalidateKeys: [queryKeys.admin.reviewExams(), queryKeys.admin.reviewExam(attemptId)],
  });
}

export function useAdminSetting(key: string) {
  return useApiQuery<string | null>({
    queryKey: queryKeys.admin.settings(key),
    queryFn: async () => {
      const response = (await apiInstance.get(API_ENDPOINTS.ADMIN.SETTINGS_BY_KEY(key))) as {
        success: boolean;
        value?: string | null;
        message?: string;
      };
      if (!response.success) {
        throw new Error("Request failed");
      }
      return {
        success: true,
        message: response.message ?? "",
        data: response.value ?? null,
      };
    },
    retry: false,
  });
}

export function useUpdateAdminSetting() {
  return useApiMutation<unknown, { key: string; value: string }>({
    mutationFn: (payload) => apiPost(API_ENDPOINTS.ADMIN.SETTINGS, payload),
    invalidateKeys: [queryKeys.admin.all],
  });
}

export function useAdminMilestones() {
  return useApiQuery<AdminMilestone[]>({
    queryKey: queryKeys.admin.milestones(),
    queryFn: () => apiGet<AdminMilestone[]>(API_ENDPOINTS.ADMIN.MILESTONES),
    retry: false,
  });
}

interface MilestonePayload {
  level: number;
  name: string;
  points_required: number;
  icon: string;
  color: string;
  bg_color: string;
}

export function useCreateAdminMilestone() {
  return useApiMutation<AdminMilestone, MilestonePayload>({
    mutationFn: (payload) => apiPost<AdminMilestone>(API_ENDPOINTS.ADMIN.MILESTONES, payload),
    invalidateKeys: [queryKeys.admin.milestones()],
  });
}

export function useUpdateAdminMilestone() {
  return useApiMutation<AdminMilestone, { id: number; payload: MilestonePayload }>({
    mutationFn: ({ id, payload }) =>
      apiPut<AdminMilestone>(API_ENDPOINTS.ADMIN.MILESTONE_BY_ID(String(id)), payload),
    invalidateKeys: [queryKeys.admin.milestones()],
  });
}

export function useDeleteAdminMilestone() {
  return useApiMutation<null, number>({
    mutationFn: (id) => apiDelete<null>(API_ENDPOINTS.ADMIN.MILESTONE_BY_ID(String(id))),
    invalidateKeys: [queryKeys.admin.milestones()],
  });
}

interface UpdatePastPaperPayload {
  paperId: string;
  payload: Record<string, unknown>;
}

export function useUpdateAdminPastPaper() {
  return useApiMutation<unknown, UpdatePastPaperPayload>({
    mutationFn: ({ paperId, payload }) =>
      apiPut(API_ENDPOINTS.ADMIN.PAST_PAPER_BY_ID(paperId), payload),
    invalidateKeys: [queryKeys.admin.all],
  });
}
