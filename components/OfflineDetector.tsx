"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { WifiOff, RefreshCw, Maximize2 } from "lucide-react";
import OfflineState from "@/components/OfflineState";

export default function OfflineDetector() {
  const pathname = usePathname();
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Initial sync with navigator.onLine if available in browser
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
      setWasOffline(true);
    }

    const handleOnline = () => {
      setIsOffline(false);
      setIsMinimized(false);
      if (wasOffline) {
        toast.success("Connection restored! You are back online.", {
          id: "online-restored-toast",
          duration: 3500,
        });
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
      toast("You are offline. Viewing cached content where available.", {
        id: "offline-lost-toast",
        icon: "📡",
        duration: 4500,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  const handleManualRetry = useCallback(async () => {
    setIsRetrying(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(`/AppFavicon.png?t=${Date.now()}`, {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok || res.status === 304 || res.type === "opaque") {
        setIsOffline(false);
        setWasOffline(false);
        setIsMinimized(false);
        toast.success("Back online! Connection verified.", {
          id: "online-restored-toast",
        });
        return;
      }
      throw new Error("No response");
    } catch {
      clearTimeout(timeoutId);
      setIsOffline(true);
      toast("Still offline. Please check your network connection.", {
        id: "offline-retry-failed",
        icon: "📡",
      });
    } finally {
      setIsRetrying(false);
    }
  }, []);

  // Avoid duplicate offline screen if already on /offline
  if (!isOffline || pathname === "/offline") return null;

  // Minimized floating banner allowing users to read cached content uninterrupted
  if (isMinimized) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[99998] flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900/95 text-white shadow-2xl border border-zinc-700/60 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-[90vw] text-xs sm:text-sm font-medium"
      >
        <span className="flex items-center gap-2 text-amber-400 font-semibold">
          <WifiOff className="h-4 w-4 animate-pulse" />
          Offline Mode
        </span>
        <span className="hidden sm:inline text-zinc-300">
          Viewing cached content
        </span>
        <div className="flex items-center gap-1.5 ml-1">
          <button
            type="button"
            onClick={handleManualRetry}
            disabled={isRetrying}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all text-xs text-zinc-200 border border-zinc-700 font-semibold"
          >
            <RefreshCw className={`h-3 w-3 ${isRetrying ? "animate-spin text-amber-400" : ""}`} />
            {isRetrying ? "Checking..." : "Retry"}
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            aria-label="Expand offline details"
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <OfflineState
      variant="fullscreen"
      onRetry={handleManualRetry}
      secondaryAction={{
        label: "BROWSE CACHED CONTENT",
        onClick: () => setIsMinimized(true),
      }}
    />
  );
}
