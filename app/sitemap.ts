import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { GUIDES } from "@/lib/guides/guide-data";

/**
 * Public, crawlable routes. Anything behind auth (/student, /teacher, /admin,
 * /dashboard) is intentionally excluded — the middleware redirects those to
 * /login for unauthenticated visitors.
 */
const PUBLIC_ROUTES = [
  {
    path: "/",
    lastModified: new Date(),
    priority: 1.0,
    changeFrequency: "daily" as const,
  },
  {
    path: "/past-papers",
    lastModified: new Date(),
    priority: 0.9,
    changeFrequency: "daily" as const,
  },
  {
    path: "/guide",
    lastModified: new Date(),
    priority: 0.9,
    changeFrequency: "weekly" as const,
  },
  ...GUIDES.map((g) => ({
    path: `/guide/${g.slug}`,
    lastModified: new Date(),
    priority: 0.8,
    changeFrequency: "monthly" as const,
  })),
  {
    path: "/curriculum",
    lastModified: new Date(),
    priority: 0.8,
    changeFrequency: "weekly" as const,
  },
  {
    path: "/practical-journals",
    lastModified: new Date(),
    priority: 0.8,
    changeFrequency: "weekly" as const,
  },
  {
    path: "/privacy",
    lastModified: new Date(),
    priority: 0.5,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/privacy-policy",
    lastModified: new Date(),
    priority: 0.5,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/terms",
    lastModified: new Date(),
    priority: 0.5,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/terms-and-conditions",
    lastModified: new Date(),
    priority: 0.5,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/api-docs",
    lastModified: new Date(),
    priority: 0.4,
    changeFrequency: "monthly" as const,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE.url}${route.path}`,
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
