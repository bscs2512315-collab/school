"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet, apiPost, apiPut } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "@/hooks/api/useApiMutation";
import type { FollowListData, UserProfile, UserProfileView } from "@/types/user";

export function useUserProfile() {
  return useApiQuery<UserProfile>({
    queryKey: queryKeys.user.profile(),
    queryFn: () => apiGet<UserProfile>(API_ENDPOINTS.USER.PROFILE),
  });
}

export function useUpdateUserProfile() {
  return useApiMutation<UserProfile, Record<string, unknown>>({
    mutationFn: (payload) => apiPut<UserProfile>(API_ENDPOINTS.USER.PROFILE, payload),
    invalidateKeys: [queryKeys.user.profile(), queryKeys.student.me()],
  });
}

export function useUploadUserAvatar() {
  return useApiMutation<{ profileImage: string }, FormData>({
    mutationFn: (formData) =>
      apiPost<{ profileImage: string }>(API_ENDPOINTS.USER.PROFILE_AVATAR, formData, {
        headers: { "Content-Type": undefined },
      }),
    invalidateKeys: [queryKeys.user.profile()],
  });
}

export function useUserById(userId?: string) {
  return useApiQuery<UserProfileView>({
    queryKey: queryKeys.users.profile(userId ?? "unknown"),
    queryFn: () => apiGet<UserProfileView>(API_ENDPOINTS.USER.BY_ID(userId!)),
    enabled: Boolean(userId),
    retry: false,
  });
}

export function useUserFollowers(
  userId?: string,
  type: "followers" | "following" = "followers",
  limit = 50,
) {
  return useApiQuery<FollowListData>({
    queryKey: queryKeys.users.followers(userId ?? "unknown", type),
    queryFn: () =>
      apiGet<FollowListData>(
        `${API_ENDPOINTS.USER.FOLLOWERS(userId!)}?type=${type}&limit=${limit}`,
      ),
    enabled: Boolean(userId),
    retry: false,
  });
}
