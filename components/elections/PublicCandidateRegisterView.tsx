"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import AppSelect from "@/components/AppSelect";
import AppLogo from "@/components/AppLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import ElectionLogo from "@/components/elections/ElectionLogo";
import { Footer } from "@/components/landing/Footer";
import { APP_NAME } from "@/constants";
import { API_ENDPOINTS, FRONTEND_ROUTES } from "@/constants/endpoints";
import { CANDIDATE_GENDER_OPTIONS, formatElectionWindow, getClientErrorMessage } from "@/lib/elections/format";
import { cn } from "@/lib/utils";
import { ElectionStatus, Gender } from "@/types/enums";
import CameraSVG from "@/public/svgs/CameraSVG";
import ImageSVG from "@/public/svgs/ImageSVG";
import SymbolPicker, { type SymbolSelection } from "@/components/elections/SymbolPicker";
import CandidateBannerPreview from "@/components/elections/CandidateBannerPreview";
import ElectionSymbol from "@/components/elections/ElectionSymbol";
import type {
  PublicCandidateRegistration,
  PublicElectionCandidate,
  ElectionCandidate,
} from "@/types/election";

const PROFILE_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export default function PublicCandidateRegisterView({
  election,
}: {
  election: PublicCandidateRegistration;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [profile, setProfile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [symbol, setSymbol] = useState<SymbolSelection | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredCandidate, setRegisteredCandidate] =
    useState<ElectionCandidate | null>(null);
  const [previewCandidate, setPreviewCandidate] =
    useState<PublicElectionCandidate | null>(null);

  useEffect(() => {
    if (!previewCandidate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewCandidate(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewCandidate]);

  useEffect(() => {
    if (!profile) return;
    const url = URL.createObjectURL(profile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profile]);

  const closed = election.status === ElectionStatus.ENDED || election.registrationClosed;
  const noCategories = election.categories.length === 0;
  const isLive = election.status === ElectionStatus.LIVE;

  let statusLabel = election.registrationClosed
    ? "Registration closed"
    : "Election closed";
  if (election.status === ElectionStatus.LIVE && !election.registrationClosed) {
    statusLabel = "Election Active";
  } else if (election.status === ElectionStatus.UPCOMING && !election.registrationClosed) {
    statusLabel = "Opens soon";
  }
  const canSave =
    !closed &&
    !noCategories &&
    !submitting &&
    Boolean(
      name.trim() &&
        category &&
        (gender === Gender.MALE || gender === Gender.FEMALE) &&
        classLevel.trim() &&
        profile,
    );

  const applyFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setProfile(file);
  };

  const handleSubmit = async () => {
    if (!canSave) return;
    setError(null);
    setSubmitting(true);
    try {
      const form = new FormData();
      if (!profile) return;
      form.set("name", name.trim());
      form.set("category", category);
      form.set("gender", gender);
      form.set("classLevel", classLevel.trim());
      form.set("profile", profile);
      if (symbol) {
        form.set("symbolName", symbol.name);
        if (symbol.type === "emoji") {
          form.set("symbol", `emoji:${symbol.emoji}`);
        } else if (symbol.type === "image") {
          form.set("symbol", symbol.src);
        } else {
          form.set("symbol", symbol.file);
        }
      }

      const res = await fetch(
        `/api${API_ENDPOINTS.ELECTIONS.REGISTER(election.slug)}`,
        { method: "POST", body: form },
      );
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
        data?: ElectionCandidate;
      };
      if (!res.ok || !json.success) {
        setError(json.error || json.message || "Could not submit registration.");
        return;
      }
      if (json.data) setRegisteredCandidate(json.data);
    } catch (err) {
      setError(getClientErrorMessage(err, "Could not submit registration."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6">
          <Link
            href={FRONTEND_ROUTES.HOME}
            className="justify-self-start"
            aria-label={`Go to ${APP_NAME} home`}
          >
            <AppLogo className="h-11 w-44 sm:h-12 sm:w-52" priority />
          </Link>

          <span
            className={cn(
              "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-widest",
              {
                "border-primary/20 bg-primary/10 text-primary": isLive,
                "border-border bg-muted text-muted-foreground": !isLive,
              },
            )}
          >
            {isLive ? (
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-70" />
                <span className="relative size-2 rounded-full bg-primary" />
              </span>
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
              className="border border-primary-foreground/20 bg-white shadow-lg"
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
        </div>
      </section>

      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        {closed ? (
          <p className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3 text-center text-sm font-medium">
            {election.registrationClosed
              ? "Candidate registration is closed. New candidates cannot register."
              : "This election is closed. New candidates cannot register."}
          </p>
        ) : noCategories ? (
          <p className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3 text-center text-sm font-medium">
            Candidate registration is not open yet. The election organizer needs
            to add categories first.
          </p>
        ) : registeredCandidate ? (
          <div className="space-y-5">
            <CandidateBannerPreview
              candidate={registeredCandidate}
              election={election}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={FRONTEND_ROUTES.PUBLIC_ELECTION(election.slug)}
                className="flex-1"
              >
                <AppButton type="button" className="h-11 w-full rounded-2xl font-black">
                  View election details
                </AppButton>
              </Link>
            </div>
            <p className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3 text-center text-sm font-medium text-muted-foreground">
              Thanks for registering — download your campaign banner to let
              others know you are in the race.
            </p>
          </div>
        ) : (
          <div className="space-y-4 rounded-[2rem] border border-border bg-card/80 p-5 shadow-xl sm:p-6">
            <h2 className="text-lg font-black tracking-tight">Candidate Registration</h2>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Profile photo *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept={PROFILE_ACCEPT}
                className="hidden"
                onChange={(e) => applyFile(e.target.files?.[0])}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      applyFile(e.dataTransfer.files?.[0]);
                    }}
                    className="flex size-32 items-center justify-center overflow-hidden rounded-full border-4 border-primary/20 bg-muted shadow-sm"
                    aria-label="Upload profile photo"
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt="Candidate preview"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center px-3 text-center">
                        <ImageSVG className="mb-1 size-7 text-primary" />
                        <p className="text-[10px] font-bold leading-tight">
                          Upload photo
                        </p>
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-0 bottom-0 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                    aria-label="Change photo"
                  >
                    <CameraSVG className="size-4" />
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {profile ? profile.name : "JPEG, PNG, or WebP"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Candidate symbol (optional)
              </label>
              <SymbolPicker onChange={setSymbol} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Name *
              </label>
              <AppInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Category *
              </label>
              <AppSelect
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Select category"
                options={election.categories.map((item) => ({
                  value: item,
                  label: item,
                }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Gender *
              </label>
              <AppSelect
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                placeholder="Select gender"
                options={CANDIDATE_GENDER_OPTIONS}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Class *
              </label>
              <AppInput
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                placeholder="XII"
              />
            </div>

            {error ? (
              <p className="text-sm font-medium text-destructive">{error}</p>
            ) : null}

            <AppButton
              type="button"
              className="h-12 w-full rounded-2xl font-black"
              disabled={!canSave}
              onClick={() => void handleSubmit()}
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitting ? "Submitting..." : "Register as candidate"}
            </AppButton>
          </div>
        )}

        {election.candidates.length > 0 ? (
          <section className="mt-10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-black tracking-tight">
                Already registered
              </h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                {election.candidates.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Tap a candidate to open their banner.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {election.candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => setPreviewCandidate(candidate)}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-border/50 bg-card/70 p-4 text-center shadow-sm transition hover:border-primary/40 hover:shadow-md"
                >
                  <div className="relative">
                    <img
                      src={candidate.profileImageUrl}
                      alt={candidate.name}
                      className="size-16 rounded-full border-2 border-primary/20 object-cover"
                      loading="lazy"
                    />
                    {candidate.symbolUrl ? (
                      <div className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center overflow-hidden rounded-full border border-border bg-white">
                        <ElectionSymbol
                          symbolUrl={candidate.symbolUrl}
                          name={candidate.symbolName ?? "symbol"}
                          className="text-sm"
                          imgClassName="size-full p-0.5 object-contain"
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-bold leading-snug">
                      {candidate.name}
                    </p>
                    <p className="mt-0.5 break-words text-[11px] leading-snug text-muted-foreground">
                      {candidate.classLevel}
                    </p>
                  </div>
                  <span className="mt-auto pt-1 text-[10px] font-black uppercase tracking-wider text-primary opacity-0 transition group-hover:opacity-100">
                    View banner
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />

      {previewCandidate ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setPreviewCandidate(null)}
        >
          <div
            className="w-full overflow-y-auto rounded-t-[2rem] bg-background p-2 pt-3 sm:h-auto sm:max-h-[96vh] sm:max-w-lg sm:rounded-[2rem] sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <CandidateBannerPreview
              candidate={previewCandidate}
              election={election}
              onClose={() => setPreviewCandidate(null)}
              fitToViewport
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
