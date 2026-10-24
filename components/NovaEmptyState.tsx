"use client";

import React, { type ComponentType, type ReactNode, type SVGProps } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import AppButton from "@/components/AppButton";

export interface NovaEmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  variant?: "default" | "outline" | "secondary";
}

export interface NovaEmptyStateProps {
  /** Main heading (defaults to OOPS!) */
  title?: string;
  /** Detailed description (defaults to "We can't find what you are looking for") */
  description?: string;
  /** Optional message / note */
  novaSpeech?: string;
  /** Optional custom icon badge */
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  /** Primary CTA action */
  action?: NovaEmptyStateAction;
  /** Secondary optional action */
  secondaryAction?: NovaEmptyStateAction;
  /** Visual variant: 'card' (default bounded box), 'fullscreen' (centered full page), 'inline' (minimal) */
  variant?: "card" | "fullscreen" | "inline";
  /** Optional custom children to render below description */
  children?: ReactNode;
  className?: string;
}

export default function NovaEmptyState({
  title = "OOPS!",
  description = "We can't find what you are looking for",
  icon,
  action,
  secondaryAction,
  variant = "card",
  children,
  className,
}: NovaEmptyStateProps) {
  const isClientOffline = typeof navigator !== "undefined" && !navigator.onLine;
  const isDefaultOops =
    !title ||
    title.trim().toUpperCase() === "OOPS!" ||
    title.trim().toLowerCase() === "no data found" ||
    title.trim().toLowerCase() === "no data available";

  const displayTitle = isDefaultOops
    ? isClientOffline
      ? "YOU ARE OFFLINE"
      : "OOPS!"
    : title.trim();

  const displayDescription =
    isClientOffline && isDefaultOops
      ? "Please check your internet connection and try again."
      : description || "We can't find what you are looking for";

  const Icon = icon;

  const content = (
    <div
      className={cn(
        "relative flex flex-1 w-full flex-col items-center justify-center text-center select-none py-10 sm:py-16 px-4 my-auto min-h-[50vh] sm:min-h-[60vh]",
        variant === "card" && "min-h-0 py-4 sm:py-6 my-0",
        variant === "inline" && "min-h-0 py-6 px-2 my-0",
        className,
      )}
    >
      <div className="relative z-10 flex flex-col items-center max-w-xl sm:max-w-2xl mx-auto space-y-2 w-full">
        {Icon && (
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-2">
            <Icon className="size-7" />
          </div>
        )}

        {/* Big Bold Kicker / Title: Responsive font scaling with natural wrapping and no truncation */}
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-foreground dark:text-white uppercase font-sans break-words max-w-full leading-tight">
          {displayTitle}
        </h2>

        {/* Subtitle Description */}
        {displayDescription && (
          <p className="text-sm sm:text-base text-muted-foreground dark:text-zinc-400 font-medium leading-relaxed max-w-md sm:max-w-lg mx-auto pt-1 break-words">
            {displayDescription}
          </p>
        )}

        {/* Extra Children */}
        {children && <div className="mt-4 w-full">{children}</div>}

        {/* Action Buttons */}
        {(action || secondaryAction) && (
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            {action &&
              (action.href ? (
                <Link href={action.href}>
                  <AppButton
                    variant={action.variant}
                    className="h-10 rounded-xl px-5 text-xs font-bold uppercase tracking-wider shadow-sm"
                  >
                    {action.icon && <action.icon className="size-4 mr-1.5" />}
                    {action.label}
                  </AppButton>
                </Link>
              ) : (
                <AppButton
                  onClick={action.onClick}
                  variant={action.variant}
                  className="h-10 rounded-xl px-5 text-xs font-bold uppercase tracking-wider shadow-sm"
                >
                  {action.icon && <action.icon className="size-4 mr-1.5" />}
                  {action.label}
                </AppButton>
              ))}

            {secondaryAction &&
              (secondaryAction.href ? (
                <Link href={secondaryAction.href}>
                  <AppButton
                    variant="outline"
                    className="h-10 rounded-xl px-4 text-xs font-bold uppercase tracking-wider"
                  >
                    {secondaryAction.label}
                  </AppButton>
                </Link>
              ) : (
                <AppButton
                  onClick={secondaryAction.onClick}
                  variant="outline"
                  className="h-10 rounded-xl px-4 text-xs font-bold uppercase tracking-wider"
                >
                  {secondaryAction.label}
                </AppButton>
              ))}
          </div>
        )}
      </div>
    </div>
  );

  return content;
}
