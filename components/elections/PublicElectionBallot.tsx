"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import VoteStampBadge from "@/components/elections/VoteStampBadge";
import VoterSelfieCapture from "@/components/elections/VoterSelfieCapture";
import ElectionSymbol from "@/components/elections/ElectionSymbol";
import { API_ENDPOINTS } from "@/constants/endpoints";
import { hasVotedOnDevice, markVotedOnDevice } from "@/lib/elections/device-vote";
import { queryKeys } from "@/lib/api/query-keys";
import { getClientErrorMessage } from "@/lib/elections/format";
import {
  groupCandidatesByRace,
  type CandidateRaceGroup,
} from "@/lib/elections/races";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import HashSVG from "@/public/svgs/HashSVG";
import UserSVG from "@/public/svgs/UserSVG";
import { ElectionStatus } from "@/types/enums";
import { cn } from "@/lib/utils";
import type { PublicElection, PublicElectionCandidate } from "@/types/election";

export default function PublicElectionBallot({
  election,
}: {
  election: PublicElection;
}) {
  const queryClient = useQueryClient();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [incompleteOpen, setIncompleteOpen] = useState(false);
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteLockReady, setVoteLockReady] = useState(false);
  const scrollToSuccessRef = useRef(false);

  const races = useMemo(
    () => groupCandidatesByRace(election.candidates, election.categories),
    [election.candidates, election.categories],
  );
  const selectedCandidates = useMemo(
    () =>
      races
        .map((race) => {
          const candidateId = selections[race.key];
          const candidate = race.candidates.find((item) => item.id === candidateId);
          if (!candidate) return null;
          return { race, candidate };
        })
        .filter(
          (
            pick,
          ): pick is {
            race: (typeof races)[number];
            candidate: PublicElectionCandidate;
          } => pick !== null,
        ),
    [races, selections],
  );

  const isLive = election.status === ElectionStatus.LIVE;
  const isUpcoming = election.status === ElectionStatus.UPCOMING;
  const selectedCount = selectedCandidates.length;
  const missingCategories = useMemo(
    () => races.filter((race) => !selections[race.key]).map((race) => race.label),
    [races, selections],
  );
  const canSubmit =
    isLive &&
    !submitting &&
    Boolean(name.trim() && rollNumber.trim() && selfie && selectedCount > 0);

  useEffect(() => {
    setHasVoted(hasVotedOnDevice(election.slug));
    setVoteLockReady(true);
  }, [election.slug]);

  useEffect(() => {
    if (!detailsOpen && !incompleteOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [detailsOpen, incompleteOpen]);

  useEffect(() => {
    if (!hasVoted || !scrollToSuccessRef.current) return;
    scrollToSuccessRef.current = false;
    document.body.style.overflow = "";
    document.getElementById("vote-success")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [hasVoted]);

  const handleVote = async () => {
    setError(null);
    if (!name.trim() || !rollNumber.trim() || !selfie || selectedCount === 0) {
      setError("Name, roll number, a live selfie, and at least one candidate are required.");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("name", name.trim());
      form.set("rollNumber", rollNumber.trim());
      form.set(
        "candidateIds",
        JSON.stringify(selectedCandidates.map((pick) => pick.candidate.id)),
      );
      form.set("selfie", selfie);

      const res = await fetch(`/api${API_ENDPOINTS.ELECTIONS.VOTE(election.slug)}`, {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
      };
      if (!res.ok || !json.success) {
        setError(json.error || json.message || "Could not submit your vote.");
        return;
      }
      markVotedOnDevice(election.slug);
      scrollToSuccessRef.current = true;
      setHasVoted(true);
      setDetailsOpen(false);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.elections.analytics(election.slug),
      });
    } catch (err) {
      setError(getClientErrorMessage(err, "Could not submit your vote."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!voteLockReady) {
    return <div className="mx-auto max-w-lg" aria-hidden />;
  }

  if (hasVoted) {
    return (
      <div id="vote-success" className="mx-auto max-w-lg scroll-mt-6">
        <div className="rounded-3xl border border-border bg-card/80 p-8 text-center shadow-xl backdrop-blur-md">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
            <CheckCircleSVG className="size-8" />
          </div>
          <h2 className="text-3xl font-black tracking-tight">Votes recorded</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Thank you. Your votes have been saved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isUpcoming ? (
        <p className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3 text-center text-sm font-medium">
          Voting has not started yet. Candidates are shown below.
        </p>
      ) : null}

      <CandidatesStep
        races={races}
        selections={selections}
        disabled={isUpcoming}
        selectable={isLive}
        onSelect={(raceKey, candidateId) => {
          if (!isLive) return;
          setSelections((prev) => {
            if (prev[raceKey] === candidateId) {
              const next = { ...prev };
              delete next[raceKey];
              return next;
            }
            return { ...prev, [raceKey]: candidateId };
          });
        }}
      />

      {isLive ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {selectedCount} of {races.length}{" "}
            {races.length === 1 ? "category" : "categories"} selected
          </p>
          <AppButton
            type="button"
            className="h-12 rounded-2xl px-8 font-black"
            disabled={races.length === 0}
            onClick={() => {
              setError(null);
              if (selectedCount < races.length) {
                setIncompleteOpen(true);
                return;
              }
              setDetailsOpen(true);
            }}
          >
            Next
            <ArrowRightSVG className="size-5" />
          </AppButton>
        </div>
      ) : null}

      {incompleteOpen ? (
        <IncompleteBallotModal
          missingCategories={missingCategories}
          onClose={() => setIncompleteOpen(false)}
        />
      ) : null}

      {detailsOpen ? (
        <DetailsModal
          picks={selectedCandidates}
          name={name}
          rollNumber={rollNumber}
          selfiePreview={selfiePreview}
          error={error}
          submitting={submitting}
          canSubmit={canSubmit}
          onNameChange={setName}
          onRollNumberChange={setRollNumber}
          onSelfieCapture={(file) => {
            setSelfiePreview((current) => {
              if (current) URL.revokeObjectURL(current);
              return URL.createObjectURL(file);
            });
            setSelfie(file);
          }}
          onSelfieRetake={() => {
            setSelfie(null);
            setSelfiePreview((current) => {
              if (current) URL.revokeObjectURL(current);
              return null;
            });
          }}
          onClose={() => {
            setError(null);
            setDetailsOpen(false);
          }}
          onSubmit={() => void handleVote()}
        />
      ) : null}
    </div>
  );
}

function CandidatesStep({
  races,
  selections,
  disabled,
  selectable,
  onSelect,
}: {
  races: CandidateRaceGroup<PublicElectionCandidate>[];
  selections: Record<string, string>;
  disabled: boolean;
  selectable: boolean;
  onSelect: (raceKey: string, candidateId: string) => void;
}) {
  return (
    <section className="min-w-0 space-y-6">
      <div>
        <h2 className="text-lg font-black tracking-tight">Vote</h2>
        {selectable ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Please select one candidate from each category.
          </p>
        ) : null}
      </div>

      {races.length === 0 ? (
        <p className="rounded-2xl border border-border/50 bg-card/70 p-6 text-sm text-muted-foreground">
          Candidates have not been added yet.
        </p>
      ) : (
        races.map((race) => (
          <article key={race.key} className="min-w-0 space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-base font-black tracking-tight sm:text-lg">
                    {race.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectable
                      ? "Choose one candidate"
                      : `${race.candidates.length} ${race.candidates.length === 1 ? "candidate" : "candidates"}`}
                  </p>
                </div>
                {selections[race.key] ? (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary dark:bg-muted dark:text-foreground">
                    Selected
                  </span>
                ) : null}
              </div>
              <div
                className={cn(
                  "grid w-full min-w-0 gap-2.5 touch-manipulation",
                  "grid-flow-col auto-cols-[calc((100%-1.25rem)/2.2)] snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                  "sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-3 sm:snap-none sm:overflow-visible sm:pb-0",
                  "md:grid-cols-4 lg:grid-cols-5",
                )}
              >
                {race.candidates.map((candidate) => (
                  <div key={candidate.id} className="h-full min-w-0 snap-start sm:snap-align-none">
                    <CandidateCard
                      candidate={candidate}
                      selected={selections[race.key] === candidate.id}
                      disabled={disabled}
                      onSelect={() => onSelect(race.key, candidate.id)}
                    />
                  </div>
                ))}
              </div>
            </article>
        ))
      )}
    </section>
  );
}

function IncompleteBallotModal({
  missingCategories,
  onClose,
}: {
  missingCategories: string[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-[1.5rem] border border-border bg-background p-5 shadow-xl sm:rounded-[2rem] sm:p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="incomplete-ballot-title"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="incomplete-ballot-title" className="text-lg font-black tracking-tight">
            Please vote for all categories
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Please also vote for {missingCategories.join(", ")}.
        </p>
        <AppButton
          type="button"
          className="mt-5 h-12 w-full rounded-2xl font-black"
          onClick={onClose}
        >
          Continue voting
        </AppButton>
      </div>
    </div>
  );
}

function DetailsModal({
  picks,
  name,
  rollNumber,
  selfiePreview,
  error,
  submitting,
  canSubmit,
  onNameChange,
  onRollNumberChange,
  onSelfieCapture,
  onSelfieRetake,
  onClose,
  onSubmit,
}: {
  picks: {
    race: { key: string; label: string };
    candidate: PublicElectionCandidate;
  }[];
  name: string;
  rollNumber: string;
  selfiePreview: string | null;
  error: string | null;
  submitting: boolean;
  canSubmit: boolean;
  onNameChange: (value: string) => void;
  onRollNumberChange: (value: string) => void;
  onSelfieCapture: (file: File) => void;
  onSelfieRetake: () => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-dvh w-full max-w-3xl flex-col overflow-hidden rounded-t-[1.5rem] border border-border bg-background shadow-xl sm:h-auto sm:max-h-[90dvh] sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vote-details-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-4 py-3 sm:px-5 sm:py-4">
          <h2 id="vote-details-title" className="font-bold">
            Confirm your votes
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain lg:grid lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden">
          <section className="order-1 p-4 sm:p-5 lg:order-2 lg:min-h-0 lg:overflow-y-auto lg:border-l lg:border-border/40">
            <h3 className="text-base font-black tracking-tight sm:text-lg">
              Your details
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with your school-registered student account, then enter
              the name and roll number on your school record and take a selfie.
              Each eligible roll number can vote once per category.
            </p>

            <div className="mt-5 space-y-4">
              <VoterSelfieCapture
                previewUrl={selfiePreview}
                onCapture={onSelfieCapture}
                onRetake={onSelfieRetake}
              />
              <Field
                label="Name *"
                icon={UserSVG}
                helper="Use the name on your school records."
              >
                <AppInput
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Your full name"
                  className="pl-12"
                />
              </Field>
              <Field
                label="Roll number *"
                icon={HashSVG}
                helper="You can vote once in each category."
              >
                <AppInput
                  value={rollNumber}
                  onChange={(e) => onRollNumberChange(e.target.value)}
                  placeholder="School roll number"
                  className="pl-12"
                />
              </Field>

              {error ? (
                <p className="text-sm font-medium text-destructive">{error}</p>
              ) : null}
            </div>
          </section>

          <div className="order-2 space-y-2.5 border-t border-border/40 p-4 sm:p-5 lg:order-1 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:border-t-0">
            {picks.map((pick) => (
              <article
                key={pick.candidate.id}
                className="flex items-center gap-3 overflow-hidden rounded-2xl border border-primary/20 bg-card p-2.5"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl sm:size-20">
                  <img
                    src={pick.candidate.profileImageUrl}
                    alt={pick.candidate.name}
                    draggable={false}
                    className="pointer-events-none size-full select-none object-cover object-top"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-foreground/20">
                    <VoteStampBadge className="w-10 rotate-12 sm:w-12" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Your vote
                  </p>
                  <h3 className="truncate text-sm font-black tracking-tight sm:text-base">
                    {pick.candidate.name}
                  </h3>
                  <p className="truncate text-xs font-semibold text-primary">
                    {pick.race.label}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase">
                    Class {pick.candidate.classLevel}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border/40 bg-background p-4 sm:p-5">
          <AppButton
            type="button"
            variant="outline"
            className="h-12 w-full rounded-2xl font-bold"
            onClick={onClose}
          >
            Back
          </AppButton>
          <AppButton
            type="button"
            className="h-12 w-full rounded-2xl font-black"
            disabled={!canSubmit}
            onClick={onSubmit}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitting ? "Submitting..." : "Submit"}
          </AppButton>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  helper,
  icon: Icon,
  children,
}: {
  label: string;
  helper: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="group relative">
        <Icon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        {children}
      </div>
      <p className="text-[11px] text-muted-foreground">{helper}</p>
    </div>
  );
}

function CandidateCard({
  candidate,
  selected,
  disabled,
  onSelect,
}: {
  candidate: PublicElectionCandidate;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "group relative flex h-full w-full min-w-0 flex-col touch-manipulation overflow-hidden rounded-2xl border bg-card p-1.5 text-left shadow-sm transition-all duration-200 sm:p-2",
        {
          "border-primary bg-primary/5 ring-2 ring-primary shadow-md": selected,
          "border-border/60 hover:border-primary/40 hover:shadow-md": !selected,
          "opacity-60": disabled,
        },
      )}
    >
      <div className="relative mb-2 overflow-hidden rounded-xl shadow-sm">
        <img
          src={candidate.profileImageUrl}
          alt={candidate.name}
          draggable={false}
          className="pointer-events-none aspect-square w-full max-w-full select-none object-cover"
        />
        {candidate.symbolUrl ? (
          <div className="pointer-events-none absolute bottom-1.5 left-1.5 flex flex-col items-center">
            <div className="flex size-11 items-center justify-center overflow-hidden rounded-full border-2 border-card bg-white shadow-md sm:size-12">
              <ElectionSymbol
                symbolUrl={candidate.symbolUrl}
                name={candidate.symbolName ?? undefined}
                className="text-2xl leading-none"
                imgClassName="size-7 object-contain"
              />
            </div>
            {candidate.symbolName ? (
              <span className="mt-0.5 rounded bg-card/90 px-1.5 text-[10px] font-black text-muted-foreground">
                {candidate.symbolName}
              </span>
            ) : null}
          </div>
        ) : null}
        {selected ? (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/25">
            <VoteStampBadge className="w-12 sm:w-14 lg:w-16" />
          </div>
        ) : null}
      </div>
      <p className="text-xs font-black tracking-tight break-words">
        {candidate.name}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground uppercase">
        Class {candidate.classLevel}
      </p>
    </button>
  );
}
