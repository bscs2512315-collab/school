"use client";

import { useEffect, useState } from "react";

/**
 * Checks whether the client environment is currently offline.
 */
export function isClientOffline(): boolean {
  if (typeof navigator !== "undefined") {
    return !navigator.onLine;
  }
  return false;
}

/**
 * Determines whether an error (or error message) was caused by a network
 * disruption or offline status.
 */
export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }

  if (!error) return false;

  if (typeof error === "string") {
    return isNetworkErrorMessage(error);
  }

  if (typeof error === "object") {
    const err = error as {
      name?: unknown;
      message?: unknown;
      code?: unknown;
      status?: unknown;
    };

    if (
      err.name === "NetworkError" ||
      err.code === "ERR_NETWORK" ||
      err.code === "ECONNABORTED" ||
      err.status === 0
    ) {
      return true;
    }

    if (typeof err.message === "string") {
      return isNetworkErrorMessage(err.message);
    }
  }

  return false;
}

function isNetworkErrorMessage(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("you are offline") ||
    lower.includes("offline") ||
    lower.includes("failed to fetch") ||
    lower.includes("fetch failed") ||
    lower.includes("network error") ||
    lower.includes("networkerror") ||
    lower.includes("load failed") ||
    lower.includes("internet") ||
    lower.includes("err_network") ||
    lower.includes("net::err") ||
    lower.includes("aborted")
  );
}

/**
 * React hook that reacts in real-time to online/offline window events.
 */
export function useIsOffline(): boolean {
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof navigator !== "undefined") {
      return !navigator.onLine;
    }
    return false;
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check on mount
    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOffline;
}

export const OFFLINE_TITLE = "You are offline";
export const OFFLINE_DESCRIPTION = "Please check your internet connection and try again.";
