"use client";

import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import ArrowUpSVG from "@/public/svgs/ArrowUpSVG";
import Link from "next/link";
import Image from "next/image";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { APP_NAME } from "@/constants";
import { FooterWordmark } from "@/components/landing/FooterWordmark";

const PRODUCT_LINKS = [
  { label: "Screens", href: `${FRONTEND_ROUTES.HOME}#product` },
  { label: "Features", href: `${FRONTEND_ROUTES.HOME}#features` },
  { label: "How it works", href: `${FRONTEND_ROUTES.HOME}#how-it-works` },
  { label: "Compete", href: `${FRONTEND_ROUTES.HOME}#gamification` },
  { label: "Pricing", href: `${FRONTEND_ROUTES.HOME}#pricing` },
] as const;

const PREPARE_LINKS = [
  { label: "User Guides Hub", href: "/guide" },
  { label: "How to Sign Up", href: "/guide/how-to-sign-up" },
  { label: "What is Play & Prep?", href: "/guide/what-is-play-and-prep" },
  { label: "Past papers", href: "/past-papers" },
  { label: "Practical journals", href: "/practical-journals" },
  { label: "Curriculum SLOs", href: "/curriculum" },
] as const;

const ACCOUNT_LINKS = [
  { label: "Log in", href: FRONTEND_ROUTES.LOGIN },
  { label: "Create account", href: FRONTEND_ROUTES.REGISTER },
  { label: "Forgot password?", href: FRONTEND_ROUTES.FORGOT_PASSWORD },
] as const;

const LINK_CLASS =
  "text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:text-primary";

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-5 text-xs font-black uppercase tracking-widest text-foreground">
      {children}
    </h4>
  );
}

export function Footer() {
  const scrollToHero = () => {
    const hero = document.getElementById("hero");
    if (hero) {
      hero.scrollIntoView({ behavior: "smooth" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative z-10 overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-full max-w-3xl -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl pt-16 pb-8 md:pt-20">
        <div className="grid grid-cols-1 gap-12 pb-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-4">
            <Link href={FRONTEND_ROUTES.HOME} className="relative mb-5 block h-16 w-64 sm:h-20 sm:w-80">
              <Image
                src="/AppLogoDark.png"
                alt={APP_NAME}
                fill
                className="hidden dark:block object-contain object-left"
              />
              <Image
                src="/AppLogoLight.png"
                alt={APP_NAME}
                fill
                className="block dark:hidden object-contain object-left"
              />
            </Link>
            <p className="mb-7 max-w-sm text-sm font-medium leading-relaxed text-muted-foreground">
              AI-powered board exam prep for AKUEB and Sindh Board students — past papers, marking,
              tutoring, and ranks, all in one place.
            </p>
            <Link
              href={FRONTEND_ROUTES.REGISTER}
              className="sticker-btn group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              Get started free
              <ArrowRightSVG className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="lg:col-span-2">
            <ColumnTitle>Product</ColumnTitle>
            <ul className="grid grid-cols-1 gap-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={LINK_CLASS}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <ColumnTitle>Prepare</ColumnTitle>
            <ul className="grid gap-3">
              {PREPARE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={LINK_CLASS}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <ColumnTitle>Account</ColumnTitle>
            <ul className="grid gap-3">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={LINK_CLASS}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <ColumnTitle>Contact</ColumnTitle>
            <ul className="grid gap-3">
              <li>
                <a href="mailto:support@exboardai.tech" className={LINK_CLASS}>
                  Support
                </a>
              </li>
              <li>
                <a href="mailto:support@exboardai.tech" className={LINK_CLASS}>
                  support@exboardai.tech
                </a>
              </li>
              <li className="sm:hidden">
                <Link href={FRONTEND_ROUTES.PRIVACY} className={LINK_CLASS}>
                  Privacy Policy
                </Link>
              </li>
              <li className="sm:hidden">
                <Link href={FRONTEND_ROUTES.TERMS} className={LINK_CLASS}>
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="relative">
          <div className="relative flex flex-col items-center justify-between gap-5 pt-9 sm:flex-row">
            <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1 text-xs font-semibold text-muted-foreground sm:justify-start">
              <span>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</span>
              <span className="hidden opacity-30 sm:inline">•</span>
              <Link href={FRONTEND_ROUTES.PRIVACY} className="hidden transition-colors hover:text-primary sm:inline">
                Privacy Policy
              </Link>
              <span className="hidden opacity-30 sm:inline">•</span>
              <Link href={FRONTEND_ROUTES.TERMS} className="hidden transition-colors hover:text-primary sm:inline">
                Terms &amp; Conditions
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 rounded-full border-2 border-foreground/10 px-3.5 py-1.5 text-xs font-bold text-muted-foreground">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75 dark:bg-logo-green" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary dark:bg-logo-green" />
                </span>
                Powered by MacroPulse Systems
              </span>

              <button
                type="button"
                onClick={scrollToHero}
                aria-label="Back to top"
                className="sticker-btn flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"
              >
                <ArrowUpSVG className="size-4" />
              </button>
            </div>
          </div>

          <FooterWordmark />
        </div>
      </div>
    </footer>
  );
}
