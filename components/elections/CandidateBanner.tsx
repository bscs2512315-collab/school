import { APP_NAME } from "@/constants";
import { cn } from "@/lib/utils";
import { Gender } from "@/types/enums";
import AppLogo from "@/components/AppLogo";
import ElectionLogo from "@/components/elections/ElectionLogo";
import ElectionSymbol from "@/components/elections/ElectionSymbol";

export interface CandidateBannerCandidate {
  name: string;
  profileImageUrl: string;
  symbolUrl: string | null;
  symbolName: string | null;
  classLevel: string;
  category: string | null;
  gender: Gender | null;
}

export interface CandidateBannerElection {
  name: string;
  logoUrl: string | null;
  slug: string;
}

export default function CandidateBanner({
  election,
  candidate,
  className,
}: {
  election: CandidateBannerElection;
  candidate: CandidateBannerCandidate;
  className?: string;
}) {
  const categoryLine =
    candidate.category +
    (candidate.gender === "male" || candidate.gender === "female"
      ? ` (${candidate.gender === "male" ? "Male" : "Female"})`
      : "");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card shadow-2xl",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-sidebar-from via-primary to-sidebar-to opacity-[0.05]" />
      <div className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-12 size-64 rounded-full bg-primary-light/30 blur-3xl" />

      {/* Campaign hero header */}
      <div className="relative z-10 border-b border-border/40 bg-primary px-6 pt-7 pb-12 text-center text-primary-foreground">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-sidebar-from via-primary to-sidebar-to" />
        <div className="pointer-events-none absolute -top-12 -left-10 size-44 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 -bottom-16 size-44 rounded-full bg-primary-light/25 blur-3xl" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--color-primary-foreground) 1px, transparent 0)",
            backgroundSize: "16px 16px",
          }}
        />

        <div className="relative z-10 mx-auto flex items-center justify-center gap-4">
          <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg">
            <AppLogo
              variant="light"
              className="h-full w-full"
              imageClassName="object-contain object-center"
            />
          </div>
          {election.logoUrl ? (
            <ElectionLogo
              src={election.logoUrl}
              alt={election.name}
              size="md"
              className="shrink-0 border-2 border-primary-foreground/25 bg-white shadow-lg"
            />
          ) : null}
        </div>

        <div className="relative z-10 mt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary-foreground/80">
            Election Campaign
          </p>
          <h2 className="mt-1 text-xl font-black leading-snug tracking-tight break-words">
            {election.name}
          </h2>
          <p className="mt-2 text-xs font-semibold text-primary-foreground/75">
            Cast your vote. Make your voice count.
          </p>
        </div>
      </div>

      {/* Candidate body */}
      <div className="relative z-10 px-6 pb-8 sm:px-10 sm:pb-10">
        <div className="-mt-10 mx-auto w-full max-w-[320px]">
          <div
            className="relative overflow-hidden rounded-[1.75rem] border-4 border-background shadow-2xl ring-1 ring-primary/20"
            style={{ aspectRatio: "4 / 5" }}
          >
            <img
              src={candidate.profileImageUrl}
              alt={candidate.name}
              className="size-full object-cover"
              crossOrigin="anonymous"
            />
            {candidate.symbolUrl ? (
              <div className="absolute right-3 bottom-3 flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
                <ElectionSymbol
                  symbolUrl={candidate.symbolUrl}
                  name={candidate.symbolName ?? "symbol"}
                  className="text-3xl"
                  imgClassName="size-full p-1 object-contain"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-primary">
            {candidate.symbolName
              ? `Vote for ${candidate.symbolName}`
              : "Vote for"}
          </p>
          <h3 className="mt-1.5 text-3xl font-black leading-tight tracking-tight break-words sm:text-4xl">
            {candidate.name}
          </h3>
          {categoryLine ? (
            <p className="mt-1.5 break-words text-lg font-bold text-muted-foreground">
              {categoryLine}
            </p>
          ) : null}
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-center">
          <p className="text-lg font-black tracking-tight text-primary">
            Your Vote Matters
          </p>
          <p className="mt-0.5 text-sm font-semibold break-words text-muted-foreground">
            Elect the leader who will make a difference.
          </p>
        </div>
      </div>

      {/* Branding footer */}
      <div className="relative z-10 flex items-center justify-between gap-3 border-t border-border/50 px-6 py-4">
        <p className="min-w-0 text-[11px] font-semibold break-words text-muted-foreground">
          Powered by {APP_NAME}
        </p>
        <span className="shrink-0 text-[11px] font-black tracking-wide text-muted-foreground">
          www.exboardai.tech
        </span>
      </div>
    </div>
  );
}