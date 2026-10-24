import { APP_NAME, APP_DESCRIPTION, DEFAULT_BOARD } from "@/constants";

/**
 * Public origin for SEO, share links, and election URLs.
 * Set NEXT_PUBLIC_SITE_URL per environment (local / preview / production).
 */
export function resolveSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const vercelHost = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercelHost) {
    return vercelHost.startsWith("http") ? vercelHost : `https://${vercelHost}`;
  }

  return "http://localhost:3002";
}

/** Origin of the incoming request (localhost in dev, production host in prod). */
export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || request.headers.get("host") || url.host;
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const proto = forwardedProto || url.protocol.replace(":", "") || "http";
  return `${proto}://${host}`.replace(/\/$/, "");
}

/**
 * Site-wide configuration used for SEO metadata, sitemap and robots.
 */
export const SITE = {
  name: APP_NAME,
  description: APP_DESCRIPTION,
  board: DEFAULT_BOARD,
  url: resolveSiteUrl(),
  tagline:
    "AI-powered exam preparation for AKUEB and Sindh Board students — practice past papers, get instant AI marking, and climb the leaderboard.",
  email: "support@exboardai.tech",
  betaBanner:
    "ExBoard AI is an independent academic tool currently in public beta. All past papers, syllabi, and marks schemes are the property of their respective examination boards and are displayed solely for educational purpose and proof of concept.",
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@exboardai",
  },
} as const;

export const SITE_VERIFICATION = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  bing: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
};
