"use client";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared shell for public, crawlable marketing/content pages. Reuses the
 * landing Navbar + Footer so every public page stays consistent and on-brand.
 */
export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
