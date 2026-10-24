"use client";

import React, { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, MapPin, Award, Loader2, FlaskConical } from "lucide-react";
import { REAGENTS } from "./SaltScene";
import { playPour } from "../_scene/labAudio";

const SaltScene = dynamic(() => import("./SaltScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">Loading lab…</div>
  ),
});

// Each group test: instruction + the correct observation (Fe³⁺ path).
const STEPS = [
  { title: "Add dil. HCl to Sample A", reagent: "dil. HCl", expect: "No precipitate → Group I absent." },
  { title: "Pass H₂S gas through the solution", reagent: "H₂S", expect: "No precipitate → Groups IB / IIB absent." },
  { title: "Add NH₄Cl + excess NH₄OH", reagent: "NH₄Cl + NH₄OH", expect: "Reddish-brown gelatinous ppt of Fe(OH)₃ → Group III." },
  { title: "Confirmatory: add KSCN", reagent: "KSCN", expect: "Blood-red colour → Fe³⁺ confirmed." },
];

export default function SaltFePage() {
  const [step, setStep] = useState(0);
  const [navHint, setNavHint] = useState("Move forward to the bench");
  const [ready, setReady] = useState(false);
  const [pouring, setPouring] = useState(false);
  const [obs, setObs] = useState(["", "", "", ""]);
  const [inference, setInference] = useState("");
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState<{ marks: number; maxMarks: number; feedback: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const done = step >= STEPS.length;

  const onReact = useCallback(() => {
    setPouring((p) => {
      if (p) return p;
      playPour();
      window.setTimeout(() => {
        setStep((s) => Math.min(STEPS.length, s + 1));
        setPouring(false);
      }, 1200);
      return true;
    });
  }, []);
  const onNavHint = useCallback((h: string) => setNavHint(h), []);
  const onReady = useCallback((r: boolean) => setReady(r), []);

  const submit = useCallback(async () => {
    setGrading(true);
    setErr(null);
    try {
      const observation = STEPS.map((s, i) => `${s.reagent}: ${obs[i] || "(blank)"}`).join(" | ");
      const res = await fetch("/api/lab/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practical: "salt-fe3", observation, inference }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Grading failed");
      setGrade(json.data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Grading failed");
    } finally {
      setGrading(false);
    }
  }, [obs, inference]);

  const cur = STEPS[Math.min(step, STEPS.length - 1)];
  const prompt = pouring ? "Reacting…" : ready && !done ? `Click the tube to add ${cur.reagent}` : null;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#e3e7e4]">
      <div className="absolute inset-0">
        <SaltScene step={step} pouring={pouring} onReact={onReact} onNavHint={onNavHint} onReady={onReady} />
      </div>

      {/* crosshair + prompt */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className={`h-2.5 w-2.5 rounded-full border-2 ${ready ? "border-emerald-500 bg-emerald-500/40" : "border-white/70"}`} />
        {prompt && <div className="mt-3 rounded-full bg-black/75 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur">{prompt}</div>}
      </div>

      {/* top bar */}
      <div data-ui className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <Link href="/student/lab-game/chemistry" className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-black/80">
          <ArrowLeft size={16} /> Back
        </Link>
        <span className="rounded-full bg-black/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/90 backdrop-blur">
          Salt Analysis · Detect Fe³⁺
        </span>
      </div>

      {/* tutor / observation panel */}
      <div data-ui className="pointer-events-none absolute bottom-0 left-0 p-4 sm:p-6">
        <div className="pointer-events-auto flex w-96 gap-3 rounded-3xl border border-white/40 bg-white/92 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-3xl shadow-md">🧑‍🔬</div>
            <span className="mt-1 text-[9px] font-black uppercase tracking-widest text-primary/70">Tutor</span>
          </div>
          <div className="min-w-0 flex-1">
            {!done ? (
              <>
                <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Wet test {step + 1} of {STEPS.length}</p>
                <h2 className="text-sm font-black leading-tight text-black">{cur.title}</h2>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-1.5">
                  <MapPin size={14} className="shrink-0 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-800">{navHint}</span>
                </div>
                <p className="mt-2 text-[11px] leading-snug text-black/50">Expected: {cur.expect}</p>
                <div className="mt-3 flex gap-1">
                  {STEPS.map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${step > i ? "bg-emerald-500" : "bg-black/10"}`} />
                  ))}
                </div>
              </>
            ) : !grade ? (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <FlaskConical size={16} className="text-primary" />
                  <h2 className="text-sm font-black text-black">Record your observations</h2>
                </div>
                <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                  {STEPS.map((s, i) => (
                    <div key={i}>
                      <label className="text-[10px] font-bold text-black/50">{s.reagent}</label>
                      <input
                        value={obs[i]}
                        onChange={(e) => setObs((o) => o.map((v, j) => (j === i ? e.target.value : v)))}
                        placeholder="Observation…"
                        className="w-full rounded-lg border border-black/15 bg-white px-2 py-1 text-xs text-black outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                  <label className="text-[10px] font-bold text-black/50">Inference (basic radical)</label>
                  <input
                    value={inference}
                    onChange={(e) => setInference(e.target.value)}
                    placeholder="Which cation is present?"
                    className="w-full rounded-lg border border-black/15 bg-white px-2 py-1 text-xs text-black outline-none focus:border-primary"
                  />
                </div>
                {err && <p className="mt-1 text-xs font-semibold text-red-600">{err}</p>}
                <button
                  onClick={submit}
                  disabled={grading}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary-dark disabled:opacity-50"
                >
                  {grading ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
                  {grading ? "Grading…" : "Submit for grading"}
                </button>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white"><Award size={20} /></div>
                <h2 className="text-lg font-black text-black">{grade.marks} / {grade.maxMarks} marks</h2>
                <p className="mt-1 text-xs leading-snug text-black/70">{grade.feedback}</p>
                <Link href="/student/lab-game/chemistry" className="mt-3 inline-block rounded-xl bg-black px-4 py-2 text-xs font-bold text-white">Done</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
