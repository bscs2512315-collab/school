"use client";

import React, { useState, useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import MoonSVG from "@/public/svgs/MoonSVG";
import StarSVG from "@/public/svgs/StarSVG";
import ScrollSVG from "@/public/svgs/ScrollSVG";

export interface BrandAdItem {
  id: string;
  brand_name: string;
  tagline?: string | null;
  image_url: string;
  target_url?: string | null;
  placement?: string;
  display_order?: number;
}

export interface DefaultInspirationalItem {
  id: string;
  type: "quran" | "greeting" | "dua";
  arabicText?: string;
  urduTranslation?: string;
  reference?: string;
  title?: string;
  subtitle?: string;
  badge: string;
  accentGradient: string;
  borderGlow: string;
  hideFooterText?: boolean;
}

export const DEFAULT_INSPIRATIONAL_ITEMS: DefaultInspirationalItem[] = [
  {
    id: "quran-rabbi-zidni-ilma",
    type: "quran",
    arabicText: "رَّبِّ زِدْنِي عِلْمًا",
    urduTranslation: "اے میرے رب! میرے علم میں اضافہ فرما۔ (سورۃ طٰہٰ: ۱۱۴)",
    badge: "الْقُرْآنُ الْکَرِیْم",
    accentGradient: "from-sidebar-from via-primary to-sidebar-to",
    borderGlow: "border-white/25 shadow-primary/25",
  },
  {
    id: "quran-15-19",
    type: "quran",
    arabicText: "وَالْأَرْضَ مَدَدْنَاهَا وَأَلْقَيْنَا فِيهَا رَوَاسِيَ وَأَنْبَتْنَا فِيهَا مِنْ كُلِّ شَيْءٍ مَوْزُونٍ",
    urduTranslation: "اور ہم نے زمین کو پھیلایا اور اس میں مضبوط پہاڑ رکھے اور اس میں ہر چیز ایک معین اندازے سے اگائی۔ (سورۃ الحجر: ۱۹)",
    badge: "الْقُرْآنُ الْکَرِیْم",
    accentGradient: "from-sidebar-from via-primary to-sidebar-to",
    borderGlow: "border-white/25 shadow-primary/25",
  },
  {
    id: "quran-15-20",
    type: "quran",
    arabicText: "وَجَعَلْنَا لَكُمْ فِيهَا مَعَايِشَ وَمَنْ لَسْتُمْ لَهُ بِرَازِقِينَ",
    urduTranslation: "اور ہم نے تمہارے لیے اس میں سامانِ معیشت پیدا کیے اور وہ مخلوقات بھی جنہیں تم رزق نہیں دیتے۔ (سورۃ الحجر: ۲۰)",
    badge: "الْقُرْآنُ الْکَرِیْم",
    accentGradient: "from-sidebar-from via-primary to-sidebar-to",
    borderGlow: "border-white/25 shadow-primary/25",
  },
  {
    id: "quran-ease-hardship",
    type: "quran",
    arabicText: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ، إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    urduTranslation: "پس بیشک ہر مشکل کے ساتھ آسانی ہے، یقیناً ہر مشکل کے ساتھ آسانی ہے۔ (سورۃ الشرح: ۵-۶)",
    badge: "الْقُرْآنُ الْکَرِیْم",
    accentGradient: "from-sidebar-from via-primary to-sidebar-to",
    borderGlow: "border-white/25 shadow-primary/25",
  },
];

function ShowcaseWatermarks({ item }: { item: DefaultInspirationalItem }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] select-none"
    >
      {/* Primary rotated open book watermark on bottom left */}
      <BookOpenSVG className="absolute -bottom-4 -left-3 size-28 text-white/[0.09] -rotate-12" />

      {/* Secondary crescent or scroll or star watermark */}
      {item.id === "quran-15-20" ? (
        <ScrollSVG className="absolute -top-2 left-24 size-16 text-white/[0.08] rotate-45" />
      ) : item.id === "quran-ease-hardship" ? (
        <StarSVG className="absolute top-1 left-24 size-14 text-white/[0.09] rotate-12" />
      ) : (
        <MoonSVG className="absolute top-1 left-24 size-14 text-white/[0.09] rotate-12" />
      )}

      {/* Decorative star watermark on bottom right */}
      <StarSVG className="absolute -bottom-2 right-24 size-8 text-white/[0.08] -rotate-6" />

      {/* Small floating duotone star watermark on top right */}
      <StarSVG className="absolute top-2.5 right-3 size-4 text-white/[0.15]" />
    </div>
  );
}

function ShowcaseBackground({ gradient }: { gradient: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <div className={cn("absolute inset-0 bg-linear-to-br", gradient)} />
      <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/25 blur-[40px]" />
      <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/30 blur-[35px]" />
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />
    </div>
  );
}

interface DashboardBrandShowcaseProps {
  className?: string;
  customAds?: BrandAdItem[];
  placement?: string;
  slideInterval?: number;
  autoPlay?: boolean;
  pauseOnHover?: boolean;
  spiritualFallback?: boolean;
}

export default function DashboardBrandShowcase({
  className,
  customAds,
  placement = "dashboard_showcase",
  slideInterval,
  autoPlay,
  pauseOnHover,
  spiritualFallback,
}: DashboardBrandShowcaseProps) {
  const [ads, setAds] = useState<BrandAdItem[]>(customAds || []);
  const [isLoading, setIsLoading] = useState(!customAds);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [slideIntervalState, setSlideIntervalState] = useState(slideInterval ?? 10);
  const [autoPlayState, setAutoPlayState] = useState(autoPlay ?? true);
  const [pauseOnHoverState, setPauseOnHoverState] = useState(pauseOnHover ?? true);
  const [spiritualFallbackState, setSpiritualFallbackState] = useState(spiritualFallback ?? true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync props if passed
  useEffect(() => {
    if (slideInterval !== undefined) setSlideIntervalState(slideInterval);
    if (autoPlay !== undefined) setAutoPlayState(autoPlay);
    if (pauseOnHover !== undefined) setPauseOnHoverState(pauseOnHover);
    if (spiritualFallback !== undefined) setSpiritualFallbackState(spiritualFallback);
  }, [slideInterval, autoPlay, pauseOnHover, spiritualFallback]);

  // Fetch active ads and showcase settings from backend
  useEffect(() => {
    if (customAds) {
      setAds(customAds);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function loadAds() {
      try {
        const res = await axios.get(`/api/advertisements?placement=${encodeURIComponent(placement)}`);
        if (isMounted && res.data?.success) {
          if (Array.isArray(res.data?.data)) {
            setAds(res.data.data);
          }
          if (res.data?.settings) {
            if (slideInterval === undefined && res.data.settings.slideInterval) {
              setSlideIntervalState(res.data.settings.slideInterval);
            }
            if (autoPlay === undefined && res.data.settings.autoPlay !== undefined) {
              setAutoPlayState(res.data.settings.autoPlay);
            }
            if (pauseOnHover === undefined && res.data.settings.pauseOnHover !== undefined) {
              setPauseOnHoverState(res.data.settings.pauseOnHover);
            }
            if (spiritualFallback === undefined && res.data.settings.spiritualFallback !== undefined) {
              setSpiritualFallbackState(res.data.settings.spiritualFallback);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load advertisements:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadAds();
    return () => {
      isMounted = false;
    };
  }, [customAds, placement, slideInterval, autoPlay, pauseOnHover, spiritualFallback]);

  const hasActiveAds = ads.length > 0;
  const showSpiritual = !hasActiveAds && spiritualFallbackState;
  const totalSlides = hasActiveAds
    ? ads.length
    : showSpiritual
      ? DEFAULT_INSPIRATIONAL_ITEMS.length
      : 0;

  // Auto rotate carousel based on configured slide duration
  useEffect(() => {
    if (!autoPlayState || isPaused || totalSlides <= 1) return;

    const ms = Math.max(3000, slideIntervalState * 1000);
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, ms);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlayState, isPaused, slideIntervalState, totalSlides]);

  const handleAdClick = (ad: BrandAdItem) => {
    if (ad.id) {
      axios.post(`/api/advertisements/${ad.id}/click`).catch(() => { });
    }
  };

  if (totalSlides === 0 && !isLoading) {
    return null;
  }

  return (
    <div
      className={cn("w-full max-w-[480px] mx-auto", className)}
      onMouseEnter={() => {
        if (pauseOnHoverState) setIsPaused(true);
      }}
      onMouseLeave={() => {
        if (pauseOnHoverState) setIsPaused(false);
      }}
      onTouchStart={() => {
        if (pauseOnHoverState) setIsPaused(true);
      }}
      onTouchEnd={() => {
        if (pauseOnHoverState) setIsPaused(false);
      }}
    >
      {/* Main Slide Carousel Stage */}
      <div className="relative h-[160px] sm:h-[162px] lg:h-[168px] xl:h-[172px] w-full overflow-hidden rounded-2xl">
        {hasActiveAds ? (
          // ================= RENDER ACTIVE BRAND ADS =================
          ads.map((ad, idx) => {
            const isCurrent = idx === currentIndex;
            const CardWrapper = ad.target_url ? "a" : "div";
            const wrapperProps = ad.target_url
              ? {
                href: ad.target_url,
                target: "_blank",
                rel: "noopener noreferrer",
                onClick: () => handleAdClick(ad),
              }
              : {};

            return (
              <div
                key={ad.id || idx}
                className={cn(
                  "absolute inset-0 transition-opacity duration-700 ease-in-out",
                  isCurrent
                    ? "opacity-100 z-10 pointer-events-auto visible"
                    : "opacity-0 z-0 pointer-events-none invisible"
                )}
              >
                <CardWrapper
                  {...wrapperProps}
                  className="group relative flex h-full w-full items-center justify-between overflow-hidden rounded-2xl border border-white/20 bg-card shadow-md transition-all hover:border-primary/50"
                >
                  {/* Background Ad Image */}
                  <div className="absolute inset-0 z-0 overflow-hidden bg-slate-900">
                    <img
                      src={ad.image_url}
                      alt={ad.brand_name}
                      className="size-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                    {/* Subtle dark gradient overlay so overlay badges stay readable */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
                  </div>

                  {/* Brand Tagline and Sponsor Badges */}
                  <div className="relative z-10 flex h-full w-full flex-col justify-between p-3.5 sm:p-4 lg:p-5 text-white">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10.5px] font-black text-white border border-white/20 shadow-xs">
                        <StarSVG className="size-3 text-amber-400" />
                        <span>{ad.brand_name}</span>
                      </span>

                      {ad.target_url && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[10.5px] font-bold text-white border border-white/30 transition-transform group-hover:scale-105">
                          <span>Visit Partner</span>
                          <ExternalLink className="size-3" />
                        </span>
                      )}
                    </div>

                    {ad.tagline && (
                      <div className="min-w-0 max-w-xl">
                        <p className="text-xs sm:text-sm font-extrabold text-white drop-shadow-md break-words">
                          {ad.tagline}
                        </p>
                      </div>
                    )}
                  </div>
                </CardWrapper>
              </div>
            );
          })
        ) : (
          // ================= RENDER SPIRITUAL / QURANIC / OCCASION NOTICES =================
          DEFAULT_INSPIRATIONAL_ITEMS.map((item, idx) => {
            const isCurrent = idx === currentIndex;
            return (
              <div
                key={item.id}
                className={cn(
                  "absolute inset-0 transition-opacity duration-700 ease-in-out",
                  isCurrent
                    ? "opacity-100 z-10 pointer-events-auto visible"
                    : "opacity-0 z-0 pointer-events-none invisible"
                )}
              >
                <div
                  className={cn(
                    "relative flex h-full w-full flex-col items-center justify-between text-center overflow-hidden rounded-2xl border p-2 sm:p-2.5 lg:px-4 lg:py-2 text-white shadow-md select-none",
                    item.borderGlow
                  )}
                >
                  {/* Dynamic Radiant Gradient Background */}
                  <ShowcaseBackground gradient={item.accentGradient} />

                  {/* Watermark Elements in Background */}
                  <ShowcaseWatermarks item={item} />

                  {/* Middle Content: Arabic / Urdu Text without truncation (Centered) */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full min-w-0 py-0.5 space-y-0.5 sm:space-y-1 flex-1">
                    {/* Bismillah Header */}
                    <p
                      dir="rtl"
                      className="font-urdu text-[10.5px] sm:text-[11.5px] lg:text-xs font-medium text-amber-200/95 !text-center text-center drop-shadow-xs break-words w-full tracking-wide leading-snug antialiased"
                      style={{
                        fontFamily: "var(--font-urdu), 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', serif",
                        textAlign: "center",
                      }}
                    >
                      بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
                    </p>

                    {item.arabicText && (
                      <p
                        dir="rtl"
                        className="font-urdu text-[12.5px] sm:text-[13.5px] lg:text-[14.5px] font-normal leading-[1.7] sm:leading-[1.8] text-white !text-center text-center drop-shadow-md break-words w-full px-2 antialiased"
                        style={{
                          fontFamily: "var(--font-urdu), 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', serif",
                          textAlign: "center",
                        }}
                      >
                        {item.arabicText}
                      </p>
                    )}

                    {item.subtitle && (
                      <p
                        dir="rtl"
                        className="font-urdu text-[9.5px] sm:text-[10px] lg:text-[10.5px] font-bold text-white/95 leading-[1.45] sm:leading-[1.5] !text-center text-center drop-shadow-xs break-words w-full px-1 antialiased"
                        style={{
                          fontFamily: "var(--font-urdu), 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', serif",
                          textAlign: "center",
                        }}
                      >
                        {item.subtitle}
                      </p>
                    )}

                    {item.urduTranslation && (
                      <p
                        dir="rtl"
                        className="font-urdu text-[9.5px] sm:text-[10px] lg:text-[10.5px] text-amber-100/95 font-medium leading-[1.55] sm:leading-[1.65] !text-center text-center drop-shadow-xs break-words w-full px-1 antialiased"
                        style={{
                          fontFamily: "var(--font-urdu), 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', serif",
                          textAlign: "center",
                        }}
                      >
                        {item.urduTranslation}
                      </p>
                    )}
                  </div>

                  {/* Bottom Text: ExBoard AI Notice Board */}
                  {!item.hideFooterText && (
                    <div className="relative z-10 flex items-center justify-center pt-0.5 text-white/70">
                      <span className="text-[8px] sm:text-[8.5px] lg:text-[9px] font-bold tracking-wider uppercase drop-shadow-xs">
                        ExBoard AI Notice Board
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
