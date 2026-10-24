"use client";

import AuthGuard from "@/components/AuthGuard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthBranding } from "@/components/auth/AuthBranding";
import { AuthFormBackground } from "@/components/auth/AuthFormBackground";
import { AuthGuardType } from "@/types/enums";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/constants";
import { FRONTEND_ROUTES } from "@/constants/endpoints";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && (resolvedTheme === "dark" || theme === "dark")
      ? "/AppLogoDark.png"
      : "/AppLogoLight.png";

  return (
    <AuthGuard type={AuthGuardType.PUBLIC}>
      <div className="auth-container relative min-h-screen w-full overflow-hidden bg-card text-foreground transition-colors duration-300">
        {/* Desktop: keep toggle on the same vertical line as branding logo */}
        <div className="absolute top-12 right-6 z-50 hidden lg:block xl:right-8">
          <div className="rounded-xl border border-border bg-card/80 shadow-lg backdrop-blur-md">
            <ThemeToggle />
          </div>
        </div>

        <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-12">
          <div className="relative col-span-5 hidden lg:block">
            <AuthBranding />
          </div>

          <div className="relative col-span-7 flex min-h-screen flex-col bg-card px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
            <AuthFormBackground />

            <div className="relative z-10 mb-6 sm:mb-8 flex shrink-0 items-center justify-between gap-4 lg:hidden">
              <Link
                href={FRONTEND_ROUTES.HOME}
                className="relative h-20 w-56 xs:h-24 xs:w-64 sm:h-28 sm:w-72 max-w-[calc(100%-3.5rem)] transition-transform duration-200 active:scale-[0.98]"
                aria-label={`Go to ${APP_NAME} home`}
              >
                {mounted ? (
                  <Image
                    src={logoSrc}
                    alt={APP_NAME}
                    fill
                    className="object-contain object-left"
                    priority
                  />
                ) : (
                  <div className="h-full w-full animate-pulse rounded-lg bg-muted/30" />
                )}
              </Link>
              <div className="shrink-0 rounded-xl border border-border bg-card/80 shadow-lg backdrop-blur-md">
                <ThemeToggle />
              </div>
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center pb-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
