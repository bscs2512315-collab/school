"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { RefreshCw } from "lucide-react";
import { isFullscreenPath, isQuizScreenPath } from "@/lib/quiz-screen";

const UPDATE_TOAST_ID = "pwa-update-ready";
const UPDATE_INTERVAL_MS = 15 * 60 * 1000;

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

/**
 * A service-worker-controlled browser tab is not necessarily an installed PWA.
 * Chromium exposes installed launches through display-mode; iOS Safari uses the
 * legacy navigator.standalone flag for home-screen launches.
 */
function isInstalledPwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    (navigator as NavigatorWithStandalone).standalone === true ||
    (typeof document !== "undefined" && document.referrer.startsWith("android-app://"))
  );
}

function isProtectedActivity(pathname: string): boolean {
  return (
    pathname.startsWith("/student/lab-game") ||
    isQuizScreenPath(pathname) ||
    isFullscreenPath(pathname)
  );
}

export default function PWAUpdater() {
  const pathname = usePathname();
  const [updateReady, setUpdateReady] = useState(false);
  const hadControllerRef = useRef(false);

  const refreshApp = useCallback(() => {
    toast.dismiss(UPDATE_TOAST_ID);
    window.location.reload();
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let disposed = false;
    let registration: ServiceWorkerRegistration | null = null;
    let intervalId: number | undefined;
    hadControllerRef.current = Boolean(navigator.serviceWorker.controller);

    const markUpdateReady = () => {
      if (!disposed && hadControllerRef.current && isInstalledPwa()) {
        setUpdateReady(true);
      }
    };

    const watchInstallingWorker = (worker: ServiceWorker | null) => {
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed") markUpdateReady();
      });
    };

    const checkForUpdate = () => {
      if (navigator.onLine && registration) {
        void registration.update().catch(() => {
          // A later interval/online/visibility check will retry quietly.
        });
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };

    const onControllerChange = () => {
      const wasAlreadyControlled = hadControllerRef.current;
      hadControllerRef.current = true;
      if (wasAlreadyControlled) markUpdateReady();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })
      .then((registered) => {
        if (disposed) return;
        registration = registered;

        if (registered.waiting && hadControllerRef.current) {
          markUpdateReady();
          registered.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registered.addEventListener("updatefound", () => {
          watchInstallingWorker(registered.installing);
        });

        checkForUpdate();
        intervalId = window.setInterval(checkForUpdate, UPDATE_INTERVAL_MS);
        window.addEventListener("online", checkForUpdate);
        document.addEventListener("visibilitychange", onVisible);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });

    return () => {
      disposed = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
      window.removeEventListener("online", checkForUpdate);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  useEffect(() => {
    if (!updateReady || !isInstalledPwa()) {
      toast.dismiss(UPDATE_TOAST_ID);
      return;
    }

    if (isProtectedActivity(pathname)) {
      // Never distract or cover controls during a lab, exam, or quiz. Keep the
      // pending state in memory and offer the update after navigation to a safe
      // screen instead.
      toast.dismiss(UPDATE_TOAST_ID);
      return;
    }

    toast.custom(
      () => (
        <div className="flex max-w-sm items-center gap-3 rounded-2xl border border-primary/20 bg-background p-4 text-foreground shadow-2xl">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">A new version is available!</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Please use the latest ExBoard AI update.
            </p>
          </div>
          <button
            type="button"
            onClick={refreshApp}
            className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Update
          </button>
        </div>
      ),
      { id: UPDATE_TOAST_ID, duration: Infinity },
    );
  }, [pathname, refreshApp, updateReady]);

  return null;
}
