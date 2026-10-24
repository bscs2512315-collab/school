"use client";

import Link from "next/link";
import AppLogo from "@/components/AppLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import ElectionCountdown from "@/components/elections/ElectionCountdown";
import ElectionLogo from "@/components/elections/ElectionLogo";
import PublicElectionAnalytics from "@/components/elections/PublicElectionAnalytics";
import PublicElectionBallot from "@/components/elections/PublicElectionBallot";
import WinnerCarousel from "@/components/elections/WinnerCarousel";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { APP_NAME } from "@/constants";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { formatElectionWindow } from "@/lib/elections/format";
import { ElectionStatus } from "@/types/enums";
import { cn } from "@/lib/utils";
import type { PublicElection } from "@/types/election";

export default function PublicElectionView({
  election,
}: {
  election: PublicElection;
}) {
  const isLive = election.status === ElectionStatus.LIVE;
  const isEnded = election.status === ElectionStatus.ENDED;
  const approved = Boolean(election.resultsApprovedAt);
  const showLiveResults = election.showLiveResults ?? true;
  const canShowResults = showLiveResults ? true : approved;

  let statusLabel = "Election closed";
  if (isEnded && !approved) {
    statusLabel = "Waiting for final approval";
  } else if (isEnded && approved) {
    statusLabel = "Results are approved";
  } else if (election.status === ElectionStatus.LIVE) {
    statusLabel = "Election Active";
  } else if (election.status === ElectionStatus.UPCOMING) {
    statusLabel = "Opens soon";
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6">
          <Link
            href={FRONTEND_ROUTES.HOME}
            className="justify-self-start"
            aria-label={`Go to ${APP_NAME} home`}
          >
            <AppLogo className="h-13 w-52 sm:h-14 sm:w-64" priority />
          </Link>

          <span
            className={cn(
              "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-widest",
              {
                "border-primary/20 bg-primary/10 text-primary": isLive,
                "border-amber-400/30 bg-amber-400/10 text-amber-600 dark:text-amber-400":
                  isEnded && !approved,
                "border-primary/30 bg-primary/10 text-primary":
                  isEnded && approved,
                "border-border bg-muted text-muted-foreground":
                  election.status === ElectionStatus.UPCOMING,
              },
            )}
          >
            {isLive ? (
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-70" />
                <span className="relative size-2 rounded-full bg-primary" />
              </span>
            ) : isEnded && !approved ? (
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-70" />
                <span className="relative size-2 rounded-full bg-amber-400" />
              </span>
            ) : isEnded && approved ? (
              <span className="size-2 rounded-full bg-emerald-500" />
            ) : (
              <span className="size-2 rounded-full bg-muted-foreground/50" />
            )}
            {statusLabel}
          </span>

          <div className="justify-self-end rounded-xl border border-border bg-card/80 shadow-sm backdrop-blur-md">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {election.status === ElectionStatus.ENDED && approved ? (
        <WinnerCarousel election={election} />
      ) : (
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-sidebar-from via-primary to-sidebar-to" />
          <div className="pointer-events-none absolute -top-16 left-1/4 size-56 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 -bottom-20 size-64 rounded-full bg-primary-light/20 blur-3xl" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, var(--color-primary-foreground) 1px, transparent 0)",
              backgroundSize: "18px 18px",
            }}
          />

          <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 sm:py-16">
            {election.logoUrl ? (
              <ElectionLogo
                src={election.logoUrl}
                alt={election.name}
                size="lg"
                className="border border-primary-foreground/20 shadow-lg"
              />
            ) : null}
            <div className="mt-6 space-y-3">
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                {election.name}
              </h1>
              <p className="text-sm font-medium text-primary-foreground/75">
                {formatElectionWindow(election.startsAt, election.endsAt)}
              </p>
            </div>
            {election.status !== ElectionStatus.ENDED ? (
              <div className="mt-8">
                <ElectionCountdown
                  startsAt={election.startsAt}
                  endsAt={election.endsAt}
                  status={election.status}
                  tone="onPrimary"
                />
              </div>
            ) : null}
          </div>
        </section>
      )}

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {election.status === ElectionStatus.ENDED && canShowResults ? (
          <div className="mb-10">
            <PublicElectionAnalytics
              slug={election.slug}
              status={election.status}
            />
          </div>
        ) : null}

        {election.status !== ElectionStatus.ENDED ? (
          <>
            <PublicElectionBallot election={election} />
            {canShowResults ? (
              <div className="mt-10">
                <PublicElectionAnalytics
                  slug={election.slug}
                  status={election.status}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </main>
      <CTA novaMessage={null} />
      <Footer />
    </div>
  );
}
