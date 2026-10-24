"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BackgroundGraphics } from "@/components/auth/BackgroundGraphics";
import { APP_NAME } from "@/constants";
import { FRONTEND_ROUTES } from "@/constants/endpoints";

export function AuthBranding() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden auth-brand-gradient p-12 xl:p-14">
      <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-48 bg-linear-to-b from-black/50 via-black/20 to-transparent" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-15%] size-80 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-15%] size-96 rounded-full bg-black/15 blur-3xl" />
      </div>

      <BackgroundGraphics />

      {/* Logo */}
      <Link
        href={FRONTEND_ROUTES.HOME}
        className="absolute top-10 left-10 z-20 w-44 xl:top-12 xl:left-12 xl:w-52"
        aria-label={`Go to ${APP_NAME} home`}
      >
        {mounted ? (
          <Image
            src="/AppLogoDark.png"
            alt={APP_NAME}
            width={208}
            height={52}
            className="h-auto w-full object-contain object-left"
            priority
          />
        ) : (
          <div className="h-12 w-full animate-pulse rounded-lg bg-primary-foreground/10" />
        )}
      </Link>

      {/* Center tagline */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
        <h2 className="auth-heading text-primary-foreground text-3xl font-extrabold tracking-tight text-balance drop-shadow-lg xl:text-4xl auth-headline">
          <span className="block">Learn.</span>
          <span className="block">Compete. Prepare.</span>
        </h2>
      </div>

      {/* Bottom description */}
      <div className="relative z-20 mt-auto max-w-sm">
        <p className="text-primary-foreground/90 text-sm font-medium leading-relaxed">
          Your AI-powered exam preparation platform. Practice past papers, track
          progress, and excel in board examinations.
        </p>
      </div>

      {/* Subtle crescent curve into the form panel */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 h-full w-12 translate-x-1/2 fill-background xl:w-14"
        aria-hidden
      >
        <path d="M0,0 C12,12 12,88 0,100 L100,100 L100,0 Z" />
      </svg>
    </div>
  );
}
