"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  BookOpen,
} from "lucide-react";
import PageContainer from "@/components/PageContainer";
import {
  JournalDocument,
  MathFormatted,
  type JournalConfig,
} from "@/app/student/lab-game/_practical/physics/Journal";
import {
  PHYSICS_JOURNALS,
  getPhysicsJournal,
} from "@/constants/practicalJournals";

export default function JournalViewerPage() {
  const params = useParams();
  const id = String(params.exp);
  const j = getPhysicsJournal(id);

  if (!j) {
    return (
      <PageContainer>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-black/5 text-black/40">
            <BookOpen className="size-8" />
          </div>
          <h2 className="text-xl font-black text-black">Practical Journal Not Found</h2>
          <p className="max-w-md text-sm text-black/60">
            The requested practical journal write-up could not be located.
          </p>
        </div>
      </PageContainer>
    );
  }

  const currentIndex = PHYSICS_JOURNALS.findIndex((item) => item.id === id);
  const prevJournal = currentIndex > 0 ? PHYSICS_JOURNALS[currentIndex - 1] : null;
  const nextJournal =
    currentIndex < PHYSICS_JOURNALS.length - 1 ? PHYSICS_JOURNALS[currentIndex + 1] : null;

  // Convert legacy or structured observation tables
  const observationTables = j.observations?.tables ?? (j.observationTable ? [
    {
      title: j.observationTable.title,
      head: j.observationTable.columns.map((c) => (c.unit ? `${c.label} (${c.unit})` : c.label)),
      rows: (j.observationTable.rows ?? []).map((r) =>
        j.observationTable!.columns.map((c) => String(r[c.key] ?? "—")),
      ),
      note: j.observationTable.note,
    },
  ] : undefined);

  // Format calculation section safely with proper math & fraction rendering
  const calculationNode = (() => {
    if (!j.calculation) {
      return (
        <p className="text-black/60">
          Use your recorded readings with the formula in Theory to calculate the result.
        </p>
      );
    }
    if (Array.isArray(j.calculation)) {
      return (
        <ol className="space-y-2 pl-4 list-decimal text-sm font-mono text-black/85">
          {j.calculation.map((step, idx) => (
            <li key={idx}>
              <MathFormatted content={step} as="span" />
            </li>
          ))}
        </ol>
      );
    }
    return (
      <div className="space-y-3">
        {j.calculation.formula && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-primary/70 mb-1">
              Working Formula
            </span>
            <MathFormatted
              content={j.calculation.formula}
              className="font-serif text-base sm:text-lg font-bold text-primary-dark"
            />
          </div>
        )}
        <div className="rounded-xl border border-black/5 bg-[#fcfdfc] p-3 sm:p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-black/50">
            Calculation Steps & Analysis
          </p>
          <ol className="space-y-2 pl-4 list-decimal text-sm font-mono text-black/85">
            {j.calculation.steps.map((step, idx) => (
              <li key={idx} className="leading-relaxed">
                <MathFormatted content={step} as="span" />
              </li>
            ))}
          </ol>
        </div>
        {j.calculation.finalValue && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 text-sm font-bold text-emerald-900 ring-1 ring-emerald-500/20">
            <span>Determined Value:</span>
            <MathFormatted
              content={j.calculation.finalValue}
              className="font-mono font-black text-emerald-950"
              as="span"
            />
          </div>
        )}
      </div>
    );
  })();

  const config: JournalConfig = {
    expNo: j.expNo,
    title: j.title,
    object: j.object,
    apparatus: j.apparatus,
    formula: j.formula,
    theory: (
      <div className="space-y-3">
        {j.theory.map((p, i) => (
          <div key={i}>
            {p.includes("=") || p.includes("∝") || p.includes("⇒") ? (
              <div className="my-3 flex items-center justify-center rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-3.5 text-center shadow-2xs">
                <MathFormatted
                  content={p}
                  className="font-serif text-base sm:text-lg font-bold text-primary-dark tracking-wide"
                />
              </div>
            ) : (
              <p className="leading-relaxed text-[#1f2937]">
                <MathFormatted content={p} as="span" />
              </p>
            )}
          </div>
        ))}
      </div>
    ),
    method: j.method,
    parameters: j.observations?.parameters,
    tables: observationTables,
    observation: j.observations?.notes ? (
      <div className="space-y-1.5 text-sm italic text-black/75">
        {j.observations.notes.map((n, idx) => (
          <p key={idx}>
            • <MathFormatted content={n} as="span" />
          </p>
        ))}
      </div>
    ) : null,
    calculation: calculationNode,
    result: <MathFormatted content={j.result} as="p" />,
    errors: j.errors,
    precautions: j.precautions,
    playRoute: j.playRoute,
  };

  return (
    <PageContainer className="pb-16 px-3 sm:px-6">
      {/* Top Header & Navigation Bar */}
      <div className="mb-6 flex flex-col gap-3 border-b border-black/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] sm:text-xs font-bold text-primary">
              Practical {j.expNo} of {PHYSICS_JOURNALS.length}
            </span>
            <span className="text-xs font-semibold text-black/40">• Class XII Physics</span>
          </div>
        </div>

        {/* Actions: Prev/Next & Virtual Lab */}
        <div className="flex items-center gap-2">
          {prevJournal && (
            <Link
              href={`/student/practical-journals/physics/${prevJournal.id}`}
              className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-black/80 shadow-2xs transition hover:bg-black/5"
              title={`Previous: Practical ${prevJournal.expNo}`}
            >
              <ChevronLeft className="size-3.5" />
              <span>Practical {prevJournal.expNo}</span>
            </Link>
          )}

          {nextJournal && (
            <Link
              href={`/student/practical-journals/physics/${nextJournal.id}`}
              className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-black/80 shadow-2xs transition hover:bg-black/5"
              title={`Next: Practical ${nextJournal.expNo}`}
            >
              <span>Practical {nextJournal.expNo}</span>
              <ChevronRight className="size-3.5" />
            </Link>
          )}

          {j.playRoute && (
            <Link
              href={j.playRoute}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-primary-dark"
            >
              <FlaskConical className="size-3.5" />
              <span>Open Virtual Lab</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Continuous-Scroll PDF Journal Document */}
      <JournalDocument config={config} />

      {/* Bottom Practical Switcher Navigation */}
      <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-3.5 sm:grid-cols-2">
        {prevJournal ? (
          <Link
            href={`/student/practical-journals/physics/${prevJournal.id}`}
            className="group flex flex-col rounded-2xl border border-black/10 bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
              <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              Previous Practical {prevJournal.expNo}
            </span>
            <span className="mt-1 text-sm font-bold text-black group-hover:text-primary transition-colors">
              {prevJournal.title}
            </span>
          </Link>
        ) : (
          <div className="rounded-2xl border border-dashed border-black/10 p-4 sm:p-5 text-xs text-black/40">
            Beginning of Class XII Physics Practicals
          </div>
        )}

        {nextJournal ? (
          <Link
            href={`/student/practical-journals/physics/${nextJournal.id}`}
            className="group flex flex-col items-end text-right rounded-2xl border border-black/10 bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
              Next Practical {nextJournal.expNo}
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="mt-1 text-sm font-bold text-black group-hover:text-primary transition-colors">
              {nextJournal.title}
            </span>
          </Link>
        ) : (
          <div className="rounded-2xl border border-dashed border-black/10 p-4 sm:p-5 text-right text-xs text-black/40">
            End of Class XII Physics Practicals
          </div>
        )}
      </div>
    </PageContainer>
  );
}
