// Service Worker for ExBoard AI PWA (Web Push & Offline Caching)

// This response contains the deployment's build ID. Modern browsers include
// imported scripts in service-worker update checks, so every deployment can be
// detected even when the worker logic below is unchanged.
try {
  importScripts("/sw-version.js");
} catch (e) {
  // Gracefully continue if sw-version.js cannot be fetched while offline
}

const BUILD_ID = self.__EXBOARD_BUILD_ID__ || "default-v1";
const CACHE_NAME = `exboard-cache-${BUILD_ID}`;
const OFFLINE_URL = "/offline";

// Essential static shell and branding assets to pre-cache on install
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  "/AppFavicon.png",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/badge-96.png",
  "/icons/badge-72.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/AppLogoLight.png",
  "/AppLogoDark.png",
  "/nova-tutor.webp",
  "/nova-avatar.webp",
  "/nova-tutor-chat.webp",
];

// Install: pre-cache offline fallback and core brand assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        for (const asset of PRECACHE_ASSETS) {
          try {
            await cache.add(asset);
          } catch (err) {
            console.warn(`[SW] Precache skipped for ${asset}:`, err);
          }
        }
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up outdated caches from previous deployments
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name.startsWith("exboard-cache-") && name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Allow client app to trigger immediate activation
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Handle incoming Web Push message
self.addEventListener("push", (event) => {
  let payload = {
    title: "ExBoard AI",
    body: "You have a new update!",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    data: { url: "/" },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/badge-96.png",
    tag: payload.tag || "exboard-push",
    renotify: true,
    vibrate: [100, 50, 100],
    data: payload.data || { url: "/" },
    actions: [
      {
        action: "open",
        title: "Open App",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Handle Notification Click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If an ExBoard AI tab is already open, focus it and navigate
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client && client.url !== targetUrl) {
              client.navigate(targetUrl);
            }
            return;
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// Fetch: intelligent caching for offline support
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // 1. Only intercept GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 2. Only cache same-origin requests
  if (url.origin !== self.location.origin) return;

  // 3. Bypass dynamic API routes, telemetry, and version checks
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname === "/sw-version.js" ||
    url.pathname.startsWith("/_next/image")
  ) {
    return;
  }

  // 4. Bypass media streams (videos, audio, range requests) to prevent playback stalls
  if (
    request.headers.has("range") ||
    url.pathname.startsWith("/videos/") ||
    url.pathname.startsWith("/audio/") ||
    /\.(mp4|webm|mp3|ogg|wav)$/i.test(url.pathname)
  ) {
    return;
  }

  // 5. Next.js Static Chunks (immutable, hash-fingerprinted): Cache-First
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => new Response("", { status: 408, statusText: "Offline" }));
      })
    );
    return;
  }

  // 6. Public static brand assets & fonts: Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/svgs/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/AppFavicon.png" ||
    url.pathname === "/AppLogoLight.png" ||
    url.pathname === "/AppLogoDark.png" ||
    /\.(png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf)$/i.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 7. Page Navigations (HTML): Network-First with Cache fallback, fallback to /offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;

          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) return offlinePage;

          return new Response(
            "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>",
            {
              headers: { "Content-Type": "text/html; charset=utf-8" },
              status: 503,
            }
          );
        })
    );
    return;
  }

  // 8. Next.js RSC requests: Network-First with Cache fallback
  const isRSC =
    request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
  if (isRSC) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return new Response("", { status: 503, statusText: "Offline RSC" });
        })
    );
    return;
  }
});
