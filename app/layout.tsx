import React, { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Poppins, Kalam } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import ScrollToTop from "@/components/layout/ScrollToTop";
import OfflineDetector from "@/components/OfflineDetector";
import PWAUpdater from "@/components/PWAUpdater";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PushNotificationAutoPrompt from "@/components/PushNotificationAutoPrompt";
import GlobalQABugButton from "@/components/qa/GlobalQABugButton";
import { Toaster } from "react-hot-toast";
import { SITE, SITE_VERIFICATION } from "@/lib/site";
import NextTopLoader from "nextjs-toploader";
import UrduFontLoader from "@/components/UrduFontLoader";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const kalam = Kalam({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-kalam",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#005F02" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f17" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — AI-Powered AKUEB & Sindh Board Exam Preparation`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.tagline,
  keywords: [
    "AKUEB exam preparation",
    "AKUEB past papers",
    "AKUEB practical journal",
    "AKUEB curriculum SLOs",
    "Sindh Board exam preparation",
    "Sindh Board past papers",
    "Karachi Board past papers",
    "BIEK Karachi past papers",
    "BSEK Karachi past papers",
    "Sindh Board solved notes",
    "board exam prep Pakistan",
    "AI exam marking",
    "AI paper checker",
    "Class 9 past papers",
    "Class 10 past papers",
    "Class 11 past papers",
    "Class 12 past papers",
    "SSC past papers Pakistan",
    "HSC past papers Pakistan",
    "Matric past papers",
    "Inter past papers",
    "Online test preparation Pakistan",
    "Physics past papers AKUEB",
    "Chemistry past papers AKUEB",
    "Mathematics past papers AKUEB",
    "Computer Science past papers AKUEB",
    "Biology past papers AKUEB",
    "Nova AI tutor",
    "Papers Bank",
    "ExBoard AI",
  ],
  category: "education",
  classification: "Educational Software / Academic Examination Preparation",
  applicationName: SITE.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE.name,
  },
  formatDetection: {
    telephone: false,
  },
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  openGraph: {
    ...SITE.openGraph,
    url: SITE.url,
    title: `${SITE.name} — AI-Powered AKUEB & Sindh Board Exam Preparation`,
    description: SITE.tagline,
    siteName: SITE.name,
    locale: "en_PK",
    images: [
      {
        url: `${SITE.url}/og.png`,
        width: 1200,
        height: 630,
        alt: `${SITE.name} — AI-Powered AKUEB & Sindh Board Exam Prep`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    ...SITE.twitter,
    title: `${SITE.name} — AI-Powered AKUEB & Sindh Board Exam Preparation`,
    description: SITE.tagline,
    images: [`${SITE.url}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  verification: SITE_VERIFICATION,
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${kalam.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Scheherazade+New:wght@400;500;600;700&family=Lateef:wght@400;500;600;700;800&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap"
        />
      </head>
      <body
        className={`${poppins.className} font-sans antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <UrduFontLoader />
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <NextTopLoader
              color="#005f02"
              initialPosition={0.08}
              crawlSpeed={200}
              height={3}
              crawl={true}
              showSpinner={false}
              easing="ease"
              speed={200}
              shadow="0 0 10px #005f02,0 0 5px #005f02"
              zIndex={99999}
            />
            <ScrollToTop />
            <OfflineDetector />
            <PWAUpdater />
            <PWAInstallPrompt />
            <PushNotificationAutoPrompt />
            <Suspense fallback={null}>
              <GlobalQABugButton />
            </Suspense>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "var(--color-background)",
                  color: "var(--color-foreground)",
                  border: "1px solid var(--color-border)",
                },
                success: {
                  iconTheme: {
                    primary: "#005F02",
                    secondary: "#ffffff",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "#ef4444",
                    secondary: "#ffffff",
                  },
                },
              }}
            />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
