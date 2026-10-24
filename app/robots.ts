import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Auth-gated and private sections — the middleware redirects these to
        // /login, so there is no public value in letting crawlers spend crawl
        // budget here.
        disallow: [
          "/student/",
          "/teacher/",
          "/admin/",
          "/dashboard/",
          "/school/",
          "/api/",
          "/login",
          "/register",
          "/verify-otp",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
