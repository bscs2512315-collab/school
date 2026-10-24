import apiInstance from "@/lib/api-instance";
import type { ApiSuccessResponse } from "@/types/api";
import type { AxiosRequestConfig } from "axios";

export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ApiSuccessResponse<T>> {
  return apiInstance.get(url, config) as Promise<ApiSuccessResponse<T>>;
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiSuccessResponse<T>> {
  return apiInstance.post(url, data, config) as Promise<ApiSuccessResponse<T>>;
}

export async function apiPut<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiSuccessResponse<T>> {
  return apiInstance.put(url, data, config) as Promise<ApiSuccessResponse<T>>;
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiSuccessResponse<T>> {
  return apiInstance.patch(url, data, config) as Promise<ApiSuccessResponse<T>>;
}

export async function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ApiSuccessResponse<T>> {
  return apiInstance.delete(url, config) as Promise<ApiSuccessResponse<T>>;
}
