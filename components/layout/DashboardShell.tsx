"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import { getDashboardPageTitle } from "@/lib/layout/get-dashboard-page-title";
import { PageTitleProvider, usePageTitle } from "@/components/layout/PageTitleContext";
import { isChildRoute } from "@/lib/layout/route-navigation";
import { isImmersiveMainPath } from "@/lib/quiz-screen";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: ReactNode;
  defaultTitle?: string;
  showBottomNav?: boolean;
  hideBottomNav?: (pathname: string) => boolean;
  immersiveMain?: (pathname: string) => boolean;
  fullscreen?: (pathname: string) => boolean;
}

export default function DashboardShell({
  children,
  defaultTitle = "Dashboard",
  showBottomNav = false,
  hideBottomNav,
  immersiveMain,
  fullscreen,
}: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isFullscreen = fullscreen ? fullscreen(pathname) : false;
  const pathHideBottomNav = hideBottomNav ? hideBottomNav(pathname) : false;
  const isChild = isChildRoute(pathname);

  // Automatically close mobile menu on route transitions
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle Escape key and prevent background scroll when sidebar is open
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-card text-foreground">
        <PageTitleProvider>{children}</PageTitleProvider>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-screen h-[100dvh] max-h-[100dvh] overflow-hidden bg-card text-foreground print:h-auto print:overflow-visible",
      )}
    >
      <Sidebar className="hidden lg:flex" />

      {isMobileMenuOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMobileMenuOpen(false);
          }}
          className="fixed inset-0 z-40 bg-black/60 cursor-pointer lg:hidden"
        >
          <span aria-hidden className="pointer-events-none absolute inset-0 backdrop-blur-sm" />
        </button>
      ) : null}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen max-h-screen w-64 transform transition-transform duration-300 ease-in-out supports-[height:100dvh]:h-dvh supports-[height:100dvh]:max-h-dvh lg:hidden",
          !isMobileMenuOpen && "pointer-events-none",
        )}
        style={{
          transform: isMobileMenuOpen ? "translate3d(0, 0, 0)" : "translate3d(-100%, 0, 0)",
          visibility: isMobileMenuOpen ? "visible" : "hidden",
        }}
      >
        <Sidebar
          className="h-full max-h-full w-full border-none"
          onItemClick={() => setIsMobileMenuOpen(false)}
          mobileChildPage={isChild}
        />
      </div>

      <PageTitleProvider>
        <DashboardColumn
          pathname={pathname}
          defaultTitle={defaultTitle}
          showBottomNav={showBottomNav}
          pathHideBottomNav={pathHideBottomNav}
          isChild={isChild}
          pathImmersive={immersiveMain ? immersiveMain(pathname) : isImmersiveMainPath(pathname)}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        >
          {children}
        </DashboardColumn>
      </PageTitleProvider>
    </div>
  );
}

function DashboardColumn({
  children,
  pathname,
  defaultTitle,
  showBottomNav,
  pathHideBottomNav,
  isChild,
  pathImmersive,
  onMenuClick,
}: {
  children: ReactNode;
  pathname: string;
  defaultTitle: string;
  showBottomNav: boolean;
  pathHideBottomNav: boolean;
  isChild: boolean;
  pathImmersive: boolean;
  onMenuClick: () => void;
}) {
  const layout = usePageTitle();
  const isBottomNavHidden = pathHideBottomNav || Boolean(layout?.hideBottomNav);
  const hasCustomHeaderBack = Boolean(layout?.headerBack);
  const effectiveIsChild = isChild || hasCustomHeaderBack;
  const isImmersive = pathImmersive;
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    const rId = requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });

    return () => cancelAnimationFrame(rId);
  }, [pathname]);

  return (
    <div
      className="relative flex min-w-0 flex-1 flex-col overflow-hidden print:h-auto print:overflow-visible"
    >
      <TopHeader
        title={getDashboardPageTitle(pathname, defaultTitle)}
        onMenuClick={onMenuClick}
        isChildPage={effectiveIsChild}
        mobileChildPage={effectiveIsChild}
      />

      <main
        ref={mainRef}
        className={cn("flex min-h-0 flex-1 flex-col print:h-auto print:overflow-visible", {
          "overflow-hidden bg-card": isImmersive,
          "custom-scrollbar overflow-x-hidden overflow-y-auto": !isImmersive,
        })}
      >
        <div
          className={cn("print:animate-none", {
            "flex h-full min-h-0 flex-col": isImmersive,
            "flex min-h-full flex-1 flex-col animate-in fade-in duration-500": !isImmersive,
            "pb-mobile-nav": showBottomNav && !isBottomNavHidden && !isImmersive,
          })}
        >
          {children}
          {showBottomNav && !isBottomNavHidden && !isImmersive ? (
            <div
              className="h-28 sm:h-32 w-full shrink-0 lg:hidden pointer-events-none select-none"
              aria-hidden="true"
            />
          ) : null}
        </div>
      </main>

      {showBottomNav ? <MobileBottomNav hidden={isBottomNavHidden} /> : null}
    </div>
  );
}
