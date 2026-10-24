import axios, { type AxiosError } from "axios";
import { clearAuthSession } from "@/lib/auth-session";

const apiInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 45000,
  withCredentials: true,
});

// Same-origin requests carry the server-set HttpOnly session cookie.
apiInstance.interceptors.request.use(
  (config) => {
    // Prevent double /api prefix since baseURL is already configured as /api
    if (config.url && config.url.startsWith("/api/")) {
      config.url = config.url.substring(4);
    }

    // Let the browser set multipart boundary — default application/json breaks FormData uploads
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      const headers = config.headers;
      if (headers && typeof headers.delete === "function") {
        headers.delete("Content-Type");
      } else if (headers) {
        delete (headers as Record<string, unknown>)["Content-Type"];
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export function sanitizeErrorMessage(error: AxiosError<unknown>): string {
  const status = error.response?.status;
  const rawData = error.response?.data;

  let rawMessage = "";
  if (typeof rawData === "string") {
    rawMessage = rawData;
  } else if (rawData && typeof rawData === "object") {
    const payload = rawData as { error?: unknown; message?: unknown };
    const responseError = payload.error ?? payload.message;
    if (typeof responseError === "string") {
      rawMessage = responseError;
    } else if (Array.isArray(responseError)) {
      const firstIssue = responseError.find(
        (issue: unknown): issue is { message: string } => Boolean(issue && typeof issue === "object" && "message" in issue && typeof issue.message === "string"),
      );
      rawMessage = firstIssue?.message || "";
    }
  }

  if (!rawMessage) {
    rawMessage = error.message || "";
  }

  const lower = String(rawMessage).toLowerCase();

  // Detect 502, 504, 503, 500, HTML gateway errors, or timeouts
  const isGatewayTimeout =
    status === 504 ||
    lower.includes("504") ||
    lower.includes("gateway timeout") ||
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    error.code === "ECONNABORTED";

  const isBadGatewayOrServerError =
    status === 502 ||
    status === 503 ||
    status === 500 ||
    lower.includes("502") ||
    lower.includes("503") ||
    lower.includes("500") ||
    lower.includes("bad gateway") ||
    lower.includes("internal server error") ||
    lower.includes("service unavailable") ||
    lower.includes("<!doctype") ||
    lower.includes("<html");

  if (isGatewayTimeout) {
    return "Request timed out. Please try again.";
  }

  if (isBadGatewayOrServerError) {
    return "Something went wrong. Please try again.";
  }

  const isOffline =
    (typeof navigator !== "undefined" && !navigator.onLine) ||
    error.code === "ERR_NETWORK" ||
    lower.includes("network error") ||
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("you are offline") ||
    lower.includes("offline");

  if (isOffline) {
    return "You are offline. Please check your internet connection and try again.";
  }

  // If the message is clean and human-readable, use it
  if (rawMessage && !rawMessage.startsWith("<") && rawMessage.length < 200) {
    return rawMessage;
  }

  return "Something went wrong. Please try again.";
}

// Response Interceptor: Global error & success handling
apiInstance.interceptors.response.use(
  (response) => {
    // Return only the data from our standardized response
    return response.data;
  },
  (error) => {
    const cleanMessage = sanitizeErrorMessage(error);

    // Handle unauthorized errors (e.g., redirect to login)
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        clearAuthSession();
      }
    }

    return Promise.reject({
      error: cleanMessage,
      message: cleanMessage,
      details: error.response?.data?.details,
      status: error.response?.status,
    });
  },
);

export default apiInstance;
