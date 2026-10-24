"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function BioMission({ number, title, subtitle, progress, total, visual, children }: { number: number; title: string; subtitle: string; progress: number; total: number; visual: React.ReactNode; children: React.ReactNode }) {
  return <main className="h-[100dvh] overflow-y-auto overscroll-contain bg-[#eff4ef] px-3 py-3 text-[#173e2b] sm:px-5 sm:py-4">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3"><Link href="/student/lab-game/biology" aria-label="Back to Biology lab" className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#d6e6d9] bg-white text-[#286746] shadow-sm"><ArrowLeft size={18} /></Link><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#64826b]">Biology practical {String(number).padStart(2, "0")} · Mission</p><h1 className="text-lg font-black leading-tight sm:text-2xl">{title}</h1><p className="mt-1 max-w-2xl text-xs text-[#5d7464] sm:text-sm">{subtitle}</p></div></div>
        <span className="flex items-center gap-1.5 rounded-full border border-[#d6e6d9] bg-white px-3 py-1.5 text-xs font-extrabold text-[#2b7049]"><CheckCircle2 size={14} /> {progress}/{total} found</span>
      </header>
      <div className="mt-3 flex gap-1.5" aria-label={`${progress} of ${total} complete`}>{Array.from({ length: total }, (_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i < progress ? "bg-[#2b925a]" : "bg-[#d5e5d8]"}`} />)}</div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
        <section className="min-w-0 overflow-hidden rounded-[24px] border border-[#d8e7db] bg-white shadow-sm">{visual}</section>
        <section className="min-w-0 rounded-[24px] border border-[#d8e7db] bg-white p-4 shadow-sm sm:p-5">{children}</section>
      </div>
    </div>
  </main>;
}
