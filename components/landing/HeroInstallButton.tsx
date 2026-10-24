"use client";

import { useState, useEffect, useRef, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  Smartphone,
  Laptop,
  Share2,
  Plus,
  X,
  CheckCircle2,
  Monitor,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import ArrowUpRightSVG from "@/public/svgs/ArrowUpRightSVG";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type DeviceOS = "mac" | "ios" | "android" | "windows";

function detectOS(): DeviceOS {
  if (typeof window === "undefined") return "android";
  const userAgent = navigator.userAgent;
  const platform = navigator.platform || "";

  if (/iPad|iPhone|iPod/.test(userAgent) || (platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    return "ios";
  }
  if (/Mac|Macintosh|MacIntel/i.test(userAgent) || platform.startsWith("Mac")) {
    return "mac";
  }
  if (/Android/i.test(userAgent)) {
    return "android";
  }
  if (/Win|Windows/i.test(userAgent)) {
    return "windows";
  }
  return "android";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    nav.standalone === true ||
    (typeof document !== "undefined" && document.referrer.startsWith("android-app://"))
  );
}

export function HeroInstallButton() {
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeOS, setActiveOS] = useState<DeviceOS>("android");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setMounted(true);
    setInstalled(isStandalone());
    const os = detectOS();
    setActiveOS(os);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      deferredPromptRef.current = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowGuideModal(false);
      deferredPromptRef.current = null;
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Lock body scroll and handle Escape key when guide modal is open
  useEffect(() => {
    if (showGuideModal) {
      const originalOverflow = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setShowGuideModal(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [showGuideModal]);

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const os = detectOS();
    setActiveOS(os);

    // If Android or desktop Chrome with native prompt available
    if (deferredPromptRef.current) {
      try {
        await deferredPromptRef.current.prompt();
        const choice = await deferredPromptRef.current.userChoice;
        if (choice.outcome === "accepted") {
          setInstalled(true);
        }
        deferredPromptRef.current = null;
        setDeferredPrompt(null);
        return;
      } catch {
        // Fallback to guide modal if prompt fails
        setShowGuideModal(true);
        return;
      }
    }

    // Otherwise show guide modal tailored to device
    setShowGuideModal(true);
  };

  const scrollToProduct = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.history.pushState(null, "", "#product");
    document.getElementById("product")?.scrollIntoView({ behavior: "instant", block: "start" });
  };

  return (
    <>
      {/* Small Screen: "Install App" Button (< sm) */}
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex uppercase sm:hidden min-h-12 flex-1 items-center justify-center gap-1.5 xs:gap-2 rounded-2xl bg-black dark:bg-white px-3 xs:px-5 text-xs xs:text-sm font-extrabold text-white dark:text-black border border-black dark:border-white transition-all hover:-translate-y-0.5 active:scale-[0.98] whitespace-nowrap"
        aria-label="Install ExBoard AI App"
      >
        <Download className="size-4 shrink-0" />
        <span>Install App</span>
      </button>

      {/* Desktop / Large Screen: "Explore the platform" Link (sm:) */}
      <a
        href="#product"
        onClick={scrollToProduct}
        className="hidden sm:inline-flex min-h-14 uppercase items-center justify-center gap-2 rounded-2xl border border-border bg-card px-7 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary sm:text-base whitespace-nowrap"
      >
        Explore the platform <ArrowUpRightSVG className="size-4" />
      </a>

      {/* PWA Installation Guide Modal rendered outside of transformed/overflow-hidden containers */}
      {showGuideModal && mounted && typeof document !== "undefined"
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
              onClick={() => setShowGuideModal(false)}
            >
              <div
                className="relative w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden rounded-[2rem] border border-border/80 bg-background text-foreground shadow-2xl shadow-black/50 my-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top Accent Bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-emerald-500 to-primary shrink-0" />

                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                          Install ExBoard AI
                        </h3>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary dark:text-logo-green">
                          Fast App
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fast, standalone offline-ready experience on your device
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGuideModal(false)}
                      className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                      aria-label="Close modal"
                    >
                      <X className="size-5" />
                    </button>
                  </div>

                  {/* OS-Specific Instructions */}
                  <div className="space-y-2.5">
                    {/* 1. Mac Guide */}
                    {activeOS === "mac" && (
                      <div className="space-y-2.5">
                        <div className="rounded-2xl border border-border/80 bg-muted/30 p-3.5 space-y-2.5">
                          <p className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-2">
                            <Laptop className="size-4 text-primary shrink-0" /> On Mac (Chrome, Edge or Arc):
                          </p>
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-start gap-2.5">
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] mt-0.5">1</span>
                              <span className="leading-relaxed">Look at the right side of the address bar at the top of your browser.</span>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] mt-0.5">2</span>
                              <span className="leading-relaxed">Click the <strong className="text-foreground font-semibold">Install App</strong> icon (or click Menu <strong>⋮</strong> &gt; <strong className="text-foreground font-semibold">Install ExBoard AI</strong>).</span>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] mt-0.5">3</span>
                              <span className="leading-relaxed">Click <strong className="text-foreground font-semibold">Install</strong> to add ExBoard AI to your Applications &amp; Dock.</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-border/80 bg-muted/30 p-3.5 space-y-2.5">
                          <p className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-2">
                            <Laptop className="size-4 text-primary shrink-0" /> On Mac (Safari on macOS Sonoma+):
                          </p>
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-start gap-2.5">
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] mt-0.5">1</span>
                              <span className="leading-relaxed">In the top macOS menu bar, click <strong className="text-foreground font-semibold">File</strong>.</span>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] mt-0.5">2</span>
                              <span className="leading-relaxed">Select <strong className="text-foreground font-semibold">Add to Dock...</strong></span>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] mt-0.5">3</span>
                              <span className="leading-relaxed">Click <strong className="text-foreground font-semibold">Add</strong> to launch ExBoard AI directly from your Mac Dock.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. Android Guide */}
                    {activeOS === "android" && (
                      <div className="space-y-2.5">
                        {deferredPrompt ? (
                          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-center">
                            <p className="font-bold text-amber-950 dark:text-amber-200 text-sm">
                              Ready for 1-Tap Installation!
                            </p>
                            <p className="text-muted-foreground text-xs mt-1">
                              Click below to install directly to your home screen.
                            </p>
                            <button
                              type="button"
                              onClick={async () => {
                                if (deferredPromptRef.current) {
                                  await deferredPromptRef.current.prompt();
                                  const choice = await deferredPromptRef.current.userChoice;
                                  if (choice.outcome === "accepted") {
                                    setInstalled(true);
                                    setShowGuideModal(false);
                                  }
                                }
                              }}
                              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black text-amber-950 shadow-md transition hover:bg-amber-300"
                            >
                              <Download className="size-4" /> Install Now
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-border/80 bg-muted/30 p-3.5 space-y-2.5">
                            <p className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-2">
                              <Smartphone className="size-4 text-primary shrink-0" /> On Android (Chrome / Brave / Edge):
                            </p>
                            <div className="space-y-2 text-xs text-muted-foreground">
                              <div className="flex items-start gap-2.5">
                                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] mt-0.5">1</span>
                                <span className="leading-relaxed">Tap the three-dots menu <strong className="text-foreground font-semibold">(⋮)</strong> in the top right corner.</span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] mt-0.5">2</span>
                                <span className="leading-relaxed">Tap <strong className="text-foreground font-semibold">Install app</strong> or <strong className="text-foreground font-semibold">Add to Home screen</strong>.</span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] mt-0.5">3</span>
                                <span className="leading-relaxed">Confirm by tapping <strong className="text-foreground font-semibold">Install</strong>.</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. iOS Guide */}
                    {activeOS === "ios" && (
                      <div className="space-y-2.5">
                        <div className="rounded-2xl border border-border/80 bg-muted/30 p-3.5 space-y-2.5">
                          <p className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-2">
                            <Smartphone className="size-4 text-primary shrink-0" /> On iPhone / iPad (Safari):
                          </p>
                          <div className="space-y-2.5 text-xs text-muted-foreground">
                            <div className="flex items-start gap-2.5">
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                                <Share2 className="size-3.5" />
                              </span>
                              <span className="leading-relaxed pt-0.5">
                                Tap the <strong className="text-foreground font-semibold">Share</strong> button in the Safari toolbar.
                              </span>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                                <Plus className="size-3.5" />
                              </span>
                              <span className="leading-relaxed pt-0.5">
                                Scroll down the action sheet and tap <strong className="text-foreground font-semibold">Add to Home Screen</strong>.
                              </span>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                                <CheckCircle2 className="size-3.5" />
                              </span>
                              <span className="leading-relaxed pt-0.5">
                                Tap <strong className="text-foreground font-semibold">Add</strong> in the top-right corner to finish.
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4. Windows Guide */}
                    {activeOS === "windows" && (
                      <div className="space-y-2.5">
                        <div className="rounded-2xl border border-border/80 bg-muted/30 p-3.5 space-y-2.5">
                          <p className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-2">
                            <Monitor className="size-4 text-primary shrink-0" /> On Windows (Chrome or Edge):
                          </p>
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-start gap-2.5">
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] mt-0.5">1</span>
                              <span className="leading-relaxed">Look for the <strong className="text-foreground font-semibold">App available</strong> / <strong className="text-foreground font-semibold">Install</strong> icon in the address bar.</span>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] mt-0.5">2</span>
                              <span className="leading-relaxed">Click <strong className="text-foreground font-semibold">Install</strong> to create a desktop and start menu shortcut.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowGuideModal(false)}
                      className="w-full rounded-2xl bg-primary py-3 text-sm font-extrabold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-[0.99]"
                    >
                      Got it
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
