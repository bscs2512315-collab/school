"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet, apiPost, apiPut } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "@/hooks/api/useApiMutation";
import type { BotSettings, PaperIIExemplar } from "@/types/bot";

export interface BotKnowledgeStats {
  total: number;
  withEmbeddings: number;
  byType: Record<string, number>;
}

export function useAdminBotExemplars() {
  return useApiQuery<PaperIIExemplar[]>({
    queryKey: queryKeys.admin.bot.exemplars(),
    queryFn: () =>
      apiGet<PaperIIExemplar[]>(`${API_ENDPOINTS.ADMIN.BOT.EXEMPLARS}?hasExemplars=true`),
    retry: false,
  });
}

export function useAdminBotKnowledge() {
  return useApiQuery<BotKnowledgeStats>({
    queryKey: queryKeys.admin.bot.knowledge(),
    queryFn: () => apiGet<BotKnowledgeStats>(API_ENDPOINTS.ADMIN.BOT.KNOWLEDGE),
    retry: false,
  });
}

export function useAdminBotSettings() {
  return useApiQuery<BotSettings>({
    queryKey: queryKeys.admin.bot.settings(),
    queryFn: () => apiGet<BotSettings>(API_ENDPOINTS.ADMIN.BOT.SETTINGS),
    retry: false,
  });
}

export function useSyncAdminBotKnowledge() {
  return useApiMutation<{ total: number }, void>({
    mutationFn: () => apiPost<{ total: number }>(API_ENDPOINTS.ADMIN.BOT.KNOWLEDGE),
    invalidateKeys: [queryKeys.admin.bot.knowledge()],
  });
}

interface UpdateExemplarPayload {
  id: string;
  paperIIData: PaperIIExemplar["paperIIData"];
}

export function useUpdateAdminBotExemplar() {
  return useApiMutation<unknown, UpdateExemplarPayload>({
    mutationFn: ({ id, paperIIData }) =>
      apiPut(API_ENDPOINTS.ADMIN.BOT.EXEMPLAR_BY_ID(id), { paperIIData }),
    invalidateKeys: [queryKeys.admin.bot.exemplars()],
  });
}

export function useUpdateAdminBotSettings() {
  return useApiMutation<BotSettings, BotSettings>({
    mutationFn: (settings) => apiPut<BotSettings>(API_ENDPOINTS.ADMIN.BOT.SETTINGS, settings),
    invalidateKeys: [queryKeys.admin.bot.settings()],
  });
}

interface BotTestPayload {
  message: string;
}

export interface BotTestResult {
  blocked?: boolean;
  reply: string;
  classification?: { intent: string; confidence: number };
  sources?: Array<{ label: string }>;
}

export function useTestAdminBot() {
  return useApiMutation<BotTestResult, BotTestPayload>({
    mutationFn: (payload) => apiPost(API_ENDPOINTS.ADMIN.BOT.TEST, payload),
  });
}
