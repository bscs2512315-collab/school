"use client";

import React, { useEffect } from "react";
import { WifiOff } from "lucide-react";
import NovaEmptyState from "@/components/NovaEmptyState";
import RefreshSVG from "@/public/svgs/RefreshSVG";
import { isNetworkError, OFFLINE_DESCRIPTION } from "@/lib/offline";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global fatal error:", error);
  }, [error]);

  const isOffline = isNetworkError(error);

  const title = isOffline ? "YOU ARE OFFLINE" : "APPLICATION ERROR";
  const description = isOffline
    ? OFFLINE_DESCRIPTION
    : "A critical error occurred while loading the application shell. Please try reloading.";

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground font-sans select-none">
        <NovaEmptyState
          title={title}
          description={description}
          icon={isOffline ? WifiOff : undefined}
          action={{
            label: "RELOAD APPLICATION",
            onClick: () => reset(),
            icon: RefreshSVG,
          }}
          variant="fullscreen"
          className="w-full my-auto"
        />
      </body>
    </html>
  );
}
