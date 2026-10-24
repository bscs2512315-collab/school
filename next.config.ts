import path from "path";
import type { NextConfig } from "next";

// A stable identifier within one build, and a new identifier for every deploy.
// Hosting-provider commit IDs keep it readable when available; the timestamp is
// a reliable fallback for self-hosted builds.
const appBuildId =
  process.env.NEXT_PUBLIC_APP_BUILD_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.RENDER_GIT_COMMIT ||
  process.env.RAILWAY_GIT_COMMIT_SHA ||
  process.env.CF_PAGES_COMMIT_SHA ||
  Date.now().toString(36);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_BUILD_ID: appBuildId,
  },
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      {
        pathname: "/**",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: process.env.CLOUDINARY_CLOUD_NAME
          ? `/${process.env.CLOUDINARY_CLOUD_NAME}/**`
          : "/__unconfigured_cloudinary_account__/**",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/**",
      },
    ],
  },
  distDir: ".next",
  outputFileTracingExcludes: {
    "*": [
      "./public/diagrams/**",
      "./public/PastPapers/**",
      "./public/models/**",
      "./public/videos/**",
      "./tmp/**",
      "./scripts/**",
    ],
  },
  serverExternalPackages: ["msedge-tts", "ws", "pg"],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "three",
      "@react-three/drei",
      "@react-three/fiber",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=()",
          },
        ],
      },
      {
        source:
          "/:prefix(login|register|forgot-password|reset-password|verify-otp|dashboard|admin|student|teacher|school|papers-bank)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
      {
        source:
          "/:prefix(login|register|forgot-password|reset-password|verify-otp|dashboard|admin|student|teacher|school|papers-bank)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    const swaggerBundle = path.join(
      process.cwd(),
      "node_modules/swagger-ui-react/swagger-ui-bundle.js",
    );
    config.resolve.alias = {
      ...config.resolve.alias,
      "#swagger-ui": swaggerBundle,
      "swagger-ui-react/swagger-ui-es-bundle-core.js": swaggerBundle,
    };
    return config;
  },
};

export default nextConfig;
