import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  HelpCircle,
  Share2,
} from "lucide-react";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import ZapSVG from "@/public/svgs/ZapSVG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import LeaderboardSVG from "@/public/svgs/LeaderboardSVG";
import NovaSVG from "@/public/svgs/NovaSVG";
import GenerateSVG from "@/public/svgs/GenerateSVG";
import PracticalJournalSVG from "@/public/svgs/PracticalJournalSVG";
import QuestionBankSVG from "@/public/svgs/QuestionBankSVG";
import P1SVG from "@/public/svgs/P1SVG";
import LockSVG from "@/public/svgs/LockSVG";
import UserSVG from "@/public/svgs/UserSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import CalendarSVG from "@/public/svgs/CalendarSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import LightbulbSVG from "@/public/svgs/LightbulbSVG";
import AlertCircleSVG from "@/public/svgs/AlertCircleSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import ArrowLeftSVG from "@/public/svgs/ArrowLeftSVG";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { SITE } from "@/lib/site";
import { GUIDES, getGuideBySlug } from "@/lib/guides/guide-data";
import { FRONTEND_ROUTES } from "@/constants/endpoints";

const GUIDE_SLUG_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "how-to-sign-up": UserSVG,
  "what-is-play-and-prep": GenerateSVG,
  "how-to-solve-past-papers": P1SVG,
  "asking-nova-ai-tutor": NovaSVG,
  "practical-journals-guide": PracticalJournalSVG,
  "classrooms-and-teacher-tools": ClassroomSVG,
  "leaderboards-and-rewards": LeaderboardSVG,
  "papers-bank-guide": QuestionBankSVG,
  "how-to-reset-password": LockSVG,
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Getting Started": ZapSVG,
  "Exam Prep": BookOpenSVG,
  "AI & Features": NovaSVG,
  "Teachers & Schools": ClassroomSVG,
  Gamification: LeaderboardSVG,
};

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return {
      title: "Guide Not Found",
    };
  }

  const title = `${guide.title} — ExBoard AI User Guide`;
  const description = guide.description;
  const url = `${SITE.url}/guide/${guide.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/guide/${guide.slug}`,
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: [
        {
          url: `${SITE.url}/og.png`,
          width: 1200,
          height: 630,
          alt: guide.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE.url}/og.png`],
    },
  };
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const relatedGuides = guide.relatedSlugs
    .map((s) => getGuideBySlug(s))
    .filter(Boolean);

  const guideIndex = GUIDES.findIndex((g) => g.slug === guide.slug);
  const prevGuide = guideIndex > 0 ? GUIDES[guideIndex - 1] : null;
  const nextGuide = guideIndex < GUIDES.length - 1 ? GUIDES[guideIndex + 1] : null;

  // JSON-LD Schemas for HowTo, Breadcrumb, and Article
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: guide.title,
    description: guide.description,
    totalTime: "PT3M",
    step: guide.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: step.description,
      url: `${SITE.url}/guide/${guide.slug}#step-${index + 1}`,
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: `${SITE.url}/guide`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.title,
        item: `${SITE.url}/guide/${guide.slug}`,
      },
    ],
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: guide.title,
    description: guide.description,
    author: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: {
        "@type": "ImageObject",
        url: `${SITE.url}/icons/icon-512.png`,
      },
    },
    mainEntityOfPage: `${SITE.url}/guide/${guide.slug}`,
    inLanguage: "en-PK",
  };

  return (
    <MarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="px-4 pt-28 pb-20 sm:px-6 md:pt-36">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumbs */}
          <nav className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="size-3.5" />
            <Link href="/guide" className="hover:text-foreground transition-colors">
              Guides
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="text-primary dark:text-logo-green font-bold truncate">
              {guide.shortTitle}
            </span>
          </nav>

          {/* Guide Header */}
          <header className="rounded-3xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-10 shadow-sm">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
              <span className="rounded-full bg-primary/15 px-3 py-1 text-primary dark:text-logo-green font-extrabold uppercase tracking-wide">
                {guide.category}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <ClockSVG className="size-3.5" /> {guide.readTime}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarSVG className="size-3.5" /> Updated {guide.lastUpdated}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl leading-[1.1]">
              {guide.title}
            </h1>

            <p className="mt-4 text-sm font-medium leading-relaxed text-muted-foreground sm:text-base md:text-lg">
              {guide.description}
            </p>

            {/* Quick Hero Banner */}
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-3.5 sm:p-4 text-xs font-bold text-primary dark:text-logo-green">
              <SparklesSVG className="size-5 shrink-0" />
              <span>{guide.heroHighlight}</span>
            </div>
          </header>

          {/* Table of Contents Pill Bar */}
          <div className="mt-8 rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Guide Steps Overview
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {guide.steps.map((step, idx) => (
                <a
                  key={step.title}
                  href={`#step-${idx + 1}`}
                  className="flex items-center gap-2 rounded-xl p-2 text-xs font-bold text-foreground transition-colors hover:bg-card hover:text-primary"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/15 text-[10px] font-black text-primary dark:text-logo-green">
                    {idx + 1}
                  </span>
                  <span className="truncate">{step.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Step-by-Step Walkthrough */}
          <div className="mt-12 space-y-10">
            {guide.steps.map((step, idx) => (
              <section
                key={step.title}
                id={`step-${idx + 1}`}
                className="scroll-mt-28 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs"
              >
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <span className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-xs sm:text-sm font-black text-primary-foreground shadow-sm">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-black tracking-tight text-foreground sm:text-xl md:text-2xl">
                      {step.title}
                    </h2>
                    {step.subtitle && (
                      <p className="mt-0.5 text-xs font-bold text-primary dark:text-logo-green">
                        {step.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pl-0 sm:pl-12.5 text-xs sm:text-sm leading-relaxed text-muted-foreground font-medium space-y-3">
                  <p>{step.description}</p>

                  {step.details && step.details.length > 0 && (
                    <ul className="mt-3 space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-4">
                      {step.details.map((detail, dIdx) => (
                        <li key={dIdx} className="flex items-start gap-2">
                          <CheckCircleSVG className="size-4 text-primary dark:text-logo-green shrink-0 mt-0.5" />
                          <span className="text-foreground">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {step.tips && step.tips.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {step.tips.map((tip, tIdx) => (
                        <div
                          key={tIdx}
                          className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-950 dark:text-amber-200"
                        >
                          <LightbulbSVG className="size-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <span className="text-xs font-semibold leading-relaxed">
                            <strong>Pro Tip:</strong> {tip}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {step.callout && (
                    <div
                      className={`mt-3 flex items-start gap-2.5 rounded-2xl p-3.5 ${step.callout.type === "important"
                          ? "border border-destructive/30 bg-destructive/10 text-destructive dark:text-rose-200"
                          : "border border-primary/30 bg-primary/10 text-primary dark:text-emerald-200"
                        }`}
                    >
                      {step.callout.type === "important" ? (
                        <AlertCircleSVG className="size-4.5 shrink-0 mt-0.5" />
                      ) : (
                        <SparklesSVG className="size-4.5 shrink-0 mt-0.5" />
                      )}
                      <span className="text-xs font-semibold leading-relaxed">
                        {step.callout.text}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>

          {/* Guide FAQs */}
          {guide.faqs && guide.faqs.length > 0 && (
            <section className="mt-14 rounded-3xl border border-border/80 bg-muted/20 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-5">
                <h3 className="text-lg font-black text-foreground sm:text-xl">
                  Frequently Asked Questions
                </h3>
              </div>
              <div className="space-y-3">
                {guide.faqs.map((faq) => (
                  <div
                    key={faq.question}
                    className="rounded-2xl border border-border bg-card p-4 sm:p-5"
                  >
                    <h4 className="text-sm font-bold text-foreground sm:text-base">
                      {faq.question}
                    </h4>
                    <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Next / Previous Navigation */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {prevGuide ? (
              <Link
                href={`/guide/${prevGuide.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/50"
              >
                <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground uppercase">
                  <ArrowLeftSVG className="size-3 transition-transform group-hover:-translate-x-1" /> Previous Guide
                </span>
                <span className="mt-2 text-sm font-black text-foreground group-hover:text-primary line-clamp-1">
                  {prevGuide.title}
                </span>
              </Link>
            ) : <div />}

            {nextGuide ? (
              <Link
                href={`/guide/${nextGuide.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 text-right transition-all hover:border-primary/50 sm:items-end"
              >
                <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground uppercase justify-end">
                  Next Guide <ArrowRightSVG className="size-3 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="mt-2 text-sm font-black text-foreground group-hover:text-primary line-clamp-1">
                  {nextGuide.title}
                </span>
              </Link>
            ) : <div />}
          </div>

          {/* CTA Banner */}
          <div className="mt-12 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary via-primary to-emerald-950 p-6 sm:p-8 text-white shadow-xl text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6">
            <div>
              <h3 className="text-xl font-black sm:text-2xl">
                Ready to try this on ExBoard AI?
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-white/85 max-w-lg">
                Sign up free in 60 seconds and start practicing with instant AI feedback and real past papers.
              </p>
            </div>
            <Link
              href={FRONTEND_ROUTES.REGISTER}
              className="mt-4 inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-xs font-black uppercase tracking-wider text-emerald-950 shadow-md transition-transform hover:-translate-y-0.5 active:scale-95 sm:mt-0 whitespace-nowrap"
            >
              Get Started Free 🚀
            </Link>
          </div>

          {/* Related Guides */}
          {relatedGuides.length > 0 && (
            <section className="mt-16 border-t border-border/60 pt-10">
              <h3 className="text-lg font-black text-foreground sm:text-xl mb-5">
                Related User Guides
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedGuides.map((rel) => {
                  if (!rel) return null;
                  const RelIcon = GUIDE_SLUG_ICONS[rel.slug] || CATEGORY_ICONS[rel.category] || BookOpenSVG;
                  return (
                    <Link
                      key={rel.slug}
                      href={`/guide/${rel.slug}`}
                      className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4.5 transition-all hover:border-primary/50 hover:shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-primary dark:text-logo-green">
                            {rel.category}
                          </span>
                          <RelIcon className="size-4.5 text-primary dark:text-logo-green" />
                        </div>
                        <h4 className="mt-1.5 text-sm font-bold text-foreground group-hover:text-primary line-clamp-2">
                          {rel.title}
                        </h4>
                      </div>
                      <span className="mt-4 flex items-center gap-1.5 text-xs font-bold text-primary dark:text-logo-green">
                        Read Guide <ArrowRightSVG className="size-3 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </article>
    </MarketingLayout>
  );
}
