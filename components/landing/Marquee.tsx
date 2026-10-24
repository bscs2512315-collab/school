"use client";

const ITEMS = [
  "Past Papers I & II",
  "Nova AI Tutor",
  "AI Marking",
  "Leaderboards",
  "1v1 Challenges",
  "Generate Papers",
  "Simulated Labs",
  "Certificates",
  "Classrooms",
] as const;

export function Marquee() {
  const row = [...ITEMS, ...ITEMS];

  return (
    <div
      className="group relative overflow-hidden border-y border-primary/20 bg-primary py-4 select-none"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      <div className="landing-marquee flex w-max gap-10 group-hover:[animation-play-state:paused]">
        {row.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex items-center whitespace-nowrap text-sm font-black uppercase tracking-[0.18em] text-primary-foreground/90 transition-transform duration-200 hover:scale-105"
          >
            {item}
            <span className="ml-10 text-amber-300 inline-block transition-transform duration-300 hover:rotate-45 hover:scale-125">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
