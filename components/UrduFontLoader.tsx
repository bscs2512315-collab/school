"use client";

import { useEffect } from "react";

const FONT_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Scheherazade+New:wght@400;500;600;700&family=Lateef:wght@400;500;600;700;800&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap";

/** Avoid a render-blocking font request on pages without Urdu/Arabic content. */
export default function UrduFontLoader() {
  useEffect(() => {
    const loadIfNeeded = () => {
      if (!document.querySelector(".font-urdu, .font-arabic, [dir='rtl'], .urdu-text")) return false;
      if (!document.getElementById("exboard-urdu-font")) {
        const link = document.createElement("link");
        link.id = "exboard-urdu-font";
        link.rel = "stylesheet";
        link.href = FONT_STYLESHEET;
        document.head.appendChild(link);
      }
      return true;
    };

    if (loadIfNeeded()) return;
    const observer = new MutationObserver(() => {
      if (loadIfNeeded()) observer.disconnect();
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "dir"],
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, []);

  return null;
}
