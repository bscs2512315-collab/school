"use client";

import AuthGuard from "@/components/AuthGuard";
import DashboardShell from "@/components/layout/DashboardShell";
import {
  isImmersiveMainPath,
  isFullscreenPath,
} from "@/lib/quiz-screen";

export default function QALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      defaultTitle="QA Hub"
      showBottomNav={false}
      immersiveMain={isImmersiveMainPath}
      fullscreen={isFullscreenPath}
    >
      <AuthGuard>{children}</AuthGuard>
    </DashboardShell>
  );
}
