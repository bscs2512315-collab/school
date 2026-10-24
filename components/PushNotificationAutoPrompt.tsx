"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { isFullscreenPath, isQuizScreenPath } from "@/lib/quiz-screen";
import { hasConsistentAuthSession } from "@/lib/auth-session";

const PROMPT_SESSION_KEY = "exboard:push:prompted_session";

function isSafeRoute(pathname: string): boolean {
  return !(
    pathname.startsWith("/student/lab-game") ||
    isQuizScreenPath(pathname) ||
    isFullscreenPath(pathname) ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/verify-otp") ||
    pathname.startsWith("/forgot-password")
  );
}

export default function PushNotificationAutoPrompt() {
  const pathname = usePathname();
  const { isSupported, permission, isSubscribed, subscribeToPush } =
    usePushNotifications(true);
  const promptedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isSupported) return;
    if (!isSafeRoute(pathname)) return;

    // Only prompt authenticated users (Students, Teachers, Schools)
    const isAuthenticated = hasConsistentAuthSession();
    if (!isAuthenticated) return;

    // Case 1: Permission is already granted, but push subscription isn't synced yet
    if (permission === "granted" && !isSubscribed) {
      void subscribeToPush({ silent: true });
      return;
    }

    // Case 2: Permission is 'default' (user hasn't chosen Allow or Block yet)
    if (permission === "default" && !promptedRef.current) {
      const alreadyPromptedThisSession = sessionStorage.getItem(PROMPT_SESSION_KEY);
      if (alreadyPromptedThisSession) return;

      promptedRef.current = true;
      sessionStorage.setItem(PROMPT_SESSION_KEY, "1");

      // Give the user 1.5 seconds to settle into the dashboard before triggering browser prompt
      const timer = window.setTimeout(() => {
        void subscribeToPush({ silent: false });
      }, 1500);

      return () => window.clearTimeout(timer);
    }
  }, [isSupported, permission, isSubscribed, pathname, subscribeToPush]);

  return null;
}
