import { NextResponse } from "next/server";
import type { ApiSuccessResponse, ApiErrorResponse, ApiErrorDetail } from "@/types/api";

export function successResponse<T = unknown>(
  data: T = null as T,
  message: string = "Success",
  status: number = 200,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status },
  );
}

export function errorResponse(
  error: string | ApiErrorDetail[] | Error = "Internal Server Error",
  status: number = 500,
): NextResponse<ApiErrorResponse> {
  let errorMessage: string | ApiErrorDetail[];
  
  if (typeof error === "string") {
    errorMessage = error;
  } else if (Array.isArray(error)) {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else {
    errorMessage = "Something went wrong";
  }

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      details: typeof error === "object" && !Array.isArray(error) && !(error instanceof Error) ? error : undefined,
    },
    { status },
  );
}

export function handleApiError(
  error: unknown,
  fallbackMessage = "Internal Server Error",
): NextResponse<ApiErrorResponse> {
  const err = error as { code?: string; message?: string } | null;

  if (err?.code === "53000" || err?.message?.toLowerCase().includes("exceeded the quota")) {
    return errorResponse(
      "Database Error: Neon PostgreSQL quota exceeded. Please upgrade or reset limits in Neon Console (https://console.neon.tech).",
      503,
    );
  }

  if (err?.code === "ECONNREFUSED" || err?.code === "ETIMEDOUT") {
    return errorResponse(
      "Database Error: Unable to connect to PostgreSQL database. Please check your DATABASE_URL.",
      503,
    );
  }

  if (process.env.NODE_ENV !== "production" && error instanceof Error) {
    return errorResponse(`Database/Server Error: ${error.message}`, 500);
  }

  return errorResponse(fallbackMessage, 500);
}
