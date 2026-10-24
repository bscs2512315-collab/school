"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
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
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import SearchSVG from "@/public/svgs/SearchSVG";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { SITE } from "@/lib/site";
import { GUIDES, GUIDE_CATEGORIES } from "@/lib/guides/guide-data";

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

export default function GuideHubPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All Guides");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredGuides = useMemo(() => {
    return GUIDES.filter((guide) => {
      const matchesCategory =
        selectedCategory === "All Guides" || guide.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "ExBoard AI User Guides & Tutorials",
    description:
      "Step-by-step tutorials and guides on how to use ExBoard AI for AKUEB and Sindh Board exam preparation, Play & Prep, Nova AI tutor, and digital classrooms.",
    url: `${SITE.url}/guide`,
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    hasPart: GUIDES.map((g) => ({
      "@type": "Article",
      headline: g.title,
      description: g.description,
      url: `${SITE.url}/guide/${g.slug}`,
    })),
  };

  return (
    <MarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden px-4 pt-28 pb-12 md:pt-36 md:pb-16 bg-gradient-to-b from-muted/30 via-background to-background">
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-primary dark:text-logo-green">
            <BookOpenSVG className="size-4" /> User Guides &amp; Knowledge Base
          </span>
          <h1 className="mt-6 text-3xl font-black leading-[1.08] tracking-[-0.04em] text-foreground sm:text-5xl md:text-6xl">
            Master Every Feature of <br />
            <span className="text-primary dark:text-logo-green">ExBoard AI.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            Step-by-step guides for students, teachers, and schools. Learn how to create accounts, generate smart exam papers, battle friends, and ace board examinations.
          </p>

          {/* Search Box */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="relative flex items-center">
              <SearchSVG className="absolute left-4 size-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides (e.g. Sign up, Play & Prep, Nova AI, Classrooms)..."
                className="h-13 w-full rounded-2xl border border-border/80 bg-card pl-12 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 rounded-lg px-2 py-1 text-xs font-bold text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {GUIDE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start Top 3 Featured Section */}
      {selectedCategory === "All Guides" && !searchQuery && (
        <section className="px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground sm:text-2xl">
                  🚀 Essential Quick-Start Guides
                </h2>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Recommended for new students and educators
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {GUIDES.slice(0, 3).map((guide, idx) => {
                const IconComponent = GUIDE_SLUG_ICONS[guide.slug] || CATEGORY_ICONS[guide.category] || BookOpenSVG;
                return (
                  <Link
                    key={guide.slug}
                    href={`/guide/${guide.slug}`}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-xl hover:shadow-primary/10"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary dark:text-logo-green">
                          <IconComponent className="size-6" />
                        </span>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary dark:text-logo-green">
                          Guide 0{idx + 1}
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-black tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-xl">
                        {guide.title}
                      </h3>
                      <p className="mt-2 text-xs font-medium leading-relaxed text-muted-foreground line-clamp-3 sm:text-sm">
                        {guide.description}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs font-bold text-primary dark:text-logo-green">
                      <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                        <ClockSVG className="size-3.5" /> {guide.readTime}
                      </span>
                      <span className="flex items-center gap-1.5 transition-transform group-hover:translate-x-1">
                        Read Guide <ArrowRightSVG className="size-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Main Guides Grid */}
      <section className="px-4 py-10 sm:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h2 className="text-xl font-black text-foreground sm:text-2xl">
              {searchQuery
                ? `Search Results for "${searchQuery}" (${filteredGuides.length})`
                : `${selectedCategory} (${filteredGuides.length})`}
            </h2>
          </div>

          {filteredGuides.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center space-y-3">
              <HelpCircle className="mx-auto size-12 text-muted-foreground opacity-50" />
              <h3 className="text-base font-bold text-foreground">No guides found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try searching for different keywords like &quot;Sign Up&quot;, &quot;Play &amp; Prep&quot;, &quot;Nova&quot;, or &quot;Teacher&quot;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All Guides");
                  setSearchQuery("");
                }}
                className="mt-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground cursor-pointer"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGuides.map((guide) => {
                const IconComponent = GUIDE_SLUG_ICONS[guide.slug] || CATEGORY_ICONS[guide.category] || BookOpenSVG;
                return (
                  <Link
                    key={guide.slug}
                    href={`/guide/${guide.slug}`}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card p-5.5 sm:p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <IconComponent className="size-5.5" />
                        </span>
                        <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {guide.badge}
                        </span>
                      </div>

                      <div className="mt-4">
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-primary dark:text-logo-green">
                          {guide.category}
                        </span>
                        <h3 className="mt-1 text-base font-black tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-lg">
                          {guide.title}
                        </h3>
                        <p className="mt-2 text-xs font-medium leading-relaxed text-muted-foreground line-clamp-3">
                          {guide.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-3.5 text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                        <ClockSVG className="size-3.5" /> {guide.readTime}
                      </span>
                      <span className="flex items-center gap-1.5 text-primary dark:text-logo-green group-hover:translate-x-1 transition-transform">
                        Explore <ArrowRightSVG className="size-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Need More Assistance Banner */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-emerald-950/10 p-6 sm:p-10 text-center shadow-lg">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md mb-4">
            <SparklesSVG className="size-6" />
          </span>
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">
            Have a question not covered in our guides?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm font-medium text-muted-foreground">
            Our student academic support team and AI experts are always ready to help you with boards, syllabus SLOs, or technical queries.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:support@exboardai.tech"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-xs font-black text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5 active:scale-95 sm:text-sm"
            >
              Contact Support
            </a>
            <Link
              href="/#faq"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-3 text-xs font-bold text-foreground transition-colors hover:bg-muted sm:text-sm"
            >
              View FAQs
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
