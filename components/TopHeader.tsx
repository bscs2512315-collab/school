"use client";

import React from "react";
import { ThemeToggle } from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import MenuSVG from "@/public/svgs/MenuSVG";
import { Typography } from "@/components/ui/Typography";
import { usePageTitle } from "@/components/layout/PageTitleContext";
import { usePathname, useRouter } from "next/navigation";
import ChevronLeftDuotone from "@/components/icons/ChevronLeftDuotone";
import { isChildRoute, getParentRoute } from "@/lib/layout/route-navigation";

interface TopHeaderProps {
  title?: string;
  mobileTitle?: string;
  onMenuClick?: () => void;
  isChildPage?: boolean;
  mobileChildPage?: boolean;
}

export default function TopHeader({
  title: fallbackTitle,
  mobileTitle: mobileFallbackTitle,
  onMenuClick,
  isChildPage: explicitIsChildPage,
  mobileChildPage: explicitMobileChildPage,
}: TopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const pageTitleContext = usePageTitle();
  const pageTitle = pageTitleContext?.title ?? fallbackTitle ?? "Dashboard";
  const mobileTitle =
    mobileFallbackTitle ??
    pageTitleContext?.mobileTitle ??
    null;
  const headerActions = pageTitleContext?.headerActions ?? null;
  const headerBack = pageTitleContext?.headerBack;

  const isChild = explicitIsChildPage ?? isChildRoute(pathname);
  const showBack = isChild || Boolean(headerBack);
  const isMobileChild = explicitMobileChildPage ?? isChild;

  const handleBack = () => {
    if (headerBack) {
      headerBack();
      return;
    }
    const target = getParentRoute(pathname);
    if (target) {
      router.push(target);
      return;
    }
    router.back();
  };

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-border bg-card px-4 sm:px-6 print:hidden">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {onMenuClick && !isMobileChild ? (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted lg:hidden cursor-pointer"
          >
            <MenuSVG className="size-7" />
          </button>
        ) : null}

        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground cursor-pointer"
          >
            <ChevronLeftDuotone className="size-6" />
          </button>
        ) : null}
        <div className="flex min-w-0 items-center gap-3">
          <Typography
            variant="h3"
            className="truncate text-xl font-bold text-foreground sm:text-lg"
          >
            {mobileTitle ? (
              <>
                <span className="lg:hidden">{mobileTitle}</span>
                <span className="hidden lg:inline">{pageTitle}</span>
              </>
            ) : (
              pageTitle
            )}
          </Typography>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
        {headerActions ? (
          <div className="hidden lg:flex items-center gap-2">
            {headerActions}
          </div>
        ) : null}
        <NotificationBell variant="header" />
        <div className={isMobileChild ? "hidden lg:block" : undefined}><ThemeToggle /></div>
        {onMenuClick && isMobileChild ? (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted lg:hidden cursor-pointer"
          >
            <MenuSVG className="size-7" />
          </button>
        ) : null}
      </div>
    </header>
  );
}

