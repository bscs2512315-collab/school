"use client";

import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { ApiSuccessResponse } from "@/types/api";

type ApiMutationFn<TData, TVariables> = (
  variables: TVariables,
) => Promise<ApiSuccessResponse<TData>>;

interface UseApiMutationOptions<TData, TVariables> extends Omit<
  UseMutationOptions<TData, Error, TVariables>,
  "mutationFn"
> {
  mutationFn: ApiMutationFn<TData, TVariables>;
  invalidateKeys?: QueryKey[];
}

export function useApiMutation<TData, TVariables = void>({
  mutationFn,
  invalidateKeys,
  onSuccess,
  ...options
}: UseApiMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) => {
      const response = await mutationFn(variables);
      if (!response.success) {
        throw new Error("Request failed");
      }
      return response.data;
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      if (invalidateKeys?.length) {
        await Promise.all(
          invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
        );
      }
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...options,
  });
}
