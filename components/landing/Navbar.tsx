"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { X, ChevronRight } from "lucide-react";
import AppLogo from "@/components/AppLogo";
import MenuSVG from "@/public/svgs/MenuSVG";
import { cn } from "@/lib/utils";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BetaBanner } from "@/components/landing/BetaBanner";

const NAV_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#gamification", label: "Compete" },
  { href: "#pricing", label: "Pricing" },
  { href: "/guide", label: "Guides" },
] as const;

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scrolling and close on Escape when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsMobileMenuOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalStyle;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isMobileMenuOpen]);

  const navigateToSection = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      event.preventDefault();
      setIsMobileMenuOpen(false);
      window.history.pushState(null, "", href);
      requestAnimationFrame(() => {
        document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "instant", block: "start" });
      });
    } else {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <BetaBanner />
      <nav
        className={cn("border-b transition-all duration-300", {
          "border-border/60 bg-background/85 py-2 sm:py-2.5 backdrop-blur-xl": isScrolled,
          "border-transparent bg-transparent py-3 sm:py-4": !isScrolled,
        })}
      >
        <div className="flex w-full items-center px-6 sm:px-8 lg:px-10">
          <Link href="/" className="flex shrink-0 items-center" aria-label="ExBoard AI home">
            <AppLogo className="h-14 w-52 sm:h-16 sm:w-64 lg:h-[4.5rem] lg:w-72" priority />
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(event) => navigateToSection(event, link.href)}
                className="rounded-full px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary lg:px-4"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="ml-auto hidden items-center gap-4 lg:flex xl:gap-6">
            <ThemeToggle />
            <Link
              href={FRONTEND_ROUTES.LOGIN}
              className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
            >
              Log in
            </Link>
            <Link
              href={FRONTEND_ROUTES.REGISTER}
              className="sticker-btn rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Get started
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-border/70 bg-background/80 p-2 text-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-muted active:scale-95"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <MenuSVG className="size-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Backdrop Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Slide-out Left Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-[290px] sm:w-[320px] max-w-[85vw] flex-col justify-between border-r border-border bg-background/95 p-6 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mobile Navigation"
      >
        <div className="flex flex-col gap-6">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3 pt-1">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} aria-label="ExBoard AI home" className="flex items-center">
              <AppLogo className="h-14 w-48 sm:h-16 sm:w-52" priority />
            </Link>
            <button
              type="button"
              className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close navigation menu"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(event) => navigateToSection(event, link.href)}
                className="group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-base font-semibold text-foreground/90 transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <span>{link.label}</span>
                <ChevronRight className="size-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-xs font-medium text-muted-foreground">Appearance</span>
            <ThemeToggle />
          </div>
          <Link
            href={FRONTEND_ROUTES.LOGIN}
            className="sticker-btn w-full rounded-xl bg-amber-400 py-2.5 text-center text-sm font-bold text-amber-950 shadow-md transition-all hover:bg-amber-300 dark:bg-amber-400 dark:text-amber-950"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Log in
          </Link>
          <Link
            href={FRONTEND_ROUTES.REGISTER}
            className="sticker-btn w-full rounded-xl bg-primary py-2.5 text-center text-sm font-bold text-primary-foreground shadow-md transition-all"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Get started
          </Link>
        </div>
      </aside>
    </header>
  );
}
