"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Medal, Sparkles, Star } from "lucide-react";
import AppLogo from "@/components/AppLogo";
import ElectionLogo from "@/components/elections/ElectionLogo";
import ElectionSymbol from "@/components/elections/ElectionSymbol";
import { usePublicElectionAnalytics } from "@/hooks/elections/usePublicElectionAnalytics";
import { formatVotePercent, getRaceLeaders, groupTalliesByRace } from "@/lib/elections/analytics";
import { ElectionStatus } from "@/types/enums";
import { cn } from "@/lib/utils";
import type { ElectionTally, PublicElection } from "@/types/election";

const FIREWORKS_CSS = `
@keyframes firework-streak {
  0% { transform: rotate(var(--angle)) translateY(0) scale(1); opacity: 1; }
  55% { opacity: 1; }
  100% { transform: rotate(var(--angle)) translateY(calc(var(--dist) * -1)) scale(0.25); opacity: 0; }
}
@keyframes firework-crackle {
  0% { transform: rotate(var(--angle)) translateY(0) scale(1); opacity: 1; }
  70% { opacity: 0.9; }
  100% { transform: rotate(var(--angle)) translateY(calc(var(--dist) * -1)) scale(0.1); opacity: 0; }
}
@keyframes firework-flash {
  0% { transform: scale(0.2); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}
@keyframes winner-pop {
  0% { opacity: 0; transform: translateY(24px) scale(0.92); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes crown-wiggle {
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(8deg); }
}
@keyframes glow-pulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.75; }
}
.firework-burst {
  position: absolute;
  transform: translate(-50%, -50%);
}
.firework-streak {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 4px;
  height: 13px;
  border-radius: 3px;
  margin-left: -2px;
  margin-top: -6.5px;
  background: linear-gradient(to top, transparent 0%, var(--color) 75%);
  box-shadow: 0 0 7px var(--color);
  transform-origin: 50% 100%;
  animation: firework-streak var(--dur) ease-out var(--delay) infinite;
  opacity: 0;
}
.firework-crackle {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 3px;
  height: 3px;
  margin-left: -1.5px;
  margin-top: -1.5px;
  border-radius: 9999px;
  background: #fff7d6;
  box-shadow: 0 0 5px var(--color);
  transform-origin: 50% 100%;
  animation: firework-crackle calc(var(--dur) * 0.55) ease-out var(--delay) infinite;
  opacity: 0;
}
.firework-flash {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 22px;
  height: 22px;
  margin-left: -11px;
  margin-top: -11px;
  border-radius: 9999px;
  background: radial-gradient(circle, #fff 0%, var(--color) 55%, transparent 75%);
  animation: firework-flash calc(var(--dur) * 0.45) ease-out var(--delay) infinite;
  opacity: 0;
}
`;

function Fireworks({ active }: { active: boolean }) {
  const bursts = useMemo(() => {
    const top = Array.from({ length: 9 }, (_, i) => ({
      top: `${3 + Math.random() * 26}%`,
      left: `${5 + Math.random() * 90}%`,
      delay: `${(i * 0.7 + Math.random() * 0.45).toFixed(2)}s`,
      dur: `${(1.15 + Math.random() * 0.45).toFixed(2)}s`,
    }));
    const sides = Array.from({ length: 6 }, (_, i) => {
      const left = i % 2 === 0 ? 1 + Math.random() * 8 : 91 + Math.random() * 8;
      return {
        top: `${18 + Math.random() * 55}%`,
        left: `${left}%`,
        delay: `${(i * 0.7 + Math.random() * 0.45).toFixed(2)}s`,
        dur: `${(1.15 + Math.random() * 0.45).toFixed(2)}s`,
      };
    });
    return [...top, ...sides];
  }, []);

  const streaks = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const dist = 54 + Math.random() * 46;
        return {
          angle: `${Math.round(angle * 180 / Math.PI)}deg`,
          dist: `${dist.toFixed(1)}px`,
        };
      }),
    [],
  );

  const crackles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.6;
        return {
          angle: `${Math.round(angle * 180 / Math.PI)}deg`,
          dist: `${(34 + Math.random() * 30).toFixed(1)}px`,
        };
      }),
    [],
  );

  const colors = ["#fde047", "#fbbf24", "#f87171", "#67e8f9", "#c4b5fd", "#f0abfc"];

  if (!active) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {bursts.map((burst, i) => (
        <div
          key={i}
          className="firework-burst"
          style={{ top: burst.top, left: burst.left }}
        >
          <span
            className="firework-flash"
            style={
              {
                "--color": colors[i % colors.length],
                "--dur": burst.dur,
                "--delay": burst.delay,
              } as CSSProperties
            }
          />
          {streaks.map((s, j) => (
            <span
              key={`s${j}`}
              className="firework-streak"
              style={
                {
                  "--angle": s.angle,
                  "--dist": s.dist,
                  "--color": colors[(i + j) % colors.length],
                  "--dur": burst.dur,
                  "--delay": burst.delay,
                } as CSSProperties
              }
            />
          ))}
          {crackles.map((c, j) => (
            <span
              key={`c${j}`}
              className="firework-crackle"
              style={
                {
                  "--angle": c.angle,
                  "--dist": c.dist,
                  "--color": colors[(i + j) % colors.length],
                  "--dur": burst.dur,
                  "--delay": burst.delay,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function DuotoneCrown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn("drop-shadow-[0_2px_8px_rgba(251,191,36,0.6)]", className)}>
      <defs>
        <linearGradient id="winnerCrownGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="50%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path
        d="M3.5 8.5 7 11.5l4.5-6h1l4.5 6 3.5-3 0 10.5-17.5 0Z"
        fill="url(#winnerCrownGold)"
        stroke="#b45309"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <rect x="6.2" y="18" width="11.6" height="2.6" rx="1.2" fill="#fde68a" stroke="#b45309" strokeWidth="0.9" />
      <circle cx="7.6" cy="12" r="0.9" fill="#f472b6" />
      <circle cx="12" cy="12.9" r="1.05" fill="#38bdf8" />
      <circle cx="16.4" cy="12" r="0.9" fill="#f472b6" />
    </svg>
  );
}

export default function WinnerCarousel({
  election,
}: {
  election: PublicElection;
}) {
  const query = usePublicElectionAnalytics(election.slug, ElectionStatus.ENDED);
  const [start, setStart] = useState(0);
  const [paused, setPaused] = useState(false);
  const [vw, setVw] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 0,
  );
  const viewportRef = useRef<HTMLDivElement>(null);

  const cards = useMemo(() => {
    if (!query.data) return [];
    const groups = groupTalliesByRace(query.data.tallies);
    const result: WinnerCardData[] = [];
    for (const race of getRaceLeaders(groups)) {
      if (race.leaders.length === 0) continue;
      race.leaders.forEach((leader, leaderIndex) => {
        result.push({
          key: `${race.key}::${leader.candidateId}`,
          leader,
          place: leaderIndex,
          tie: race.isTie,
          multipleLeaders: race.leaders.length > 1,
          categoryLabel: race.label,
        });
      });
    }
    return result;
  }, [query.data]);
  const hasCards = cards.length > 0;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setVw(width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasCards]);

  const columns = vw >= 960 ? 3 : vw >= 620 ? 2 : 1;
  const gap = 20;
  const singlePeek = columns === 1 ? 40 : 0;
  const cardW =
    vw > 0
      ? Math.max(0, (vw - (columns - 1) * gap - singlePeek * 2) / columns)
      : 0;
  const maxStart = Math.max(0, cards.length - columns);

  useEffect(() => {
    setStart((current) => Math.min(current, maxStart));
  }, [maxStart]);

  useEffect(() => {
    setStart(0);
  }, [query.data?.tallies]);

  useEffect(() => {
    if (cards.length <= columns || paused) return;
    const timer = window.setInterval(() => {
      setStart((current) => (current >= maxStart ? 0 : current + 1));
    }, 4200);
    return () => window.clearInterval(timer);
  }, [cards.length, columns, paused, maxStart]);

  const goNext = () =>
    setStart((current) => (current >= maxStart ? 0 : current + 1));
  const goPrev = () =>
    setStart((current) => (current <= 0 ? maxStart : current - 1));

  const canSlide = cards.length > columns;
  const dots = Array.from({ length: maxStart + 1 }, (_, i) => i);

  return (
    <section
      className="relative overflow-hidden bg-primary text-primary-foreground"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-sidebar-from via-primary to-sidebar-to" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--color-primary-foreground) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/4 size-64 rounded-full bg-amber-300/25 blur-3xl"
        style={{ animation: "glow-pulse 4s ease-in-out infinite" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -bottom-24 size-72 rounded-full bg-primary-light/25 blur-3xl"
      />

      <Fireworks active={cards.length > 0} />

      <div className="relative mx-auto max-w-6xl px-4 py-10 text-center">
        {election.logoUrl ? (
          <span className="flex justify-center">
            <ElectionLogo
              src={election.logoUrl}
              alt={election.name}
              size="md"
              className="border border-primary-foreground/20 bg-white shadow-lg"
            />
          </span>
        ) : null}

        <div className="mt-4 flex items-center justify-center gap-3">
          <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
            Winners Announced!
          </h1>
        </div>

        <p className="mt-2 text-sm font-bold text-primary-foreground/90 sm:text-base">
          {election.name}
        </p>
        <p className="mt-0.5 text-[10px] font-semibold text-primary-foreground/70">
          Results certified by the election committee, Congratulations from the{" "}
          <span className="font-black text-white">ExBoardAI</span> team
        </p>

        {cards.length > 0 ? (
          <div className="mt-4 flex items-center justify-center gap-3 sm:gap-4">
            {columns === 1 ? (
              <div className="relative w-full">
                <div
                  ref={viewportRef}
                  className="w-full overflow-hidden"
                >
                  <div
                    className="flex gap-5 transition-transform duration-500 ease-out will-change-transform"
                    style={{ transform: `translateX(${(singlePeek - start * (cardW + gap)).toFixed(2)}px)` }}
                  >
                    {cards.map((card) => (
                      <WinnerCard
                        key={card.key}
                        card={card}
                        style={{ width: cardW, flexShrink: 0 }}
                      />
                    ))}
                  </div>
                </div>
                {canSlide ? (
                  <button
                    type="button"
                    aria-label="Previous winner"
                    onClick={goPrev}
                    className="absolute top-1/2 left-0 z-30 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-primary-foreground/40 bg-primary text-primary-foreground shadow-xl transition hover:bg-primary-light active:scale-95"
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                ) : null}
                {canSlide ? (
                  <button
                    type="button"
                    aria-label="Next winner"
                    onClick={goNext}
                    className="absolute top-1/2 right-0 z-30 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-primary-foreground/40 bg-primary text-primary-foreground shadow-xl transition hover:bg-primary-light active:scale-95"
                  >
                    <ChevronRight className="size-6" />
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                {canSlide ? (
                  <button
                    type="button"
                    aria-label="Previous winner"
                    onClick={goPrev}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground shadow backdrop-blur transition hover:bg-primary-foreground/20"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                ) : null}

                <div
                  ref={viewportRef}
                  className="min-w-0 flex-1 overflow-hidden"
                >
                  <div
                    className="flex gap-5 transition-transform duration-500 ease-out will-change-transform"
                    style={{ transform: `translateX(${(singlePeek - start * (cardW + gap)).toFixed(2)}px)` }}
                  >
                    {cards.map((card) => (
                      <WinnerCard
                        key={card.key}
                        card={card}
                        style={{ width: cardW, flexShrink: 0 }}
                      />
                    ))}
                  </div>
                </div>

                {canSlide ? (
                  <button
                    type="button"
                    aria-label="Next winner"
                    onClick={goNext}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground shadow backdrop-blur transition hover:bg-primary-foreground/20"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                ) : null}
              </>
            )}
          </div>
        ) : (
          <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-6 backdrop-blur-md">
            <Sparkles className="mx-auto size-7 text-yellow-300" />
            <p className="mt-3 text-sm font-bold">Winners are being tallied…</p>
            <p className="mt-1 text-xs text-primary-foreground/70">
              The final results will appear here in a moment.
            </p>
          </div>
        )}

        {canSlide ? (
          <div className="mt-6 flex items-center justify-center gap-2">
            {dots.map((dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                aria-label={`Show winners ${dotIndex + 1} to ${dotIndex + columns}`}
                onClick={() => setStart(dotIndex)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  dotIndex === start
                    ? "w-8 bg-primary-foreground"
                    : "w-2 bg-primary-foreground/30 hover:bg-primary-foreground/60",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      <style dangerouslySetInnerHTML={{ __html: FIREWORKS_CSS }} />
    </section>
  );
}

type WinnerCardData = {
  key: string;
  leader: ElectionTally;
  place: number;
  tie: boolean;
  multipleLeaders: boolean;
  categoryLabel: string;
};

function WinnerCard({
  card,
  style,
}: {
  card: WinnerCardData;
  style?: CSSProperties;
}) {
  const { leader, place, tie, multipleLeaders, categoryLabel } = card;
  return (
    <article
      className="relative rounded-3xl bg-white px-5 pt-5 pb-3 text-center shadow-[0_20px_60px_-18px_rgba(0,0,0,0.55)] ring-1 ring-amber-200/70 sm:px-6 sm:pt-6 sm:pb-4"
      style={{ ...style, animation: "winner-pop 0.55s cubic-bezier(.2,.9,.3,1.2) both" }}
    >
      <div
        className="mx-auto flex size-11 items-center justify-center rounded-full bg-linear-to-br from-amber-200 to-yellow-500 shadow-inner"
        style={{ animation: "crown-wiggle 2.4s ease-in-out infinite" }}
      >
        <DuotoneCrown className="size-7" />
      </div>

      <p className="mt-2 text-[11px] font-black uppercase tracking-[0.3em] text-amber-500">
        Running for
      </p>
      <h4 className="text-md font-black text-slate-700">{categoryLabel}</h4>

      <div className="relative mx-auto mt-4 w-fit">
        <div className="absolute -inset-1.5 rounded-full bg-linear-to-br from-amber-300 via-yellow-400 to-orange-500 opacity-90 blur-[2px]" />
        <img
          src={leader.profileImageUrl}
          alt={leader.candidateName}
          className="relative size-24 rounded-full border-4 border-white bg-muted object-cover sm:size-28"
          loading="lazy"
        />
        <span className="absolute -top-1 -right-3 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-primary-foreground shadow">
          {tie && multipleLeaders ? `Winner ${place + 1}` : "Winner"}
        </span>
      </div>

      <h3 className="mt-3 text-sm font-black leading-tight text-slate-900 sm:text-base">
        {leader.candidateName}
      </h3>

      {leader.symbolUrl ? (
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
            <ElectionSymbol
              symbolUrl={leader.symbolUrl}
              name={leader.symbolName ?? leader.candidateName}
              className="text-xl leading-none"
              imgClassName="size-6 rounded-full bg-white object-contain"
            />
            {leader.symbolName ? (
              <span className="text-xs font-bold text-slate-600">
                {leader.symbolName}
              </span>
            ) : null}
          </span>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-center gap-2">
        {tie ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">
            <Medal className="size-3.5" />
            Tied
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
          <Star className="size-3.5 fill-primary text-primary" />
          {leader.voteCount} vote{leader.voteCount === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
          {formatVotePercent(leader.percentage)}
        </span>
      </div>

      <div className="mt-3 flex flex-col items-center justify-center border-t border-slate-100 pt-2">
        <p className="text-[11px] font-semibold text-slate-500">
          Heartfelt congratulations from
        </p>
        <AppLogo
          variant="light"
          className="mt-0.5 h-6 w-24"
          imageClassName="object-contain object-center"
        />
      </div>
    </article>
  );
}