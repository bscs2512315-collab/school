"use client";

import { ReactNode, useEffect } from "react";
import ArrowLeftSVG from "@/public/svgs/ArrowLeftSVG";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/components/layout/PageTitleContext";

interface PageHeaderProps {
  title: string;
  description?: string;
  watermark?: string;
  showWatermark?: boolean;
  filled?: boolean;
  onBack?: () => void;
  /** Short title shown in the top header below the `lg` breakpoint. */
  mobileTitle?: string;
  /** Hide the back control below the `sm` breakpoint (e.g. when the shell already handles nav). */
  hideBackOnMobile?: boolean;
  showLine?: boolean;
  actions?: ReactNode;
  headerActions?: ReactNode;
  actionsFullWidth?: boolean;
  className?: string;
}

/**
 * Syncs the page title into the top header.
 * On large screens (lg+): Actions appear in the top header breadcrumb right next to the bell icon, and are hidden in the page body.
 * On small screens (< lg): Actions appear at the original page position with full width.
 */
export default function PageHeader({
  title,
  mobileTitle,
  onBack,
  hideBackOnMobile = false,
  actions,
  headerActions,
  actionsFullWidth = false,
  className,
}: PageHeaderProps) {
  const pageTitleContext = usePageTitle();
  const setPageTitle = pageTitleContext?.setPageTitle;
  const setMobileTitle = pageTitleContext?.setMobileTitle;
  const setHeaderActions = pageTitleContext?.setHeaderActions;
  const setHeaderBack = pageTitleContext?.setHeaderBack;

  // The effective action to display in the top header breadcrumb next to the bell icon on large screens
  const effectiveHeaderAction = headerActions ?? actions ?? null;

  useEffect(() => {
    setPageTitle?.(title);
    setMobileTitle?.(mobileTitle ?? null);
    setHeaderActions?.(effectiveHeaderAction);
    setHeaderBack?.(onBack ?? null);

    return () => {
      setPageTitle?.(null);
      setMobileTitle?.(null);
      setHeaderActions?.(null);
      setHeaderBack?.(null);
    };
  }, [title, mobileTitle, effectiveHeaderAction, onBack, setPageTitle, setMobileTitle, setHeaderActions, setHeaderBack]);

  const showBodyBack = Boolean(onBack && !pageTitleContext);

  if (!showBodyBack && !actions) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative mb-4 flex w-full flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:mb-6",
        !showBodyBack && actions && "lg:hidden",
        className,
      )}
    >
      {showBodyBack ? (
        <button
          type="button"
          onClick={onBack}
          className={cn(
            "group flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-2xs transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary",
            { "hidden sm:flex": hideBackOnMobile },
          )}
          aria-label="Go back"
        >
          <ArrowLeftSVG className="size-5 transition-transform group-hover:-translate-x-0.5" />
        </button>
      ) : null}

      {actions ? (
        <div
          className={cn(
            "flex w-full flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 lg:hidden",
            "[&>*]:w-full sm:[&>*]:w-auto [&_button]:w-full sm:[&_button]:w-auto",
            {
              "ml-auto w-full": actionsFullWidth,
              "shrink-0": !actionsFullWidth,
              "ml-auto w-full sm:w-auto": hideBackOnMobile && !actionsFullWidth,
            },
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
