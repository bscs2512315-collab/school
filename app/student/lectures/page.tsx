"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Clapperboard,
  ArrowLeft,
  BookOpen,
  FlaskConical,
  FileQuestion,
  Layers,
  CheckCircle2,
} from "lucide-react";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";

export default function StudentLecturesPage() {
  const router = useRouter();

  return (
    <PageContainer>
      <div className="space-y-6 animate-in fade-in duration-300">
        <PageHeader
          title="Video Lectures"
          showLine={true}
          actions={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-primary"></span>
              </span>
              <span>Coming Soon</span>
            </span>
          }
        />

        {/* Empty Coming Soon Hero */}
        <div className="relative mx-auto flex min-h-[65vh] max-w-4xl flex-col items-center justify-center overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-8 text-center shadow-sm backdrop-blur-sm sm:p-12">
          {/* Subtle Ambient Background Glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-1/4 -z-10 h-64 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

          {/* Glowing Animated Icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl animate-pulse" />
            <div className="relative flex size-20 items-center justify-center rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-inner">
              <Clapperboard className="size-10 stroke-[1.8]" />
            </div>
          </div>

          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/60 px-3.5 py-1 text-xs font-semibold text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            <span>Interactive Video Pipeline In Production</span>
          </div>

          {/* Main Title & Subtitle */}
          <h1 className="max-w-2xl text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Video Lectures & Animated SLO Breakdowns
          </h1>
          <p className="mt-3 max-w-xl text-xs font-medium leading-relaxed text-muted-foreground sm:text-sm">
            We are curating high-yield video lessons, animated concept breakdowns, and step-by-step board exam past paper solutions for your syllabus.
          </p>

          {/* Preview Features Grid */}
          <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2 text-left">
            <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/30">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Layers className="size-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-foreground">SLO-Aligned Modules</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Targeted videos mapped directly to specific Student Learning Outcomes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/30">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileQuestion className="size-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-foreground">Board Exam Solutions</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Video breakdowns of repeated 4-mark and 8-mark descriptive questions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/30">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-foreground">Dual Subtitles & Notes</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Synchronized English and Urdu captions with key date timelines.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/30">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 className="size-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-foreground">In-Video Checkpoints</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Quick micro-quizzes embedded inside video scenes to test recall.
                </p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/student/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:bg-primary/90"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Dashboard</span>
            </Link>

            <Link
              href="/student/past-papers-1"
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2.5 text-xs font-bold text-foreground shadow-2xs transition-all hover:bg-muted"
            >
              <BookOpen className="size-4 text-primary" />
              <span>Practice Past Papers</span>
            </Link>

            <Link
              href="/student/lab-game"
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2.5 text-xs font-bold text-foreground shadow-2xs transition-all hover:bg-muted"
            >
              <FlaskConical className="size-4 text-primary" />
              <span>Explore Virtual Labs</span>
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
