"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet, apiPost } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "@/hooks/api/useApiMutation";

export interface UploadCurriculumResult {
  chaptersCount: number;
  analyzed: boolean;
}

export function useUploadAdminCurriculum() {
  return useApiMutation<UploadCurriculumResult, FormData>({
    mutationFn: (formData) =>
      apiPost<UploadCurriculumResult>(API_ENDPOINTS.ADMIN.CURRICULUM_UPLOAD, formData, {
        headers: { "Content-Type": undefined },
      }),
    invalidateKeys: [queryKeys.admin.curriculums()],
  });
}

interface CurriculumChaptersLookupParams {
  class: string;
  board: string;
  subject: string;
}

interface CurriculumChaptersLookupData {
  chapters: Array<{ id: string; chapterName: string }>;
}

export function useAdminCurriculumChaptersLookup(
  params: CurriculumChaptersLookupParams,
  enabled = false,
) {
  const query = new URLSearchParams({
    class: params.class,
    board: params.board,
    subject: params.subject,
  });

  return useApiQuery<CurriculumChaptersLookupData>({
    queryKey: [...queryKeys.admin.all, "curriculum-chapters-lookup", params] as const,
    queryFn: () =>
      apiGet<CurriculumChaptersLookupData>(
        `${API_ENDPOINTS.ADMIN.CURRICULUM_CHAPTERS_LOOKUP}?${query.toString()}`,
      ),
    enabled: enabled && Boolean(params.class && params.board && params.subject),
    retry: false,
  });
}

export function useUploadAdminPastPaper() {
  return useApiMutation<unknown, FormData>({
    mutationFn: (formData) =>
      apiPost(API_ENDPOINTS.ADMIN.PAST_PAPER_UPLOAD, formData, {
        headers: { "Content-Type": undefined },
      }),
    invalidateKeys: [queryKeys.admin.pastPapers()],
  });
}

interface CreatePastPaperPayload {
  class: string;
  board: string;
  subject: string;
  year: number;
  paperNumber: number;
  strictMode?: boolean;
  allowResume?: boolean;
  questions: unknown[];
}

export function useCreateAdminPastPaper() {
  return useApiMutation<unknown, CreatePastPaperPayload>({
    mutationFn: (payload) => apiPost(API_ENDPOINTS.ADMIN.PAST_PAPER_CREATE, payload),
    invalidateKeys: [queryKeys.admin.pastPapers()],
  });
}

export function useUploadQuestionImage() {
  return useApiMutation<{ fileUrl: string; fileName: string }, FormData>({
    mutationFn: (formData) =>
      apiPost<{ fileUrl: string; fileName: string }>(API_ENDPOINTS.ADMIN.QUESTIONS_UPLOAD_IMAGE, formData, {
        headers: { "Content-Type": undefined },
      }),
  });
}

export interface AutoExtractResponse {
  extractedQuestions: any[];
  removedQuestions: Array<{
    questionNumber: number;
    questionText: string;
    reason: string;
  }>;
  totalQuestions: number;
  diagramsAttached: number;
  chapters: Array<{ id: string; chapterName: string }>;
}

export function useAutoExtractPastPaper() {
  return useApiMutation<AutoExtractResponse, FormData>({
    mutationFn: (formData) =>
      apiPost<AutoExtractResponse>(API_ENDPOINTS.ADMIN.PAST_PAPER_AUTO_EXTRACT, formData, {
        headers: { "Content-Type": undefined },
      }),
  });
}

export interface AutoExtractSyllabusResponse {
  extracted: Array<{
    classLevel: string;
    board: string;
    subject: string;
    chapters: Array<{
      chapterNumber: number;
      chapterName: string;
      subtopics: any[];
    }>;
  }>;
  saved?: Array<{
    curriculumId: string;
    classLevel: string;
    board: string;
    subject: string;
    chaptersCount: number;
    totalSLOsCount: number;
    isNew: boolean;
  }>;
}

export function useAutoExtractSyllabus() {
  return useApiMutation<AutoExtractSyllabusResponse, FormData | { pdfUrl?: string; text?: string; subject?: string; classLevel?: string; board?: string; save?: boolean }>({
    mutationFn: (payload) => {
      if (payload instanceof FormData) {
        return apiPost<AutoExtractSyllabusResponse>(API_ENDPOINTS.ADMIN.SYLLABUS_AUTO_EXTRACT, payload, {
          headers: { "Content-Type": undefined },
        });
      }
      return apiPost<AutoExtractSyllabusResponse>(API_ENDPOINTS.ADMIN.SYLLABUS_AUTO_EXTRACT, payload);
    },
    invalidateKeys: [queryKeys.admin.curriculums()],
  });
}

