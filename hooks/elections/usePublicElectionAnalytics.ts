"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { apiGet } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { analyticsRefetchInterval } from "@/lib/elections/analytics";
import type { ElectionAnalytics } from "@/types/election";
import { ElectionStatus } from "@/types/enums";
import { keepPreviousData } from "@tanstack/react-query";

export function usePublicElectionAnalytics(
  slug: string,
  status?: ElectionStatus,
) {
  return useApiQuery<ElectionAnalytics>({
    queryKey: queryKeys.elections.analytics(slug),
    queryFn: () =>
      apiGet<ElectionAnalytics>(API_ENDPOINTS.ELECTIONS.ANALYTICS(slug)),
    enabled: Boolean(slug),
    staleTime: 0,
    placeholderData: keepPreviousData,
    refetchInterval: analyticsRefetchInterval(status),
  });
}
