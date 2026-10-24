"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/constants/endpoints";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { analyticsRefetchInterval } from "@/lib/elections/analytics";
import type {
  ElectionAnalytics,
  ElectionDetail,
  ElectionEvent,
  ElectionVotesPayload,
} from "@/types/election";
import { ElectionStatus } from "@/types/enums";

export function useTeacherElections() {
  return useApiQuery<ElectionEvent[]>({
    queryKey: queryKeys.teacher.elections(),
    queryFn: () => apiGet<ElectionEvent[]>(API_ENDPOINTS.TEACHER.ELECTIONS),
  });
}

export function useTeacherElection(id?: string) {
  return useApiQuery<ElectionDetail>({
    queryKey: queryKeys.teacher.election(id ?? "unknown"),
    queryFn: () => apiGet<ElectionDetail>(API_ENDPOINTS.TEACHER.ELECTION(id!)),
    enabled: Boolean(id),
  });
}

export function useTeacherElectionVotes(id?: string, status?: ElectionStatus) {
  return useApiQuery<ElectionVotesPayload>({
    queryKey: queryKeys.teacher.electionVotes(id ?? "unknown"),
    queryFn: () =>
      apiGet<ElectionVotesPayload>(API_ENDPOINTS.TEACHER.ELECTION_VOTES(id!)),
    enabled: Boolean(id),
    staleTime: 0,
    placeholderData: keepPreviousData,
    refetchInterval: analyticsRefetchInterval(status),
  });
}

export function useTeacherElectionAnalytics(
  id?: string,
  status?: ElectionStatus,
) {
  return useApiQuery<ElectionAnalytics>({
    queryKey: queryKeys.teacher.electionAnalytics(id ?? "unknown"),
    queryFn: () =>
      apiGet<ElectionAnalytics>(API_ENDPOINTS.TEACHER.ELECTION_ANALYTICS(id!)),
    enabled: Boolean(id),
    staleTime: 0,
    placeholderData: keepPreviousData,
    refetchInterval: analyticsRefetchInterval(status),
  });
}
