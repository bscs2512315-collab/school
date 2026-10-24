"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import PlaySVG from "@/public/svgs/PlaySVG";
import LabGameSVG from "@/public/svgs/LabGameSVG";
import { FRONTEND_ROUTES } from "@/constants/endpoints";

export default function LabExploreBanner() {
  const [isOpening, setIsOpening] = useState(false);
  return (
    <Link
      href={FRONTEND_ROUTES.STUDENT_LAB_EXPLORE}
      onClick={(event) => {
        if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setIsOpening(true);
      }}
      aria-busy={isOpening}
      className={`group relative mb-6 flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6 ${isOpening ? "pointer-events-none" : ""}`}
    >
      <div className="flex min-w-0 items-start gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
          <LabGameSVG className="size-7" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-widest text-primary dark:text-white">
            Free explore
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-foreground">
            Explore the chemistry lab
          </h3>
          <p className="mt-1.5 text-sm leading-snug text-muted-foreground">
            Walk the benches, turn on the sink, light the burner, and put out a fire.
          </p>
        </div>
      </div>

      <span className="mt-4 inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-sm transition-transform duration-300 group-hover:scale-105 sm:mt-0">
        {isOpening ? <LoaderCircle className="size-3.5 animate-spin" /> : <PlaySVG className="size-3.5" />}
        {isOpening ? "Opening…" : "Enter lab"}
      </span>
    </Link>
  );
}
