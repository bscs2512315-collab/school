"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Resets the scroll position to the top on every client-side route change.
 *
 * Next.js only manages the window/document scroll position. This app renders
 * inside `h-screen overflow-hidden` shells where the actual scrolling happens
 * in nested containers (e.g. `overflow-x-hidden` implicitly enables
 * `overflow-y: auto`, turning a content wrapper into its own scroller). Because
 * those elements stay mounted across navigations, their scroll offset would
 * otherwise persist onto the next page.
 *
 * We therefore reset the window plus any descendant element that is currently
 * scrolled. Only vertical offset is touched so horizontal carousels are not
 * disturbed.
 */
function resetScrollPosition() {
  if (typeof window === "undefined") return;

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });

  const scrollingEl = document.scrollingElement as HTMLElement | null;
  if (scrollingEl) scrollingEl.scrollTop = 0;
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;

  const nodes = document.querySelectorAll<HTMLElement>("body *");
  for (let i = 0; i < nodes.length; i += 1) {
    const el = nodes[i];
    if (el.scrollTop > 0) el.scrollTop = 0;
  }
}

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    resetScrollPosition();

    // Run again after the browser has laid out the new route so the reset
    // wins against any late layout/scroll-anchoring adjustments.
    const rafId = requestAnimationFrame(resetScrollPosition);

    return () => cancelAnimationFrame(rafId);
  }, [pathname]);

  return null;
}
