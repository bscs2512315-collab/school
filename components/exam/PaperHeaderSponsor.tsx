"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import StarSVG from "@/public/svgs/StarSVG";
import CrownSVG from "@/public/svgs/CrownSVG";
import { cn } from "@/lib/utils";

interface HeaderSponsor {
  id: string;
  brand_name: string;
  tagline?: string | null;
  image_url: string;
  target_url?: string | null;
}

interface PaperHeaderSponsorProps {
  placement?: "paper_1" | "paper_2" | "all_papers" | "paper_header" | string;
  variant?: "badge" | "banner" | "compact";
  className?: string;
}

export default function PaperHeaderSponsor({
  placement = "paper_header",
  variant = "badge",
  className,
}: PaperHeaderSponsorProps) {
  const [sponsor, setSponsor] = useState<HeaderSponsor | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadHeaderSponsor() {
      try {
        const res = await axios.get(
          `/api/advertisements?placement=${encodeURIComponent(placement)}`
        );
        if (
          isMounted &&
          res.data?.success &&
          Array.isArray(res.data?.data) &&
          res.data.data.length > 0
        ) {
          setSponsor(res.data.data[0]);
        }
      } catch (e) {
        // Silently fail if no header sponsor
      }
    }
    loadHeaderSponsor();
    return () => {
      isMounted = false;
    };
  }, [placement]);

  if (!sponsor) return null;

  const handleClick = () => {
    if (sponsor.id) {
      axios.post(`/api/advertisements/${sponsor.id}/click`).catch(() => {});
    }
  };

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "relative my-3 flex items-center justify-between overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-r from-sidebar-from via-primary to-sidebar-to p-3 text-primary-foreground shadow-sm animate-in fade-in sm:px-4",
          className
        )}
      >
        <div className="flex items-center gap-3">
          {sponsor.image_url ? (
            <div className="flex h-10 w-24 shrink-0 items-center justify-center rounded-xl bg-white/95 p-1 shadow-xs">
              <img
                src={sponsor.image_url}
                alt={sponsor.brand_name}
                className="size-full object-contain"
              />
            </div>
          ) : (
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/20">
              <CrownSVG className="size-5 text-amber-300" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary-foreground/75">
                Official Exam Partner
              </span>
            </div>
            <p className="text-xs font-bold text-white sm:text-sm">
              {sponsor.tagline || sponsor.brand_name}
            </p>
          </div>
        </div>

        {sponsor.target_url && (
          <a
            href={sponsor.target_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="inline-flex items-center gap-1 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/30 active:scale-95"
          >
            <span>Visit</span>
            <StarSVG className="size-3 text-amber-300" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center gap-1.5 animate-in fade-in",
        className
      )}
    >
      <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground/80">
        Partner:
      </span>
      {sponsor.image_url ? (
        <a
          href={sponsor.target_url || "#"}
          target={sponsor.target_url ? "_blank" : undefined}
          rel="noopener noreferrer"
          onClick={handleClick}
          className="group inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/60 px-2 py-0.5 text-[10.5px] font-bold text-foreground transition-all hover:border-primary/40 hover:bg-muted"
        >
          <img
            src={sponsor.image_url}
            alt={sponsor.brand_name}
            className="h-4 max-w-20 object-contain rounded-xs transition-transform group-hover:scale-105"
          />
          <span className="max-w-32 truncate">{sponsor.brand_name}</span>
        </a>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-[10.5px] font-bold text-primary">
          <StarSVG className="size-3 text-amber-500" />
          <span>{sponsor.brand_name}</span>
        </span>
      )}
    </div>
  );
}
