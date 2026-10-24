/** Browser cache-cold/warm loading trace. Never records credentials or response bodies. */
import { chromium } from "playwright";

const origin = process.argv.find((arg) => arg.startsWith("http")) ?? "http://localhost:3003";
const siteHost = new URL(origin).hostname.replace(/^www\./, "");
const isSiteHost = (hostname) => hostname === siteHost || hostname === `www.${siteHost}`;
const interactiveLogin = process.argv.includes("--login");
const browser = await chromium.launch({ channel: "chrome", headless: !interactiveLogin });
const context = await browser.newContext();
const page = await context.newPage();

await page.addInitScript(() => {
  window.__lastLcp = 0;
  window.__lcpEntries = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__lastLcp = entry.startTime;
      window.__lcpEntries.push(Math.round(entry.startTime));
      window.__lastLcpDetail = {
        tag: entry.element?.tagName,
        id: entry.element?.id,
        className: typeof entry.element?.className === "string"
          ? entry.element.className.slice(0, 120) : undefined,
        resource: entry.url ? new URL(entry.url).pathname : undefined,
      };
    }
  }).observe({ type: "largest-contentful-paint", buffered: true });
});

if (interactiveLogin) {
  await page.goto(new URL("/login", origin).toString());
  console.log(`Sign in to the test account in the opened browser window: ${origin}`);
  await page.waitForURL(/\/(student|teacher|school|admin)\/dashboard/, { timeout: 0 });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  console.log("Test account is signed in; starting traces.");
}

const cdp = await context.newCDPSession(page);
await cdp.send("Network.enable");

async function trace(label, clearCache) {
  if (clearCache) await cdp.send("Network.clearBrowserCache");
  const requests = [];
  const failures = [];
  const onFinished = async (request) => {
    const url = new URL(request.url());
    if (!isSiteHost(url.hostname)) return;
    if (!request.isNavigationRequest() && !url.pathname.startsWith("/api/")) return;
    const response = await request.response();
    if (!response) return;
    const timing = request.timing();
    const safeQuery = new URLSearchParams();
    for (const key of ["limit", "offset"]) {
      if (url.searchParams.has(key)) safeQuery.set(key, url.searchParams.get(key));
    }
    requests.push({
      path: url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ":id")
        + (safeQuery.size ? `?${safeQuery}` : ""),
      status: response.status(),
      durationMs: Math.round(timing.responseEnd),
      serverTiming: (await response.headerValue("server-timing")) ?? undefined,
    });
  };
  const onFailed = (request) => {
    const url = new URL(request.url());
    if (isSiteHost(url.hostname)) {
      failures.push({ path: url.pathname, error: request.failure()?.errorText });
    }
  };
  page.on("requestfinished", onFinished);
  page.on("requestfailed", onFailed);

  const startedAt = performance.now();
  await page.goto(new URL("/", origin).toString(), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(6000);
  const elapsedMs = Math.round(performance.now() - startedAt);
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const fcp = performance.getEntriesByName("first-contentful-paint")[0];
    return {
      redirectMs: Math.round(navigation?.redirectEnd - navigation?.redirectStart || 0),
      domContentLoadedMs: Math.round(navigation?.domContentLoadedEventEnd || 0),
      loadMs: Math.round(navigation?.loadEventEnd || 0),
      firstContentfulPaintMs: Math.round(fcp?.startTime || 0),
      largestContentfulPaintMs: Math.round(window.__lastLcp || 0),
      largestContentfulPaintCandidatesMs: window.__lcpEntries,
      largestContentfulPaintElement: window.__lastLcpDetail,
      slowResources: performance.getEntriesByType("resource")
        .map((entry) => ({
          host: new URL(entry.name).hostname,
          path: new URL(entry.name).pathname,
          durationMs: Math.round(entry.duration),
          transferBytes: entry.transferSize,
        }))
        .sort((a, b) => b.durationMs - a.durationMs)
        .slice(0, 8),
    };
  });
  page.off("requestfinished", onFinished);
  page.off("requestfailed", onFailed);
  console.log(JSON.stringify({
    label,
    finalPath: new URL(page.url()).pathname,
    elapsedMs,
    metrics,
    requests: requests.sort((a, b) => b.durationMs - a.durationMs),
    failures,
  }));
}

try {
  await trace("cache-cold", true);
  await trace("warm-reload", false);
} finally {
  await browser.close();
}
