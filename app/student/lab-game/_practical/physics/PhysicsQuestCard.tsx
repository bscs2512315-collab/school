"use client";

import type { ReactNode } from "react";
import { CircuitBoard } from "lucide-react";

export default function PhysicsQuestCard({
  stage,
  step,
  total,
  title,
  description,
  children,
}: {
  stage: string;
  step: number;
  total: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="pointer-events-auto absolute bottom-0 left-0 z-20 w-full max-w-[540px] p-2 pb-[max(.5rem,env(safe-area-inset-bottom))] sm:p-4 lg:p-5" aria-label="Practical step">
      <div className="max-h-[53dvh] overflow-y-auto rounded-[26px] border border-white/90 bg-white/95 p-3 shadow-[0_20px_55px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:p-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#225b1d] text-white"><CircuitBoard size={18} strokeWidth={2.4} /></span>
          <div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[.17em] text-[#3c7a32]">Lab quest</p><p className="truncate text-xs font-bold text-slate-700">{stage}</p></div>
          <span className="rounded-full border border-[#d7e5d4] bg-[#eef6ec] px-2.5 py-1 font-mono text-[11px] font-black text-[#225b1d]">{String(step).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        </div>
        <div className="mt-3 flex gap-1" aria-label={`Step ${step} of ${total}`}>{Array.from({ length: total }, (_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < step - 1 ? "bg-[#225b1d]" : i === step - 1 ? "bg-[#83ab73]" : "bg-slate-200"}`} />)}</div>
        <h2 className="mt-3 text-base font-black leading-tight text-slate-900 sm:text-lg">{title}</h2>
        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">{description}</p>
        <div className="mt-3 flex flex-wrap gap-2">{children}</div>
      </div>
    </section>
  );
}
