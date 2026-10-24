"use client";

import React, { useEffect } from "react";
import { WifiOff } from "lucide-react";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import NovaEmptyState from "@/components/NovaEmptyState";
import RefreshSVG from "@/public/svgs/RefreshSVG";
import { isNetworkError, OFFLINE_DESCRIPTION } from "@/lib/offline";

export default function TeacherError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Teacher portal error:", error);
  }, [error]);

  const isOffline = isNetworkError(error);

  const title = isOffline ? "YOU ARE OFFLINE" : "OOPS!";
  const description = isOffline
    ? OFFLINE_DESCRIPTION
    : error?.message || "We couldn't load this classroom data. Your records and submissions remain intact.";

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
          label: "TEACHER DASHBOARD",
          href: FRONTEND_ROUTES.TEACHER_DASHBOARD,
        }}
        variant="fullscreen"
        className="w-full"
      />
    </div>
  );
}
