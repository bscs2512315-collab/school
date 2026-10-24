"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiDelete, apiGet, apiPatch } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "@/hooks/api/useApiMutation";
import type { NotificationsListData } from "@/types/notifications";

const NOTIFICATIONS_PAGE_SIZE = 15;

export function useNotificationSummary(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  return useApiQuery<NotificationsListData>({
    queryKey: queryKeys.notifications.summary(),
    queryFn: () =>
      apiGet<NotificationsListData>(
        `${API_ENDPOINTS.NOTIFICATIONS.LIST}?limit=1&offset=0`,
      ),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 30_000,
    retry: false,
  });
}

export function useInfiniteNotifications(options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(NOTIFICATIONS_PAGE_SIZE),
    queryFn: async ({ pageParam }) => {
      const response = await apiGet<NotificationsListData>(
        `${API_ENDPOINTS.NOTIFICATIONS.LIST}?limit=${NOTIFICATIONS_PAGE_SIZE}&offset=${pageParam}`,
      );
      if (!response.success) {
        throw new Error("Request failed");
      }
      return response.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) {
        return undefined;
      }
      return lastPage.offset + lastPage.limit;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useNotificationsList() {
  return useApiQuery<NotificationsListData>({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => apiGet<NotificationsListData>(API_ENDPOINTS.NOTIFICATIONS.LIST),
  });
}

export function useMarkNotificationsRead() {
  return useApiMutation<null, { ids?: string[] }>({
    mutationFn: (payload) => apiPatch<null>(API_ENDPOINTS.NOTIFICATIONS.LIST, payload),
    invalidateKeys: [queryKeys.notifications.all],
  });
}

export function useDeleteNotification() {
  return useApiMutation<null, string>({
    mutationFn: (notificationId) =>
      apiDelete<null>(API_ENDPOINTS.NOTIFICATIONS.BY_ID(notificationId)),
    invalidateKeys: [queryKeys.notifications.all],
  });
}
