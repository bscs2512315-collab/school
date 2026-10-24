"use client";

import React, { useState } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import NovaEmptyState from "@/components/NovaEmptyState";
import RefreshSVG from "@/public/svgs/RefreshSVG";
import { OFFLINE_TITLE, OFFLINE_DESCRIPTION } from "@/lib/offline";

interface OfflineStateProps {
  /** Optional custom title */
  title?: string;
  /** Optional custom description */
  description?: string;
  /** Custom callback for retrying */
  onRetry?: () => void | Promise<void>;
  /** Optional secondary action (e.g. browse cached content) */
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** Whether the component is rendered fullscreen or inline */
  variant?: "fullscreen" | "card" | "inline";
  className?: string;
}

export default function OfflineState({
  title = "YOU ARE OFFLINE",
  description = OFFLINE_DESCRIPTION,
  onRetry,
  secondaryAction,
  variant = "fullscreen",
  className,
}: OfflineStateProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryFailed(false);

    try {
      if (onRetry) {
        await onRetry();
      } else {
        // Test connectivity via lightweight cache-busted fetch
        const res = await fetch(`/AppFavicon.png?t=${Date.now()}`, {
          method: "HEAD",
          cache: "no-store",
        });
        if (res.ok || res.status === 304) {
          window.location.reload();
          return;
        }
        setRetryFailed(true);
      }
    } catch {
      setRetryFailed(true);
    } finally {
      setIsRetrying(false);
    }
  };

  const isFullscreen = variant === "fullscreen";
  const displayDescription = retryFailed
    ? "Still offline. Please check your Wi-Fi or mobile data connection and try again."
    : description;

  if (isFullscreen) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={cn(
          "fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background/95 dark:bg-background/95 backdrop-blur-2xl p-4 sm:p-6 overflow-y-auto select-none",
          className
        )}
      >
        <NovaEmptyState
          title={title}
          description={displayDescription}
          icon={WifiOff}
          action={{
            label: isRetrying ? "CHECKING..." : "RETRY CONNECTION",
            onClick: handleRetry,
            icon: RefreshSVG,
          }}
          secondaryAction={secondaryAction}
          variant="fullscreen"
          className="w-full my-auto"
        />
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex min-h-[50vh] sm:min-h-[60vh] md:min-h-[calc(100dvh-18rem)] w-full flex-1 items-center justify-center my-auto py-8 select-none",
        className
      )}
    >
      <NovaEmptyState
        title={title}
        description={displayDescription}
        icon={WifiOff}
        action={{
          label: isRetrying ? "CHECKING..." : "RETRY CONNECTION",
          onClick: handleRetry,
          icon: RefreshSVG,
        }}
        secondaryAction={secondaryAction}
        variant={variant}
        className="w-full"
      />
    </div>
  );
}
