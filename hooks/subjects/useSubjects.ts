"use client";

import { API_ENDPOINTS } from "@/constants/endpoints";
import apiInstance from "@/lib/api-instance";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/api-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "@/hooks/api/useApiMutation";

export interface Subject {
  id: string;
  name: string;
  category?: string | null;
}

export interface AdminSubject extends Subject {
  coming_soon: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Public list of active subjects (used app-wide for filters and dropdowns).
 * The public endpoint returns a raw array, so we wrap it for useApiQuery.
 */
export function useSubjects() {
  return useApiQuery<Subject[]>({
    queryKey: queryKeys.subjects.list(),
    queryFn: async () => {
      const data = (await apiInstance.get(API_ENDPOINTS.SUBJECTS)) as Subject[];
      return { success: true, message: "", data: Array.isArray(data) ? data : [] };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/** Convenience: active subject names as string[] (empty while loading). */
export function useSubjectNames(): string[] {
  const { data } = useSubjects();
  return (data ?? []).map((s) => s.name);
}

/**
 * Convenience for `<select>` / dropdown options. Falls back to the provided
 * defaults (usually the legacy enum values) while the request is loading or if
 * it fails, so dropdowns are never empty.
 */
export function useSubjectOptions(
  fallback: string[] = [],
): { value: string; label: string }[] {
  const { data } = useSubjects();
  const names = data && data.length > 0 ? data.map((s) => s.name) : fallback;
  return names.map((name) => ({ value: name, label: name }));
}

/* ----------------------------- Admin CRUD ----------------------------- */

export function useAdminSubjects() {
  return useApiQuery<AdminSubject[]>({
    queryKey: [...queryKeys.subjects.all, "admin"],
    queryFn: () => apiGet<AdminSubject[]>(API_ENDPOINTS.ADMIN.SUBJECTS),
    retry: false,
  });
}

/**
 * Convenience for Admin dropdown options (includes coming-soon subjects).
 */
export function useAdminSubjectOptions(
  fallback: string[] = [],
): { value: string; label: string }[] {
  const { data } = useAdminSubjects();
  const names = data && data.length > 0 ? data.map((s) => s.name) : fallback;
  return names.map((name) => ({ value: name, label: name }));
}

const SUBJECT_INVALIDATE_KEYS = [
  queryKeys.subjects.all,
  [...queryKeys.subjects.all, "admin"],
];

export function useCreateAdminSubject() {
  return useApiMutation<
    AdminSubject,
    { name: string; category?: string | null; comingSoon?: boolean; isActive?: boolean }
  >({
    mutationFn: (payload) => apiPost<AdminSubject>(API_ENDPOINTS.ADMIN.SUBJECTS, payload),
    invalidateKeys: SUBJECT_INVALIDATE_KEYS,
  });
}

export function useUpdateAdminSubject() {
  return useApiMutation<
    AdminSubject,
    {
      id: string;
      name: string;
      category?: string | null;
      comingSoon?: boolean;
      isActive: boolean;
    }
  >({
    mutationFn: ({ id, name, category, comingSoon, isActive }) =>
      apiPut<AdminSubject>(API_ENDPOINTS.ADMIN.SUBJECT_BY_ID(id), {
        name,
        category,
        comingSoon,
        isActive,
      }),
    invalidateKeys: SUBJECT_INVALIDATE_KEYS,
  });
}

export function useDeleteAdminSubject() {
  return useApiMutation<{ deleted: boolean }, string>({
    mutationFn: (id) => apiDelete<{ deleted: boolean }>(API_ENDPOINTS.ADMIN.SUBJECT_BY_ID(id)),
    invalidateKeys: SUBJECT_INVALIDATE_KEYS,
  });
}
