"use client";

import React, { useEffect } from "react";
import { WifiOff } from "lucide-react";
import NovaEmptyState from "@/components/NovaEmptyState";
import RefreshSVG from "@/public/svgs/RefreshSVG";
import { isNetworkError, OFFLINE_DESCRIPTION } from "@/lib/offline";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root application error:", error);
  }, [error]);

  const isOffline = isNetworkError(error);

  const title = isOffline ? "YOU ARE OFFLINE" : "OOPS!";
  const description = isOffline
    ? OFFLINE_DESCRIPTION
    : error?.message || "We encountered an unexpected error while loading this page. Please try again.";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4 select-none my-auto">
      <NovaEmptyState
        title={title}
        description={description}
        icon={isOffline ? WifiOff : undefined}
        action={{
          label: "TRY AGAIN",
          onClick: () => reset(),
          icon: RefreshSVG,
        }}
        secondaryAction={{
          label: "GO TO HOME",
          href: "/",
        }}
        variant="fullscreen"
        className="w-full"
      />
    </div>
  );
}
