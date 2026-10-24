"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Download,
  MoreVertical,
  Plus,
  Share2,
  Smartphone,
  X,
} from "lucide-react";
import { isFullscreenPath, isQuizScreenPath } from "@/lib/quiz-screen";

const DISMISS_KEY = "exboard-install-prompt-dismissed-at";
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type InstallMode = "android" | "ios";

function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    navigatorWithStandalone.standalone === true ||
    (typeof document !== "undefined" && document.referrer.startsWith("android-app://"))
  );
}

function getInstallMode(): InstallMode | null {
  if (typeof window === "undefined") return null;
  const userAgent = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIos) return "ios";

  const isAndroid = /Android/i.test(userAgent);
  if (isAndroid) return "android";

  // Check generic mobile user agent or small mobile screen with touch support
  const isMobile =
    /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent) ||
    (window.matchMedia("(max-width: 768px)").matches && navigator.maxTouchPoints > 0);
  if (isMobile) return "android";

  // Desktop devices should not be prompted
  return null;
}

function isSafeToPrompt(pathname: string): boolean {
  return !(
    pathname.startsWith("/student/lab-game") ||
    isQuizScreenPath(pathname) ||
    isFullscreenPath(pathname)
  );
}

export default function PWAInstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<InstallMode | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    if (isInstalled()) return;

    const installMode = getInstallMode();
    if (!installMode) return; // Do not prompt on desktop

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() - dismissedAt < DISMISS_FOR_MS) return;

    setMode(installMode);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      deferredPromptRef.current = promptEvent;
      setDeferredPrompt(promptEvent);
    };
    const handleInstalled = () => {
      setVisible(false);
      deferredPromptRef.current = null;
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    const timer = window.setTimeout(() => {
      // iOS has no install event. Android prompts when browser has declared installable.
      if (installMode === "ios" || deferredPromptRef.current) setVisible(true);
    }, 2500);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (deferredPrompt && mode !== "ios" && isSafeToPrompt(pathname)) {
      setVisible(true);
    }
  }, [deferredPrompt, mode, pathname]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    setShowIosSteps(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    else dismiss();
    deferredPromptRef.current = null;
    setDeferredPrompt(null);
  };

  if (!visible || !mode || !isSafeToPrompt(pathname)) return null;

  const isIos = mode === "ios";

  return (
    <div className="fixed inset-x-3 bottom-24 z-[90] sm:bottom-4 sm:hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-2xl shadow-black/25">
        <div className="h-1.5 bg-primary dark:bg-zinc-700" />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-base font-extrabold tracking-tight text-foreground">
                Install ExBoard AI
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Get a faster, focused study experience from your home screen.
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss install prompt"
              className="grid size-8 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          {isIos && showIosSteps ? (
            <div className="mt-4 space-y-2 rounded-2xl border border-border bg-muted/50 p-3 text-xs text-foreground">
              <p className="font-bold">In Safari:</p>
              <p className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-md bg-primary/10 text-primary"><Share2 className="size-3" /></span> Tap Share in the browser toolbar.</p>
              <p className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-md bg-primary/10 text-primary"><Plus className="size-3" /></span> Choose <strong>Add to Home Screen</strong>.</p>
              <p className="text-muted-foreground">iPhone requires this Apple-provided step before an app can be installed.</p>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {isIos ? (
              <button
                type="button"
                onClick={() => setShowIosSteps(true)}
                className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90 active:scale-[.98]"
              >
                How to install
              </button>
            ) : deferredPrompt ? (
              <button
                type="button"
                onClick={() => void install()}
                className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90 active:scale-[.98]"
              >
                <Download className="size-4" /> Install app
              </button>
            ) : (
              <div className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-muted px-2 text-center text-xs font-medium text-muted-foreground">
                <MoreVertical className="size-4" /> Menu to install
              </div>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-muted/80 hover:bg-muted border border-border/60 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition active:scale-[.98]"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
