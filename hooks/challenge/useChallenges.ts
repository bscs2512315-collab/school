"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet, apiPost } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "@/hooks/api/useApiMutation";
import type {
  ChallengeDetail,
  ChallengeSubmitResult,
  ChallengeSummary,
  CreateChallengePayload,
  CreateChallengeResponse,
  GeneratePaperChapter,
} from "@/types/challenge";

export function useChallenges() {
  return useApiQuery<ChallengeSummary[]>({
    queryKey: queryKeys.challenges.list(),
    queryFn: () => apiGet<ChallengeSummary[]>(API_ENDPOINTS.CHALLENGES.LIST),
    retry: false,
  });
}

export function useChallengeDetail(challengeId?: string, refetchInterval?: number | false) {
  return useApiQuery<ChallengeDetail>({
    queryKey: queryKeys.challenges.detail(challengeId ?? "unknown"),
    queryFn: () => apiGet<ChallengeDetail>(API_ENDPOINTS.CHALLENGES.BY_ID(challengeId!)),
    enabled: Boolean(challengeId),
    refetchInterval,
    retry: false,
  });
}

interface GenerateChaptersParams {
  subject: string;
  class: string;
  board: string;
  paperType: string;
}

export function useGeneratePaperChapters(params: GenerateChaptersParams, enabled = false) {
  const query = new URLSearchParams({
    subject: params.subject,
    class: params.class,
    board: params.board,
    paperType: params.paperType,
  });

  return useApiQuery<GeneratePaperChapter[]>({
    queryKey: [...queryKeys.student.all, "generate-chapters", params] as const,
    queryFn: () =>
      apiGet<GeneratePaperChapter[]>(
        `${API_ENDPOINTS.STUDENT.GENERATE_PAPER_CHAPTERS}?${query.toString()}`,
      ),
    enabled: enabled && Boolean(params.subject),
    retry: false,
  });
}

export function useCreateChallenge() {
  return useApiMutation<CreateChallengeResponse, CreateChallengePayload>({
    mutationFn: (payload) => apiPost<CreateChallengeResponse>(API_ENDPOINTS.CHALLENGES.LIST, payload),
    invalidateKeys: [queryKeys.challenges.list()],
  });
}

export function useRespondChallenge(challengeId: string) {
  return useApiMutation<unknown, { action: "accept" | "decline" }>({
    mutationFn: (payload) => apiPost(API_ENDPOINTS.CHALLENGES.RESPOND(challengeId), payload),
    invalidateKeys: [queryKeys.challenges.list(), queryKeys.challenges.detail(challengeId)],
  });
}

export function useRespondToChallenge() {
  return useApiMutation<unknown, { challengeId: string; action: "accept" | "decline" }>({
    mutationFn: ({ challengeId, action }) =>
      apiPost(API_ENDPOINTS.CHALLENGES.RESPOND(challengeId), { action }),
    invalidateKeys: [queryKeys.challenges.all],
  });
}

interface SubmitChallengePayload {
  answers: Record<string, string>;
  timeTaken: number;
}

export function useSubmitChallenge(challengeId: string) {
  return useApiMutation<ChallengeSubmitResult, SubmitChallengePayload>({
    mutationFn: (payload) => apiPost<ChallengeSubmitResult>(API_ENDPOINTS.CHALLENGES.SUBMIT(challengeId), payload),
    invalidateKeys: [queryKeys.challenges.detail(challengeId), queryKeys.challenges.list()],
  });
}
