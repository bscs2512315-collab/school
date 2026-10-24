"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import AppState from "@/components/AppState";
import { cn } from "@/lib/utils";
import { useIsOffline, isNetworkError, OFFLINE_TITLE, OFFLINE_DESCRIPTION } from "@/lib/offline";

interface AppQueryStateProps<T> {
  query: Pick<UseQueryResult<T, Error>, "isLoading" | "isError" | "error" | "data">;
  isEmpty?: (data: T) => boolean;
  loadingMessage?: string;
  errorMessage?: string;
  emptyMessage?: string;
  emptyTitle?: string;
  fullScreen?: boolean;
  className?: string;
  onRetry?: () => void;
  children: (data: T) => ReactNode;
}

export default function AppQueryState<T>({
  query,
  isEmpty,
  loadingMessage,
  errorMessage,
  emptyMessage,
  emptyTitle,
  fullScreen = false,
  className,
  onRetry,
  children,
}: AppQueryStateProps<T>) {
  const isOffline = useIsOffline();
  // Prevent React hydration mismatches when SSR and the first client render
  // differ (common with React Query cache being ready on client).
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <AppState
        variant="loading"
        description={loadingMessage}
        fullScreen={fullScreen}
        className={cn("flex w-full flex-1 items-center justify-center", className)}
      />
    );
  }

  const { isLoading, isError, error, data } = query;
  const isNetworkFailure = isOffline || isNetworkError(error);
  const hasNoData = data === undefined || data === null || (isEmpty ? isEmpty(data) : false);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (query && "refetch" in query && typeof (query as { refetch?: () => void }).refetch === "function") {
      (query as { refetch: () => void }).refetch();
    } else {
      window.location.reload();
    }
  };

  // If offline or network failed, and we have no cached data:
  // Show clean offline state instead of "No data found." or red error
  if (isNetworkFailure && hasNoData) {
    return (
      <AppState
        variant="offline"
        title={OFFLINE_TITLE}
        description={OFFLINE_DESCRIPTION}
        fullScreen={fullScreen}
        className={cn("flex-1", className)}
        action={{
          label: "Try again",
          onClick: handleRetry,
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <AppState
        variant="loading"
        description={loadingMessage}
        fullScreen={fullScreen}
        className={cn("flex w-full flex-1 items-center justify-center", className)}
      />
    );
  }

  if (isError) {
    return (
      <AppState
        variant="error"
        description={errorMessage ?? error?.message ?? "Something went wrong."}
        fullScreen={fullScreen}
        className={cn("flex-1", className)}
        action={
          onRetry
            ? {
                label: "Try again",
                onClick: onRetry,
              }
            : undefined
        }
      />
    );
  }

  if (hasNoData) {
    return (
      <AppState
        variant="empty"
        title={emptyTitle}
        emptyMessage={emptyMessage ?? "No data found."}
        fullScreen={fullScreen}
        className={cn("flex-1", className)}
      />
    );
  }

  return <>{children(data)}</>;
}
