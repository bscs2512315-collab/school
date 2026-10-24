"use client";

import { useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import DashboardShell from "@/components/layout/DashboardShell";
import {
  isStudentDashboardBottomNavHidden,
  isImmersiveMainPath,
  isFullscreenPath,
} from "@/lib/quiz-screen";

/** Undo body styles left by an older exam anti-cheat implementation. */
function clearLeakedExamBodyStyles() {
  document.body.classList.remove("exam-anti-cheat-active");
  document.body.style.userSelect = "";
  (
    document.body.style as CSSStyleDeclaration & { webkitUserSelect?: string }
  ).webkitUserSelect = "";
  (
    document.body.style as CSSStyleDeclaration & { webkitTouchCallout?: string }
  ).webkitTouchCallout = "";
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    clearLeakedExamBodyStyles();
  }, []);

  return (
    <DashboardShell
      showBottomNav
      hideBottomNav={isStudentDashboardBottomNavHidden}
      immersiveMain={isImmersiveMainPath}
      fullscreen={isFullscreenPath}
    >
      <AuthGuard>{children}</AuthGuard>
    </DashboardShell>
  );
}
