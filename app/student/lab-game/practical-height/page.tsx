"use client";

import AddSVG from "@/public/svgs/AddSVG";

import { useMemo, useState } from "react";
import { Users, RotateCcw } from "lucide-react";
import BioHero from "../_practical/BioHero";

const BIN = 5;
const MIN = 100;
const MAX = 235;

// A rough normal sample for the "generate class" button.
const randNormal = (mean: number, sd: number) => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

export default function HeightPage() {
  const [heights, setHeights] = useState<number[]>([]);
  const [input, setInput] = useState("");

  const add = () => {
    const h = parseFloat(input);
    if (!isNaN(h) && h >= 100 && h <= 230) setHeights((xs) => [...xs, Math.round(h)]);
    setInput("");
  };
  const generate = () => setHeights(Array.from({ length: 30 }, () => Math.round(randNormal(163, 9))));

  const bins = useMemo(() => {
    const arr: { lo: number; hi: number; count: number }[] = [];
    for (let lo = MIN; lo < MAX; lo += BIN) arr.push({ lo, hi: lo + BIN, count: 0 });
    heights.forEach((h) => {
      const b = arr.find((x) => h >= x.lo && h < x.hi);
      if (b) b.count++;
    });
    return arr;
  }, [heights]);
  const maxCount = Math.max(1, ...bins.map((b) => b.count));
  const mean = heights.length ? (heights.reduce((a, b) => a + b, 0) / heights.length).toFixed(1) : "—";

  return (
    <div className="h-[100dvh] overflow-y-auto overscroll-contain bg-[#f4f6f4]">
      <div className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-5 sm:py-4">
        <BioHero badge="Biology · Practical 9" title="Continuous variation — human height">
          Measure each student&apos;s height, group into 5 cm intervals, and draw a histogram. Height varies continuously because many genes and the environment influence it.
        </BioHero>

        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <input
            type="number" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Height in cm (e.g. 162)"
            className="min-w-0 flex-1 rounded-2xl border border-black/10 px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary"
          />
          <button onClick={add} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-black text-white transition hover:bg-primary-dark"><AddSVG className="size-4" /> Add</button>
          <button onClick={generate} className="inline-flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2.5 text-sm font-black text-primary transition hover:bg-primary/20"><Users size={16} /> Sample class (30)</button>
          <button onClick={() => setHeights([])} className="inline-flex items-center gap-2 rounded-2xl bg-black/5 px-4 py-2.5 text-sm font-black text-black/60 transition hover:bg-black/10"><RotateCcw size={15} /> Reset</button>
        </div>

        <div className="mt-5 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black text-black">Frequency histogram</h2>
            <span className="text-xs font-bold text-black/50">n = {heights.length} · mean {mean} cm</span>
          </div>
          {heights.length===0&&<p className="rounded-xl bg-[#e9f4ec] px-3 py-2 text-xs font-bold text-[#39724e]">Add class heights or use the sample class to reveal the distribution.</p>}
          <div className="overflow-x-auto pb-2"><div className="flex h-56 min-w-[810px] items-end justify-between gap-1.5">
            {bins.map((b) => (
              <div key={b.lo} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-black text-black/60">{b.count || ""}</span>
                <div className="flex w-full items-end" style={{ height: "170px" }}>
                  <div className="w-full rounded-t-md bg-primary transition-all duration-300" style={{ height: `${(b.count / maxCount) * 100}%` }} />
                </div>
                <span className="text-[9px] font-bold text-black/45">{b.lo}</span>
              </div>
            ))}
          </div></div>
          <p className="mt-3 text-center text-xs font-bold text-black/45">Height interval (cm)</p>
        </div>
      </div>
    </div>
  );
}
