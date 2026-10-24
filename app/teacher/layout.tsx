"use client";

import AuthGuard from "@/components/AuthGuard";
import DashboardShell from "@/components/layout/DashboardShell";
import {
  isTeacherDashboardBottomNavHidden,
  isImmersiveMainPath,
  isFullscreenPath,
} from "@/lib/quiz-screen";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      defaultTitle="Teacher Portal"
      showBottomNav
      hideBottomNav={isTeacherDashboardBottomNavHidden}
      immersiveMain={isImmersiveMainPath}
      fullscreen={isFullscreenPath}
    >
      <AuthGuard>{children}</AuthGuard>
    </DashboardShell>
  );
}
