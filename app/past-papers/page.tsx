import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { SITE } from "@/lib/site";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export const metadata: Metadata = {
  title: "AKUEB Past Papers — Practice Real Board Papers",
  description:
    "Practice real AKUEB board past papers for Physics, Chemistry, Biology, Mathematics and Computer Science. Get instant AI marking and detailed feedback for classes IX–XII.",
  alternates: { canonical: "/past-papers" },
  openGraph: {
    title: "AKUEB Past Papers — Practice Real Board Papers",
    description:
      "Practice real AKUEB board past papers with instant AI marking and detailed feedback for classes IX–XII.",
    url: `${SITE.url}/past-papers`,
    type: "website",
  },
};

const SUBJECTS = [
  {
    name: "Physics",
    classes: "IX, X, XI, XII",
    desc: "Mechanics, electricity, waves and modern physics questions from past boards.",
  },
  {
    name: "Chemistry",
    classes: "IX, X, XI, XII",
    desc: "Organic, inorganic and physical chemistry past-paper questions with solutions.",
  },
  {
    name: "Biology",
    classes: "IX, X, XI, XII",
    desc: "Cell biology, genetics, physiology and ecology questions tuned to the board.",
  },
  {
    name: "Mathematics",
    classes: "IX, X, XI, XII",
    desc: "Algebra, calculus, and trigonometry past-paper problems with worked marking.",
  },
  {
    name: "Computer Science",
    classes: "IX, X, XI, XII",
    desc: "Programming, databases and computational thinking board-style questions.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "AKUEB Past Papers",
  description:
    "Practice real AKUEB board past papers with instant AI marking for Physics, Chemistry, Biology, Mathematics and Computer Science.",
  url: `${SITE.url}/past-papers`,
  publisher: {
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
  },
  hasPart: SUBJECTS.map((s) => ({
    "@type": "WebPage",
    name: `AKUEB ${s.name} Past Papers`,
    description: s.desc,
  })),
};

export default function PastPapersPage() {
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
            AKUEB Board Papers
          </span>
          <h1 className="landing-display mt-6 text-2xl text-foreground sm:text-4xl md:text-5xl">
            Practice real AKUEB past papers
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            Attempt genuine board papers for classes IX–XII across Physics,
            Chemistry, Biology, Mathematics and Computer Science — then get
            instant AI marking and step-by-step feedback.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={FRONTEND_ROUTES.REGISTER}
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground"
            >
              Start practicing free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-10">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SUBJECTS.map((s) => (
              <div
                key={s.name}
                className="rounded-2xl border border-border bg-card/50 p-6"
              >
                <h2 className="text-lg font-bold text-foreground">{s.name}</h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  {s.classes}
                </p>
                <p className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            ))}
            <div className="flex flex-col justify-center rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
              <p className="text-sm font-semibold text-foreground">
                Missing a subject?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Practice papers are published as they become available.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="landing-display text-xl text-foreground sm:text-3xl">
            Why practice past papers?
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              "Real board format and difficulty",
              "Instant AI marking with detailed feedback",
              "Track progress and climb the leaderboard",
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
