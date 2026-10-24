import GenerateSVG from "@/public/svgs/GenerateSVG";
import ChallengeSVG from "@/public/svgs/ChallengeSVG";
import { cn } from "@/lib/utils";
import TrophySVG from "@/public/svgs/TrophySVG";

function StickerShell({
  className,
  rotate,
  children,
}: {
  className?: string;
  rotate: number;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("pointer-events-none absolute z-0", className)}>
      <div className="sticker-card rounded-2xl" style={{ transform: `rotate(${rotate}deg)` }}>
        {children}
      </div>
    </div>
  );
}

function ScoreSticker() {
  return (
    <div className="w-36 rounded-xl bg-primary p-3">
      <p className="mb-1.5 text-xs font-black tracking-wide text-primary-foreground">
        Score
      </p>
      <svg viewBox="0 0 120 44" className="w-full">
        <path
          d="M4 38 C 24 38, 30 12, 56 14 S 96 30, 116 8"
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="stroke-primary-foreground"
        />
        <circle cx="56" cy="14" r="4" className="fill-background" />
        <circle cx="116" cy="8" r="4" className="fill-background" />
      </svg>
    </div>
  );
}

function PaperSticker() {
  return (
    <div className="w-40 rounded-xl bg-primary p-3">
      <p className="mb-2 text-xs font-black tracking-wide text-primary-foreground">Paper II</p>
      <div className="flex gap-1">
        <span className="rounded-full bg-primary-foreground px-2 py-1 text-xs font-bold whitespace-nowrap text-primary">
          Graded
        </span>
        <span className="rounded-full border-2 border-primary-foreground px-2 py-1 text-xs font-bold whitespace-nowrap text-primary-foreground">
          86%
        </span>
      </div>
    </div>
  );
}

function RankSticker() {
  return (
    <div className="w-36 rounded-xl bg-primary p-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <TrophySVG className="size-3.5 text-primary-foreground" />
        <p className="text-xs font-black tracking-wide text-primary-foreground">Rank #12</p>
      </div>
      <span className="rounded-md bg-primary-foreground px-2 py-0.5 text-xs font-bold text-primary">
        City
      </span>
    </div>
  );
}

function NovaSticker() {
  return (
    <div className="rounded-xl bg-primary px-3 py-2.5">
      <span className="text-xs font-black whitespace-nowrap text-primary-foreground">
        Nova is live
      </span>
    </div>
  );
}

function GenerateSticker() {
  return (
    <div className="w-40 rounded-xl bg-primary p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <GenerateSVG className="size-3.5 text-primary-foreground" />
        <p className="text-xs font-black tracking-wide text-primary-foreground">
          Generate
        </p>
      </div>
      <div className="flex h-9 items-end gap-1.5">
        <span className="h-1/3 w-4 rounded-sm bg-primary-foreground/40" />
        <span className="h-2/3 w-4 rounded-sm bg-primary-foreground/70" />
        <span className="h-1/2 w-4 rounded-sm bg-primary-foreground/50" />
        <span className="h-full w-4 rounded-sm bg-primary-foreground" />
        <span className="h-3/4 w-4 rounded-sm bg-primary-foreground/80" />
      </div>
    </div>
  );
}

function ChallengeSticker() {
  return (
    <div className="w-40 rounded-xl bg-primary p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <ChallengeSVG className="size-3.5 text-primary-foreground" />
        <p className="text-xs font-black tracking-wide text-primary-foreground">
          Challenge
        </p>
      </div>
      <div className="flex gap-1">
        <span className="rounded-full bg-primary-foreground px-2 py-1 text-xs font-bold whitespace-nowrap text-primary">
          1v1
        </span>
        <span className="rounded-full border-2 border-primary-foreground px-2 py-1 text-xs font-bold whitespace-nowrap text-primary-foreground">
          Live
        </span>
      </div>
    </div>
  );
}

export function HeroStickers() {
  return (
    <div className="relative h-full">
      <StickerShell className="top-8 left-4 hidden lg:block" rotate={-8}>
        <ScoreSticker />
      </StickerShell>
      <StickerShell className="top-56 left-8 hidden xl:block" rotate={5}>
        <PaperSticker />
      </StickerShell>
      <StickerShell className="top-96 left-0 hidden xl:block" rotate={-6}>
        <GenerateSticker />
      </StickerShell>
      <StickerShell className="top-8 right-4 hidden lg:block" rotate={7}>
        <RankSticker />
      </StickerShell>
      <StickerShell className="top-56 right-8 hidden xl:block" rotate={-5}>
        <ChallengeSticker />
      </StickerShell>
      <StickerShell className="top-96 right-0 hidden xl:block" rotate={6}>
        <NovaSticker />
      </StickerShell>
    </div>
  );
}
