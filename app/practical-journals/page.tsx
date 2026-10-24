import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FlaskConical, Atom, Dna, CheckCircle2 } from "lucide-react";
import { SITE } from "@/lib/site";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export const metadata: Metadata = {
  title: "AKUEB Practical Journals — Physics, Chemistry & Biology",
  description:
    "Complete AKUEB practical-journal write-ups for Physics, Chemistry and Biology — full method, apparatus, observations, result and sources of error, ready for class IX–XII lab books.",
  alternates: { canonical: "/practical-journals" },
  openGraph: {
    title: "AKUEB Practical Journals — Physics, Chemistry & Biology",
    description:
      "Complete AKUEB practical-journal write-ups: method, apparatus, observations, result and sources of error for Physics, Chemistry and Biology.",
    url: `${SITE.url}/practical-journals`,
    type: "website",
  },
};

const SUBJECTS = [
  {
    name: "Physics",
    icon: Atom,
    status: "Available",
    ready: true,
    desc: "Heat, calorimetry, electricity and optics experiments — coefficient of linear expansion, Newton's law of cooling, specific heat and more, with full write-ups.",
  },
  {
    name: "Chemistry",
    icon: FlaskConical,
    status: "Coming soon",
    ready: false,
    desc: "Salt analysis, functional-group tests and reducing-sugar experiments — full procedure and observations.",
  },
  {
    name: "Biology",
    icon: Dna,
    status: "Coming soon",
    ready: false,
    desc: "Genetics, histology, ecology and physiology — diagrams and write-ups to complete your lab book.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "AKUEB Practical Journals",
  description:
    "Complete practical-journal write-ups for Physics, Chemistry and Biology to help AKUEB students finish their lab books.",
  url: `${SITE.url}/practical-journals`,
  publisher: {
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
  },
};

export default function PracticalJournalsPage() {
  return (
    <MarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative overflow-hidden px-4 pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="landing-grid-fade pointer-events-none absolute inset-0 -z-10" />
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary">
            Practical Journals
          </span>
          <h1 className="landing-display mt-6 text-2xl text-foreground sm:text-4xl md:text-5xl">
            Complete your AKUEB practical journal
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            Step-by-step write-ups for the practical journal — object, apparatus,
            method, observations, result and sources of error — so you can finish
            your lab book accurately and be ready for the practical exam.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={FRONTEND_ROUTES.REGISTER}
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground"
            >
              Access the journals free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-10">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {SUBJECTS.map((s) => (
              <div
                key={s.name}
                className="rounded-2xl border border-border bg-card/50 p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <s.icon className="size-6" />
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      s.ready
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-bold text-foreground">
                  {s.name} Practical Journal
                </h2>
                <p className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="landing-display text-xl text-foreground sm:text-3xl">
            Every write-up includes
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              "Clear object and apparatus list",
              "Step-by-step method",
              "Observations and result",
              "Common sources of error",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl border border-border bg-card/50 p-5 text-sm font-semibold text-foreground"
              >
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
