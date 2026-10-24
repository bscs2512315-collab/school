"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Shared header for the Biology data-tool practicals (dice, histogram, pie chart,
 * food web, diagrams). Green hero card with the Nova tutor avatar on the left and
 * a Quit button on the right.
 */
export default function BioHero({
  badge,
  title,
  children,
}: {
  badge: string; // e.g. "Biology · Practical 8"
  title: string;
  children: React.ReactNode; // the description / instruction line(s)
}) {
  return (
    <header className="rounded-2xl border border-[#dce8dd] bg-white px-4 py-3 shadow-sm sm:px-5">
      <div className="flex items-start gap-3">
        <Link href="/student/lab-game/biology" aria-label="Back to Biology lab" className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e9f3eb] text-[#216544] hover:bg-[#d8ebdc]"><ArrowLeft size={18} /></Link>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#65816b]">{badge}</p>
          <h1 className="text-lg font-black leading-tight text-[#193e2b] sm:text-xl">{title}</h1>
          <p className="mt-1 text-xs leading-snug text-[#58705e] sm:text-sm">{children}</p>
        </div>
      </div>
    </header>
  );
}
