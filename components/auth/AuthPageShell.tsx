"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

type AuthPageShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
  wide?: boolean;
};

export function AuthPageShell({
  title,
  subtitle,
  children,
  footer,
  backHref,
  onBack,
  backLabel = "Back",
  className,
  wide = false,
}: AuthPageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700",
        wide ? "max-w-2xl" : "max-w-md",
        className,
      )}
    >
      <div className="space-y-6">
        {backHref ? (
          <Link
            href={backHref}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors w-fit group"
          >
            <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            {backLabel}
          </Link>
        ) : null}
        {!backHref && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors w-fit group"
          >
            <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            {backLabel}
          </button>
        ) : null}

        <div className="space-y-2">
          <Typography
            variant="h1"
            className="auth-heading text-2xl font-bold tracking-tight text-foreground"
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="muted" className="text-sm leading-relaxed">
              {subtitle}
            </Typography>
          ) : null}
        </div>

        {children}
      </div>

      {footer ? <div className="pt-2">{footer}</div> : null}
    </div>
  );
}

type AuthFooterProps = {
  prompt: string;
  linkText: string;
  linkHref: string;
};

export function AuthFooter({ prompt, linkText, linkHref }: AuthFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1 text-sm">
      <Typography variant="muted">{prompt}</Typography>
      <Link
        href={linkHref}
        className="font-bold text-primary hover:text-primary/80 transition-colors"
      >
        {linkText}
      </Link>
    </div>
  );
}
