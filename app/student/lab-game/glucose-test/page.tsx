"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Droplet, Flame, CheckCircle2, Loader2, Award } from "lucide-react";

const GlucoseScene = dynamic(() => import("./GlucoseScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
      Loading lab…
    </div>
  ),
});

// Guidance for each phase (matches the scene's ordered state machine).
const STEPS = [
  { icon: Droplet, title: "Add the glucose solution", body: "Click the labelled Glucose bottle — you'll draw it up with the pipette and add a few drops to the test tube." },
  { icon: Droplet, title: "Add Fehling's A", body: "Click the Fehling's A bottle (blue) — the copper(II) sulphate solution." },
  { icon: Droplet, title: "Add Fehling's B", body: "Click the Fehling's B bottle (green) — the alkaline sodium potassium tartrate. The solution turns deep blue." },
  { icon: Flame, title: "Heat the mixture", body: "Click the Bunsen burner to warm the tube gently. Watch the colour change carefully." },
  { icon: Flame, title: "Reaction in progress…", body: "The blue solution is being reduced — observe what forms." },
];

type Grade = { marks: number; maxMarks: number; feedback: string };

export default function GlucoseTestPage() {
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);

  const [observation, setObservation] = useState("");
  const [inference, setInference] = useState("");
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [error, setError] = useState<string | null>(null);

  const step = STEPS[Math.min(phase, STEPS.length - 1)];
  const Icon = step.icon;

  const submit = async () => {
    setGrading(true);
    setError(null);
    try {
      const res = await fetch("/api/lab/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practical: "glucose-fehling", observation, inference }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Grading failed");
      setGrade(json.data as Grade);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed");
    } finally {
      setGrading(false);
    }
  };

  const reset = () => {
    setPhase(0);
    setDone(false);
    setObservation("");
    setInference("");
    setGrade(null);
    setError(null);
    setSceneKey((k) => k + 1);
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#dfe4ea]">
      <div className="absolute inset-0">
        <GlucoseScene key={sceneKey} onPhase={setPhase} onDone={() => setDone(true)} />
      </div>

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <Link
          href="/student/lab-game"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/80"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <span className="pointer-events-none rounded-full bg-black/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/90 backdrop-blur">
          Chemistry XII · Stage III · Glucose
        </span>
      </div>

      {/* Bottom panel: guidance OR answer form */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-6">
        <div className="pointer-events-auto w-full max-w-lg rounded-3xl border border-white/40 bg-white/90 p-5 shadow-2xl backdrop-blur-md">
          {!done ? (
            <>
              <div className="mb-3 flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= phase ? "bg-emerald-500" : "bg-black/10"}`} />
                ))}
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-black/40">
                    Step {Math.min(phase + 1, STEPS.length)} of {STEPS.length}
                  </p>
                  <h2 className="text-lg font-black leading-tight text-black">{step.title}</h2>
                  <p className="mt-1 text-sm leading-snug text-black/70">{step.body}</p>
                </div>
              </div>
            </>
          ) : grade ? (
            // ---- Result ----
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Award size={28} />
              </div>
              <h2 className="text-2xl font-black text-black">
                {grade.marks} / {grade.maxMarks} marks
              </h2>
              <p className="mt-2 text-sm leading-snug text-black/70">{grade.feedback}</p>
              <button onClick={reset} className="mt-4 w-full rounded-2xl bg-black px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black/85">
                Try again
              </button>
            </div>
          ) : (
            // ---- Answer form (mirrors the exam paper) ----
            <div>
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <h2 className="text-base font-black text-black">Reaction complete — record your result</h2>
              </div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-black/50">Observation</label>
              <textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="What did you see happen on heating?"
                rows={2}
                className="mb-3 w-full resize-none rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary"
              />
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-black/50">Inference</label>
              <textarea
                value={inference}
                onChange={(e) => setInference(e.target.value)}
                placeholder="What does this tell you about the sample?"
                rows={2}
                className="mb-3 w-full resize-none rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary"
              />
              {error && <p className="mb-2 text-sm font-semibold text-red-600">{error}</p>}
              <button
                onClick={submit}
                disabled={grading || (!observation && !inference)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary-dark disabled:opacity-50"
              >
                {grading ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
                {grading ? "Grading…" : "Submit for grading"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
