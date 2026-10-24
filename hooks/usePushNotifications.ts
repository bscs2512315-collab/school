"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { apiPost } from "@/lib/api/api-client";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  try {
    const result = Notification.requestPermission();
    if (result && typeof (result as Promise<NotificationPermission>).then === "function") {
      return await result;
    }
  } catch (err) {
    console.warn("Promise-based Notification.requestPermission failed, trying callback:", err);
  }

  return new Promise<NotificationPermission>((resolve) => {
    try {
      Notification.requestPermission((permission) => resolve(permission));
    } catch {
      resolve("denied");
    }
  });
}

async function getOrRegisterSW(
  existingReg: ServiceWorkerRegistration | null
): Promise<ServiceWorkerRegistration | null> {
  if (existingReg?.active) return existingReg;

  try {
    if ("serviceWorker" in navigator) {
      // 1. Try to get existing registration
      const existing = await navigator.serviceWorker.getRegistration();
      if (existing) return existing;

      // 2. Try ready promise with short timeout
      const readyReg = await withTimeout(
        navigator.serviceWorker.ready,
        3000,
        "SW ready timeout"
      ).catch(() => null);
      if (readyReg) return readyReg;

      // 3. Register directly
      const registered = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      return registered;
    }
  } catch (err) {
    console.error("Failed to get/register service worker:", err);
  }
  return null;
}

export function usePushNotifications(enabled = true) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "loading">("loading");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const isSubscribingRef = useRef(false);

  // Initialize service worker and check existing subscription
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setIsSupported(supported);

    if (!supported) {
      setPermission("denied");
      return;
    }

    setPermission(Notification.permission);

    // Register/Check Service Worker
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        setSwRegistration(reg);
        return reg.pushManager.getSubscription();
      })
      .then((sub) => {
        setIsSubscribed(Boolean(sub));
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
  }, [enabled]);

  // Subscribe to Web Push
  const subscribeToPush = useCallback(
    async (options?: { silent?: boolean } | unknown): Promise<boolean> => {
      const silent =
        Boolean(options && typeof options === "object" && "silent" in options && (options as { silent?: boolean }).silent);

      if (typeof window === "undefined") return false;

      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!supported) {
        if (!silent) {
          toast.error("Push notifications are not supported on this browser/device.");
        }
        return false;
      }

      if (isSubscribingRef.current) return false;
      isSubscribingRef.current = true;
      setIsLoading(true);

      try {
        // 1. Request Browser Native Permission
        const perm = await requestNotificationPermission();
        setPermission(perm);

        if (perm !== "granted") {
          if (perm === "denied" && !silent) {
            toast.error("Notification permission was blocked in browser settings.");
          }
          return false;
        }

        // 2. Ensure Service Worker Ready with safety timeout
        const reg = await getOrRegisterSW(swRegistration);
        if (!reg) {
          if (!silent) {
            toast.error("Service worker is not active. Please refresh and try again.");
          }
          return false;
        }

        // 3. Get VAPID Public Key
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error("Push notification configuration is missing NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
          if (!silent) {
            toast.error("Push notification configuration is missing VAPID public key.");
          }
          return false;
        }

        // 4. Subscribe with PushManager with timeout guard
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        // Check if existing subscription already matches
        let subscription = await reg.pushManager.getSubscription().catch(() => null);

        if (!subscription) {
          subscription = await withTimeout(
            reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedVapidKey,
            }),
            8000,
            "Push subscription request timed out"
          );
        }

        const subJSON = subscription.toJSON();

        // 5. Send to Server
        const res = await withTimeout(
          apiPost<{ subscribed: boolean }>("/notifications/push/subscribe", {
            endpoint: subJSON.endpoint,
            keys: subJSON.keys,
          }),
          8000,
          "Registering push subscription timed out"
        );

        if (res.success) {
          setIsSubscribed(true);
          if (!silent) {
            toast.success("🔔 Push notifications enabled on this device!");
          }
          return true;
        } else {
          if (!silent) {
            toast.error(res.message || "Failed to register push subscription.");
          }
          return false;
        }
      } catch (err: unknown) {
        console.error("Failed to subscribe to push notifications:", err);
        if (!silent) {
          const errObj = err as { message?: string };
          toast.error(errObj?.message || "Failed to enable push notifications.");
        }
        return false;
      } finally {
        setIsLoading(false);
        isSubscribingRef.current = false;
      }
    },
    [swRegistration]
  );

  // Unsubscribe from Web Push
  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);

    try {
      const reg = await getOrRegisterSW(swRegistration);
      if (reg) {
        const subscription = await reg.pushManager.getSubscription();

        if (subscription) {
          const endpoint = subscription.endpoint;
          await subscription.unsubscribe();

          await apiPost("/notifications/push/unsubscribe", { endpoint });
        }
      }

      setIsSubscribed(false);
      toast.success("Push notifications disabled.");
      return true;
    } catch (err) {
      console.error("Failed to unsubscribe:", err);
      toast.error("Failed to disable push notifications.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, swRegistration]);

  // Send a test notification
  const sendTestNotification = useCallback(
    async (template?: string) => {
      if (!isSubscribed) {
        toast.error("Please enable push notifications first!");
        return;
      }

      setIsLoading(true);
      try {
        const res = await apiPost<{
          sent: number;
          total: number;
          notification?: { title: string; body: string };
        }>("/notifications/push/test", template ? { template } : {});

        if (res.success) {
          toast.success(res.message || "Test notification sent! Check your screen.");
        } else {
          toast.error(res.message || "Failed to send test push.");
        }
      } catch (err: unknown) {
        const errObj = err as { message?: string };
        toast.error(errObj?.message || "Failed to send test notification.");
      } finally {
        setIsLoading(false);
      }
    },
    [isSubscribed]
  );

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
  };
}
