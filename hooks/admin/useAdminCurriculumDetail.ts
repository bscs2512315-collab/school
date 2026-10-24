"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "@/hooks/api/useApiMutation";

export interface AdminCurriculumChapter {
  id: string;
  chapterNumber: number;
  chapterName: string;
  content: string;
  contentType: string;
  isAnalyzed: boolean;
  analyzed_content?: unknown;
  analyzedContent?: { subtopics?: unknown[] };
}

export interface AdminCurriculumDetail {
  id: string;
  class: string;
  board: string;
  subject: string;
  chaptersCount: number;
  chapters: AdminCurriculumChapter[];
}

interface SaveSyllabusPayload {
  classLevel: string;
  board: string;
  subject: string;
  chapters: Array<{
    chapterNumber: number;
    chapterName: string;
    subtopics: unknown[];
  }>;
}

export function useAdminCurriculumDetail(curriculumId?: string) {
  return useApiQuery<AdminCurriculumDetail>({
    queryKey: queryKeys.admin.curriculum(curriculumId ?? "unknown"),
    queryFn: () => apiGet<AdminCurriculumDetail>(API_ENDPOINTS.ADMIN.CURRICULUM_BY_ID(curriculumId!)),
    enabled: Boolean(curriculumId),
  });
}

export function useSaveSyllabus() {
  return useApiMutation<unknown, SaveSyllabusPayload>({
    mutationFn: (payload) => apiPost(API_ENDPOINTS.ADMIN.SYLLABUS_SAVE, payload),
    invalidateKeys: [queryKeys.admin.all],
  });
}

export interface EditableChapter {
  id: string;
  chapterNumber: number;
  chapterName: string;
}

interface SaveChaptersPayload {
  curriculumId: string;
  chapters: EditableChapter[];
}

export function useSaveAdminCurriculumChapters() {
  return useApiMutation<void, SaveChaptersPayload>({
    mutationFn: async ({ curriculumId, chapters }) => {
      const currentResponse = await apiGet<AdminCurriculumDetail>(
        API_ENDPOINTS.ADMIN.CURRICULUM_BY_ID(curriculumId),
      );
      const currentChapters = currentResponse.data?.chapters ?? [];
      const newChapterIds = new Set(
        chapters.filter((ch) => !ch.id.startsWith("temp-")).map((ch) => ch.id),
      );

      for (const currentChapter of currentChapters) {
        if (!newChapterIds.has(currentChapter.id)) {
          await apiDelete(API_ENDPOINTS.ADMIN.CURRICULUM_CHAPTER(curriculumId, currentChapter.id));
        }
      }

      for (const chapter of chapters) {
        if (chapter.id.startsWith("temp-")) {
          await apiPost(API_ENDPOINTS.ADMIN.CURRICULUM_CHAPTERS(curriculumId), {
            chapterNumber: chapter.chapterNumber,
            chapterName: chapter.chapterName,
          });
        } else {
          await apiPut(API_ENDPOINTS.ADMIN.CURRICULUM_CHAPTER(curriculumId, chapter.id), {
            chapterNumber: chapter.chapterNumber,
            chapterName: chapter.chapterName,
          });
        }
      }

      return { success: true, message: "", data: undefined };
    },
    invalidateKeys: [queryKeys.admin.all],
  });
}

export interface AdminCurriculumChapterListItem {
  id: string;
  chapterNumber: number;
  chapterName: string;
  description?: string | null;
  contentType: string;
  isAnalyzed: boolean;
}

interface CreateCurriculumPayload {
  class: string;
  board: string;
  subject: string;
  chapters: Array<{ chapterNumber: number; chapterName: string }>;
}

export function useCreateAdminCurriculum() {
  return useApiMutation<unknown, CreateCurriculumPayload>({
    mutationFn: (payload) => apiPost(API_ENDPOINTS.ADMIN.CURRICULUM_CREATE, payload),
    invalidateKeys: [queryKeys.admin.curriculums()],
  });
}

export function useAdminCurriculumChapters(curriculumId?: string) {
  return useApiQuery<AdminCurriculumChapterListItem[]>({
    queryKey: queryKeys.admin.curriculumChapters(curriculumId ?? "unknown"),
    queryFn: () =>
      apiGet<AdminCurriculumChapterListItem[]>(
        API_ENDPOINTS.ADMIN.CURRICULUM_CHAPTERS(curriculumId!),
      ),
    enabled: Boolean(curriculumId),
    retry: false,
  });
}

export function useAddAdminCurriculumChapter(curriculumId: string) {
  return useApiMutation<unknown, FormData>({
    mutationFn: (formData) =>
      apiPost(API_ENDPOINTS.ADMIN.CURRICULUM_CHAPTERS(curriculumId), formData, {
        headers: { "Content-Type": undefined },
      }),
    invalidateKeys: [
      queryKeys.admin.curriculum(curriculumId),
      queryKeys.admin.curriculumChapters(curriculumId),
    ],
  });
}

interface ParseSyllabusPayload {
  text: string;
}

export function useParseSyllabus() {
  return useApiMutation<unknown[], ParseSyllabusPayload>({
    mutationFn: (payload) => apiPost<unknown[]>(API_ENDPOINTS.ADMIN.SYLLABUS_PARSE, payload),
  });
}
