import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { SITE } from "@/lib/site";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { LIVE_SUBJECTS } from "@/constants";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export const metadata: Metadata = {
  title: "AKUEB Curriculum — Class IX–XII Chapters & Learning Outcomes",
  description:
    "Explore the AKUEB curriculum for Physics, Chemistry, Biology, Mathematics and Computer Science — organised by class and chapter with clear learning outcomes and SLOs.",
  alternates: { canonical: "/curriculum" },
  openGraph: {
    title: "AKUEB Curriculum — Class IX–XII Chapters & Learning Outcomes",
    description:
      "The AKUEB curriculum organised by class and chapter with clear learning outcomes for classes IX–XII.",
    url: `${SITE.url}/curriculum`,
    type: "website",
  },
};

const CLASSES = ["IX", "X", "XI", "XII"] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "AKUEB Curriculum",
  description:
    "The AKUEB curriculum organised by class and chapter with defined learning outcomes.",
  url: `${SITE.url}/curriculum`,
  publisher: {
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
  },
};

export default function CurriculumPage() {
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
            AKUEB Curriculum
          </span>
          <h1 className="landing-display mt-6 text-2xl text-foreground sm:text-4xl md:text-5xl">
            The AKUEB curriculum, made navigable
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            Browse the full curriculum for Physics, Chemistry, Biology,
            Mathematics and Computer Science — organised by class and chapter,
            with clear learning outcomes so you always know what to study next.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={FRONTEND_ROUTES.REGISTER}
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground"
            >
              Explore the curriculum free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-10">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {LIVE_SUBJECTS.map((subject) => (
              <div
                key={subject}
                className="rounded-2xl border border-border bg-card/50 p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="size-6" />
                </span>
                <h2 className="mt-4 text-lg font-bold text-foreground">
                  {subject}
                </h2>
                <p className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground">
                  Full chapter-by-chapter curriculum for {subject} with learning
                  outcomes for every class level.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="landing-display text-xl text-foreground sm:text-3xl">
            Available for every class
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CLASSES.map((cls) => (
              <div
                key={cls}
                className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/50 py-8 text-3xl font-black text-primary"
              >
                {cls}
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              "Organised by class, chapter and topic",
              "Clear learning outcomes for every chapter",
              "Track what you have covered and revised",
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
