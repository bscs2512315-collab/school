"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiDelete, apiGet, apiPost } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "@/hooks/api/useApiMutation";
import type { NovaChatSessionItem } from "@/components/nova/NovaChatSessionsPanel";
import type { ChatAction, ChatSource } from "@/types/bot";
import type { ChatMessageRow, ChatMessageAttachment } from "@/lib/nova/chat-messages";

export interface SendChatPayload {
  message: string;
  sessionId?: string;
  imageUrl?: string;
  imageUrls?: string[];
  imageMimeType?: string;
  attachments?: ChatMessageAttachment[];
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface UploadNovaAttachmentResult {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  type?: "image" | "file";
}

export type UploadNovaImageResult = UploadNovaAttachmentResult;

export interface SendChatResponse {
  reply: string;
  sessionId: string;
  sources: ChatSource[];
  actions: ChatAction[];
}

export interface GeneratePaperPayload {
  userId: string;
  subject: string;
  classLevel: string;
  board: string;
  paperType: string;
  chapterIds: string[];
  questionCount?: number;
  useSlos?: boolean;
}

export interface GeneratePaperResponse {
  generatedPaperId: string;
  paperType: number;
  subject: string;
  classLevel: string;
  board: string;
  totalMarks: number;
  totalQuestions: number;
  questions: unknown[];
}

export interface GenerateFromImagePayload {
  imageUrl: string;
  imageMimeType?: string;
  paperType: 1 | 2;
  questionCount?: number;
  title?: string;
  difficulty?: "Alpha" | "Beta" | "Gamma";
  userPrompt?: string;
}

export type GenerateFromImageResponse =
  | {
      mode: "custom_quiz";
      quizId: string;
      title: string;
      subject: string;
      paperType: string;
      totalQuestions: number;
    }
  | {
      mode: "practice_paper";
      generatedPaperId: string;
      paperType: number;
      subject: string;
      classLevel: string;
      board: string;
      totalMarks: number;
      totalQuestions: number;
      questions: unknown[];
      title: string;
    }
  | {
      mode: "teacher_draft";
      generatedPaperId: string;
      title: string;
      subject: string;
      classLevel: string;
      board: string;
      paperType: string;
      chapterIds: string[];
      totalMarks: number;
      totalQuestions: number;
      questions: unknown[];
    };

export function useNovaChatSessions() {
  return useApiQuery<NovaChatSessionItem[]>({
    queryKey: queryKeys.student.chat.sessions(),
    queryFn: () => apiGet<NovaChatSessionItem[]>(API_ENDPOINTS.STUDENT.CHAT),
  });
}

export function useNovaChatSession(sessionId?: string) {
  return useApiQuery<ChatMessageRow[]>({
    queryKey: queryKeys.student.chat.session(sessionId ?? "new"),
    queryFn: () => apiGet<ChatMessageRow[]>(API_ENDPOINTS.STUDENT.CHAT_SESSION(sessionId!)),
    enabled: Boolean(sessionId),
  });
}

export function useSendNovaMessage() {
  return useApiMutation<SendChatResponse, SendChatPayload>({
    mutationFn: (payload) => apiPost<SendChatResponse>(API_ENDPOINTS.STUDENT.CHAT, payload),
    invalidateKeys: [queryKeys.student.chat.sessions()],
  });
}

export function useDeleteNovaChatSession() {
  return useApiMutation<null, string>({
    mutationFn: (sessionId) => apiDelete<null>(API_ENDPOINTS.STUDENT.CHAT_SESSION(sessionId)),
    invalidateKeys: [queryKeys.student.chat.sessions()],
  });
}

export function useUploadNovaImage() {
  return useApiMutation<UploadNovaImageResult, FormData>({
    mutationFn: (formData) =>
      apiPost<UploadNovaImageResult>(API_ENDPOINTS.STUDENT.CHAT_UPLOAD, formData),
  });
}

export function useGeneratePracticePaper() {
  return useApiMutation<GeneratePaperResponse, GeneratePaperPayload>({
    mutationFn: (payload) =>
      apiPost<GeneratePaperResponse>(API_ENDPOINTS.STUDENT.GENERATE_PAPER, payload),
  });
}

export function useGeneratePaperFromImage() {
  return useApiMutation<GenerateFromImageResponse, GenerateFromImagePayload>({
    mutationFn: (payload) =>
      apiPost<GenerateFromImageResponse>(
        API_ENDPOINTS.STUDENT.CHAT_GENERATE_FROM_IMAGE,
        payload,
      ),
    invalidateKeys: [queryKeys.student.customQuizzes()],
  });
}

export async function fetchNovaChatSession(sessionId: string) {
  const response = await apiGet<ChatMessageRow[]>(API_ENDPOINTS.STUDENT.CHAT_SESSION(sessionId));
  if (!response.success) {
    throw new Error("Could not load this chat");
  }
  return response.data;
}
