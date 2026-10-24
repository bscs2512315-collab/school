"use client";

import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { ApiSuccessResponse } from "@/types/api";

type ApiQueryFn<T> = () => Promise<ApiSuccessResponse<T>>;

interface UseApiQueryOptions<T> extends Omit<
  UseQueryOptions<T, Error, T, QueryKey>,
  "queryKey" | "queryFn"
> {
  queryKey: QueryKey;
  queryFn: ApiQueryFn<T>;
  selectData?: boolean;
}

export function useApiQuery<T>({
  queryKey,
  queryFn,
  selectData = true,
  ...options
}: UseApiQueryOptions<T>): UseQueryResult<T, Error> {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await queryFn();
      if (!response.success) {
        throw new Error("Request failed");
      }
      return selectData ? response.data : (response as unknown as T);
    },
    ...options,
  });
}
