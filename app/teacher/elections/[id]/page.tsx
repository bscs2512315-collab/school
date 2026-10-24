"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, ImagePlus, Loader2, Plus, Trophy, X } from "lucide-react";
import EditSVG from "@/public/svgs/EditSVG";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import AppDateTimePicker from "@/components/AppDateTimePicker";
import AppInput from "@/components/AppInput";
import AppQueryState from "@/components/AppQueryState";
import ConfirmationModal from "@/components/ConfirmationModal";
import CandidateFormModal from "@/components/elections/CandidateFormModal";
import ElectionAnalyticsCharts from "@/components/elections/ElectionAnalyticsCharts";
import ElectionCountdown from "@/components/elections/ElectionCountdown";
import ElectionLogo from "@/components/elections/ElectionLogo";
import ElectionStatusBadge from "@/components/elections/ElectionStatusBadge";
import ElectionSymbol from "@/components/elections/ElectionSymbol";
import ElectionVotesPanel from "@/components/elections/ElectionVotesPanel";
import { API_ENDPOINTS, FRONTEND_ROUTES } from "@/constants/endpoints";
import { apiDelete, apiPatch, apiPost } from "@/lib/api/api-client";
import {
  formatCandidateMeta,
  formatElectionWindow,
  getClientErrorMessage,
  toDatetimeLocalValue,
} from "@/lib/elections/format";
import {
  copyElectionLink,
  copyElectionRegisterLink,
  useElectionPublicUrl,
  useElectionRegisterUrl,
} from "@/hooks/elections/useElectionPublicUrl";
import { slugifyElectionName } from "@/lib/elections/slug";
import { getCategorySortRank } from "@/lib/elections/races";
import {
  useTeacherElection,
  useTeacherElectionAnalytics,
  useTeacherElectionVotes,
} from "@/hooks/teacher/useTeacherElections";
import { queryKeys } from "@/lib/api/query-keys";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ElectionCandidate } from "@/types/election";
import { ElectionStatus } from "@/types/enums";

type DetailTab = "candidates" | "analytics" | "votes" | "settings";

export default function TeacherElectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const electionQuery = useTeacherElection(id);
  const votesQuery = useTeacherElectionVotes(id, electionQuery.data?.status);
  const analyticsQuery = useTeacherElectionAnalytics(
    id,
    electionQuery.data?.status,
  );

  const [tab, setTab] = useState<DetailTab>("candidates");
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] =
    useState<ElectionCandidate | null>(null);
  const [savingCandidate, setSavingCandidate] = useState(false);
  const [deleteCandidate, setDeleteCandidate] =
    useState<ElectionCandidate | null>(null);
  const [deletingCandidate, setDeletingCandidate] = useState(false);
  const [deleteElectionOpen, setDeleteElectionOpen] = useState(false);
  const [deletingElection, setDeletingElection] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [approvingResults, setApprovingResults] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [candidateCategoryFilter, setCandidateCategoryFilter] = useState("All");
  const logoInputRef = useRef<HTMLInputElement>(null);

  const election = electionQuery.data;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [showLiveResults, setShowLiveResults] = useState(true);
  const livePublicUrl = useElectionPublicUrl(election?.slug || "your-slug");
  const settingsPublicUrl = useElectionPublicUrl(slug || "your-slug");
  const settingsRegisterUrl = useElectionRegisterUrl(slug || "your-slug");

  useEffect(() => {
    if (!election) return;
    setName(election.name);
    setSlug(election.slug);
    setStartsAt(toDatetimeLocalValue(election.startsAt));
    setEndsAt(toDatetimeLocalValue(election.endsAt));
    setCategories(election.categories);
    setRegistrationClosed(election.registrationClosed);
    setShowLiveResults(election.showLiveResults ?? true);
    setCategoryDraft("");
    setCandidateCategoryFilter("All");
  }, [election]);

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.teacher.election(id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.teacher.elections() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.teacher.electionVotes(id) }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.teacher.electionAnalytics(id),
      }),
    ]);
  };

  const copyUrl = async (nextSlug: string) => {
    try {
      await copyElectionLink(nextSlug);
      toast.success("Public voting link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const copyRegisterUrl = async (nextSlug: string) => {
    try {
      await copyElectionRegisterLink(nextSlug);
      toast.success("Candidate registration link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const addCategory = () => {
    const value = categoryDraft.trim();
    if (!value) return;
    if (categories.length >= 24) {
      toast.error("You can add up to 24 categories");
      return;
    }
    const exists = categories.some(
      (item) => item.toLowerCase() === value.toLowerCase(),
    );
    if (exists) {
      toast.error("That category is already added");
      return;
    }
    setCategories((prev) => [...prev, value]);
    setCategoryDraft("");
  };

  const handleCandidateSubmit = async (form: FormData) => {
    setSavingCandidate(true);
    try {
      if (editingCandidate) {
        const res = await apiPatch(
          API_ENDPOINTS.TEACHER.ELECTION_CANDIDATE(id, editingCandidate.id),
          form,
        );
        if (!res.success) {
          toast.error("Failed to update candidate");
          return;
        }
        toast.success("Candidate updated");
      } else {
        const res = await apiPost(
          API_ENDPOINTS.TEACHER.ELECTION_CANDIDATES(id),
          form,
        );
        if (!res.success) {
          toast.error("Failed to add candidate");
          return;
        }
        toast.success("Candidate added");
      }
      setCandidateModalOpen(false);
      setEditingCandidate(null);
      await invalidate();
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Failed to save candidate"));
    } finally {
      setSavingCandidate(false);
    }
  };

  const handleDeleteCandidate = async () => {
    if (!deleteCandidate) return;
    setDeletingCandidate(true);
    try {
      const res = await apiDelete(
        API_ENDPOINTS.TEACHER.ELECTION_CANDIDATE(id, deleteCandidate.id),
      );
      if (!res.success) {
        toast.error("Failed to remove candidate");
        return;
      }
      toast.success("Candidate removed");
      setDeleteCandidate(null);
      await invalidate();
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Failed to remove candidate"));
    } finally {
      setDeletingCandidate(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await apiPatch(API_ENDPOINTS.TEACHER.ELECTION(id), {
        name: name.trim(),
        slug: slug.trim() || slugifyElectionName(name),
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        categories,
        registrationClosed,
        showLiveResults,
      });
      if (!res.success) {
        toast.error("Failed to update election");
        return;
      }
      toast.success("Election updated");
      await invalidate();
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Failed to update election"));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogoChange = async (file: File | null) => {
    if (!file) return;
    const form = new FormData();
    form.append("logo", file);
    setUploadingLogo(true);
    try {
      const res = await apiPost(API_ENDPOINTS.TEACHER.ELECTION_LOGO(id), form);
      if (!res.success) {
        toast.error("Failed to upload logo");
        return;
      }
      toast.success("Logo updated");
      await invalidate();
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Failed to upload logo"));
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleDeleteElection = async () => {
    setDeletingElection(true);
    try {
      const res = await apiDelete(API_ENDPOINTS.TEACHER.ELECTION(id));
      if (!res.success) {
        toast.error("Failed to delete election");
        return;
      }
      toast.success("Election deleted");
      router.push(FRONTEND_ROUTES.TEACHER_ELECTIONS);
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Failed to delete election"));
    } finally {
      setDeletingElection(false);
    }
  };

  const handleApproveResults = async () => {
    setApprovingResults(true);
    try {
      const res = await apiPost(
        API_ENDPOINTS.TEACHER.ELECTION_APPROVE_RESULTS(id),
      );
      if (!res.success) {
        toast.error(res.message || "Failed to approve results");
        return;
      }
      toast.success("Results approved — winners are now shown publicly");
      await invalidate();
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Failed to approve results"));
    } finally {
      setApprovingResults(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title={election?.name || "Election"} mobileTitle="Elections" />

      <AppQueryState
        query={electionQuery}
        emptyTitle="Election not found"
        emptyMessage="This election may have been deleted."
        onRetry={() => void electionQuery.refetch()}
      >
        {(data) => (
          <div className="space-y-6">
            <section className="relative overflow-hidden rounded-[2rem] bg-primary text-primary-foreground">
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

              <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 text-center sm:px-6 sm:py-12">
                {data.logoUrl ? (
                  <ElectionLogo
                    src={data.logoUrl}
                    alt={data.name}
                    size="lg"
                    className="mx-auto border border-primary-foreground/20 bg-white shadow-lg"
                  />
                ) : (
                  <div className="mx-auto flex size-24 w-56 items-center justify-center rounded-2xl bg-primary-foreground/10 text-sm font-black text-primary-foreground backdrop-blur-md sm:h-24">
                    Logo
                  </div>
                )}
                <div className="mt-6 space-y-3">
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                    {data.name}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <ElectionStatusBadge status={data.status} />
                  </div>
                  <p className="text-sm font-medium text-primary-foreground/75">
                    {formatElectionWindow(data.startsAt, data.endsAt)}
                  </p>
                  <p className="mx-auto max-w-xl truncate text-xs font-semibold text-primary-foreground/60">
                    {livePublicUrl}
                  </p>
                </div>
                <div className="mt-8">
                  <ElectionCountdown
                    startsAt={data.startsAt}
                    endsAt={data.endsAt}
                    status={data.status}
                    tone="onPrimary"
                  />
                </div>
                <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
                  <AppButton
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl bg-background/10 text-primary-foreground hover:bg-background/20 hover:text-primary-foreground"
                    onClick={() => void copyUrl(data.slug)}
                  >
                    <Copy className="size-4" />
                    Copy voting link
                  </AppButton>
                  <AppButton
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl bg-background/10 text-primary-foreground hover:bg-background/20 hover:text-primary-foreground"
                    onClick={() => void copyRegisterUrl(data.slug)}
                  >
                    <Copy className="size-4" />
                    Copy registration link
                  </AppButton>
                </div>
              </div>
            </section>

            {tab === "candidates" ? (
              <AppButton
                type="button"
                className="h-10 w-full rounded-xl text-sm font-black sm:hidden"
                onClick={() => {
                  setEditingCandidate(null);
                  setCandidateModalOpen(true);
                }}
              >
                <Plus className="size-4" />
                Add candidate
              </AppButton>
            ) : null}
            <div className={cn("flex items-center justify-between gap-3 border-b border-border/40", tab === "candidates" && "mb-1 sm:mb-2")}>
              <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
                {(
                  [
                    { key: "candidates" as const, label: "Candidates" },
                    { key: "analytics" as const, label: "Analytics" },
                    { key: "votes" as const, label: "Votes" },
                    { key: "settings" as const, label: "Settings" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={cn(
                      "relative px-4 py-3 text-sm font-bold transition-colors",
                      {
                        "text-primary": tab === item.key,
                        "text-muted-foreground hover:text-foreground":
                          tab !== item.key,
                      },
                    )}
                  >
                    {item.label}
                    {tab === item.key ? (
                      <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
                    ) : null}
                  </button>
                ))}
              </div>
              {tab === "candidates" ? (
                <AppButton
                  type="button"
                  className="hidden h-9 shrink-0 rounded-xl px-3 text-sm font-black sm:flex sm:mb-2"
                  onClick={() => {
                    setEditingCandidate(null);
                    setCandidateModalOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Add candidate
                </AppButton>
              ) : null}
            </div>

            {tab === "candidates" ? (
              <div className="space-y-4">
                {(() => {
                  const candidateCategories = [
                    ...new Set([
                      ...data.categories,
                      ...data.candidates
                        .map((c) => c.category)
                        .filter((cat): cat is string => Boolean(cat)),
                    ]),
                  ].sort(
                    (a, b) =>
                      getCategorySortRank(a, data.categories) -
                        getCategorySortRank(b, data.categories) ||
                      a.localeCompare(b),
                  );
                  const filteredCandidates = (
                    candidateCategoryFilter === "All"
                      ? data.candidates
                      : data.candidates.filter(
                          (c) => c.category === candidateCategoryFilter,
                        )
                  )
                    .slice()
                    .sort((a, b) => {
                      const rankA = getCategorySortRank(a.category, data.categories);
                      const rankB = getCategorySortRank(b.category, data.categories);
                      if (rankA !== rankB) return rankA - rankB;
                      const genderOrder: Record<string, number> = {
                        male: 0,
                        female: 1,
                        other: 2,
                      };
                      const gA = a.gender ? (genderOrder[a.gender] ?? 9) : 9;
                      const gB = b.gender ? (genderOrder[b.gender] ?? 9) : 9;
                      if (gA !== gB) return gA - gB;
                      return a.name.localeCompare(b.name);
                    });
                  return (
                    <>
                      {candidateCategories.length > 0 ? (
                        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1">
                          <button
                            type="button"
                            onClick={() => setCandidateCategoryFilter("All")}
                            className={cn(
                              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                              candidateCategoryFilter === "All"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-card text-muted-foreground hover:border-primary/40",
                            )}
                          >
                            All
                            <span className="ml-1 text-[10px] opacity-60">
                              {data.candidates.length}
                            </span>
                          </button>
                          {candidateCategories.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setCandidateCategoryFilter(cat)}
                              className={cn(
                                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                                candidateCategoryFilter === cat
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
                              )}
                            >
                              {cat}
                              <span className="ml-1 text-[10px] opacity-60">
                                {data.candidates.filter((c) => c.category === cat).length}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {data.candidates.length === 0 ? (
                        <div className="rounded-[2rem] border border-dashed border-border p-10 text-center">
                          <p className="font-bold">No candidates yet</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Add nominees yourself, or share the registration link so
                            candidates can sign up. They pick a category from the list
                            you set in Settings.
                          </p>
                          <AppButton
                            type="button"
                            variant="outline"
                            className="mt-4 h-11 rounded-2xl"
                            onClick={() => void copyRegisterUrl(data.slug)}
                          >
                            <Copy className="size-4" />
                            Copy registration link
                          </AppButton>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                          {filteredCandidates.map((candidate) => (
                            <div
                              key={candidate.id}
                              className="flex h-full flex-col rounded-2xl border border-border/50 bg-card/40 p-2.5"
                            >
                              <div className="relative mb-2 overflow-hidden rounded-xl">
                                <img
                                  src={candidate.profileImageUrl}
                                  alt={candidate.name}
                                  className="aspect-square w-full object-cover"
                                />
                                {candidate.symbolUrl ? (
                                  <div className="pointer-events-none absolute bottom-1.5 left-1.5 flex flex-col items-center">
                                    <div className="flex size-11 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-white shadow-md">
                                      <ElectionSymbol
                                        symbolUrl={candidate.symbolUrl}
                                        name={candidate.symbolName ?? undefined}
                                        className="text-2xl leading-none"
                                        imgClassName="size-7 object-contain"
                                      />
                                    </div>
                                    {candidate.symbolName ? (
                                      <span className="mt-0.5 rounded bg-white/90 px-1.5 text-[10px] font-black text-slate-600">
                                        {candidate.symbolName}
                                      </span>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                              <p className="text-sm font-black break-words">
                                {candidate.name}
                              </p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {formatCandidateMeta({
                                  category: candidate.category,
                                  gender: candidate.gender,
                                  classLevel: candidate.classLevel,
                                })}
                              </p>
                              <div className="mt-auto pt-2">
                                <p className="text-[11px] font-bold text-muted-foreground">
                                  {candidate.voteCount ?? 0} votes
                                </p>
                                <div className="mt-2 flex gap-1.5">
                                <AppButton
                                  type="button"
                                  variant="outline"
                                  className="h-8 flex-1 rounded-lg px-2 text-xs"
                                  onClick={() => {
                                    setEditingCandidate(candidate);
                                    setCandidateModalOpen(true);
                                  }}
                                >
                                  <EditSVG className="size-3.5" />
                                  Edit
                                </AppButton>
                                <AppButton
                                  type="button"
                                  variant="destructive"
                                  className="size-8 rounded-lg px-0"
                                  onClick={() => setDeleteCandidate(candidate)}
                                >
                                  <DeleteSVG className="size-3.5" />
                                </AppButton>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : null}

            {tab === "analytics" ? (
              <div className="space-y-4">
                {!data.showLiveResults && !data.resultsApprovedAt ? (
                  <div className="flex items-center gap-2.5 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs text-primary font-medium">
                    <span className="font-bold">Live results hidden from voters:</span>
                    <span>Only you can see this data. Voters will only see results on the public link after you approve final results.</span>
                  </div>
                ) : null}
                <AppQueryState
                  query={analyticsQuery}
                  emptyTitle="No analytics yet"
                  emptyMessage="Add candidates to start tracking live results."
                  onRetry={() => void analyticsQuery.refetch()}
                >
                  {(analytics) => (
                    <ElectionAnalyticsCharts
                      analytics={analytics}
                      isLive={data.status === ElectionStatus.LIVE}
                    />
                  )}
                </AppQueryState>
              </div>
            ) : null}

            {tab === "votes" ? (
              <div className="space-y-5">
                <section className="rounded-[2rem] border border-border/50 bg-card/40 p-5 sm:p-6">
                  <h3 className="text-base font-black tracking-tight">
                    Final results
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review the votes below, discard invalid ballots, then
                    approve the results to reveal the winners to voters.
                  </p>
                  {data.status !== ElectionStatus.ENDED ? (
                    <div className="mt-4 rounded-2xl border border-border/50 bg-muted/30 px-4 py-3 text-sm font-semibold text-muted-foreground">
                      Results can be approved once the election ends.
                    </div>
                  ) : data.resultsApprovedAt ? (
                    <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
                      <p className="text-sm font-black text-primary">
                        Results approved
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                        Winners are now shown publicly on the voting page.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Trophy className="size-5 text-primary" />
                        </span>
                        <p className="text-sm font-bold">
                          The election has ended. Discard invalid votes above,
                          then approve the final results.
                        </p>
                      </div>
                      <AppButton
                        type="button"
                        className="h-12 shrink-0 rounded-2xl px-6 font-black sm:ml-auto"
                        disabled={approvingResults}
                        onClick={() => void handleApproveResults()}
                      >
                        {approvingResults ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        Approve final results
                      </AppButton>
                    </div>
                  )}
                </section>

                <AppQueryState
                  query={votesQuery}
                  emptyTitle="No votes yet"
                  emptyMessage="Share the public link so students can vote."
                  onRetry={() => void votesQuery.refetch()}
                >
                  {(payload) => (
                    <ElectionVotesPanel
                      payload={payload}
                      electionId={id}
                    />
                  )}
                </AppQueryState>
              </div>
            ) : null}

            {tab === "settings" ? (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                <div className="space-y-5 lg:col-span-3">
                  <section className="rounded-[2rem] border border-border/50 bg-card/40 p-5 sm:p-6">
                    <h3 className="text-base font-black tracking-tight">
                      Election details
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      The name and public link voters will see.
                    </p>
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Election name
                        </label>
                        <AppInput
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Public URL slug
                        </label>
                        <AppInput
                          value={slug}
                          onChange={(e) => setSlug(e.target.value.toLowerCase())}
                        />
                      </div>
                    </div>
                    <div className="mt-4 space-y-3 rounded-2xl border border-border/50 bg-muted/30 px-4 py-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Voting link
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold">
                          {settingsPublicUrl}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Candidate registration link
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold">
                          {settingsRegisterUrl}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[2rem] border border-border/50 bg-card/40 p-5 sm:p-6">
                    <h3 className="text-base font-black tracking-tight">
                      Categories
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Candidates who register themselves choose from this list.
                      You can still type a category when you add a candidate
                      yourself.
                    </p>
                    <div className="mt-5 flex min-w-0 gap-2">
                      <div className="min-w-0 flex-1">
                        <AppInput
                          value={categoryDraft}
                          onChange={(e) => setCategoryDraft(e.target.value)}
                          placeholder="President, Vice President"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCategory();
                            }
                          }}
                        />
                      </div>
                      <AppButton
                        type="button"
                        className="h-11 shrink-0 rounded-xl px-4 font-bold"
                        onClick={addCategory}
                      >
                        <Plus className="size-4" />
                        Add
                      </AppButton>
                    </div>
                    {categories.length === 0 ? (
                      <p className="mt-4 text-sm text-muted-foreground">
                        No categories yet. Add at least one before sharing the
                        registration link.
                      </p>
                    ) : (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {categories.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold"
                          >
                            {item}
                            <button
                              type="button"
                              className="rounded-full p-0.5 hover:bg-muted"
                              aria-label={`Remove ${item}`}
                              onClick={() =>
                                setCategories((prev) =>
                                  prev.filter((category) => category !== item),
                                )
                              }
                            >
                              <X className="size-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-[2rem] border border-border/50 bg-card/40 p-5 sm:p-6">
                    <h3 className="text-base font-black tracking-tight">
                      Voting window
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Easy voting opens at the start time and closes at the end time.
                    </p>
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Starts
                        </label>
                        <AppDateTimePicker
                          value={startsAt}
                          onChange={setStartsAt}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Ends
                        </label>
                          <AppDateTimePicker
                          value={endsAt}
                          onChange={setEndsAt}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[2rem] border border-border/50 bg-card/40 p-5 sm:p-6">
                    <h3 className="text-base font-black tracking-tight">
                      Candidate registration
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Close the registration link to stop new candidates from
                      nominating themselves.
                    </p>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!registrationClosed}
                      onClick={() => setRegistrationClosed((prev) => !prev)}
                      className="mt-4 flex w-full items-center justify-between gap-4 rounded-2xl border border-border/50 bg-muted/30 px-4 py-3 text-left"
                    >
                      <span>
                        <span className="block text-sm font-bold">
                          {registrationClosed
                            ? "Registration is closed"
                            : "Registration is open"}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {registrationClosed
                            ? "Candidates cannot register until you reopen it."
                            : "Anyone with the link can register as a candidate."}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                          registrationClosed
                            ? "bg-muted-foreground/50"
                            : "bg-primary",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block size-4 rounded-full bg-background shadow transition-transform",
                            registrationClosed
                              ? "translate-x-0.5"
                              : "translate-x-[22px]",
                          )}
                        />
                      </span>
                    </button>
                  </section>

                  <section className="rounded-[2rem] border border-border/50 bg-card/40 p-5 sm:p-6">
                    <h3 className="text-base font-black tracking-tight">
                      Live results on voting link
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Control whether voters can view live tallies during the election, or only after you officially approve results.
                    </p>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={showLiveResults}
                      onClick={() => setShowLiveResults((prev) => !prev)}
                      className="mt-4 flex w-full items-center justify-between gap-4 rounded-2xl border border-border/50 bg-muted/30 px-4 py-3 text-left"
                    >
                      <span>
                        <span className="block text-sm font-bold">
                          {showLiveResults
                            ? "Live results are visible to voters"
                            : "Live results are hidden from voters"}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {showLiveResults
                            ? "Voters see live vote counts and charts below the ballot."
                            : "Voters will only see results after you click 'Approve final results'."}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                          showLiveResults
                            ? "bg-primary"
                            : "bg-muted-foreground/50",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block size-4 rounded-full bg-background shadow transition-transform",
                            showLiveResults
                              ? "translate-x-[22px]"
                              : "translate-x-0.5",
                          )}
                        />
                      </span>
                    </button>
                  </section>

                  <AppButton
                    type="button"
                    className="h-12 w-full rounded-2xl font-black"
                    disabled={savingSettings}
                    onClick={() => void handleSaveSettings()}
                  >
                    {savingSettings ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Save changes
                  </AppButton>
                </div>

                <div className="flex flex-col gap-5 lg:col-span-2">
                  <section className="flex min-h-72 flex-1 flex-col rounded-[2rem] border border-border/50 bg-card/40 p-5 sm:p-6">
                    <h3 className="text-base font-black tracking-tight">Logo</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Shown on the public voting page.
                    </p>
                    <button
                      type="button"
                      disabled={uploadingLogo}
                      className="mt-5 flex min-h-52 flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:border-primary/40 hover:bg-muted/50"
                      onClick={() => logoInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith("image/")) {
                          void handleLogoChange(file);
                        }
                      }}
                    >
                      {uploadingLogo ? (
                        <Loader2 className="size-8 animate-spin text-primary" />
                      ) : (
                        <LogoDropPreview
                          logoUrl={data.logoUrl}
                          name={data.name}
                        />
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        JPEG, PNG, WebP · up to 5MB
                      </p>
                    </button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      className="hidden"
                      onChange={(e) => {
                        void handleLogoChange(e.target.files?.[0] ?? null);
                      }}
                    />
                  </section>

                  <section className="rounded-[2rem] border border-destructive/20 bg-destructive/5 p-5 sm:p-6">
                    <h3 className="text-base font-black tracking-tight">
                      Danger zone
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Permanently remove this election, its candidates, and all
                      votes.
                    </p>
                    <AppButton
                      type="button"
                      variant="outline"
                      className="mt-5 h-12 w-full rounded-2xl text-destructive hover:text-destructive"
                      onClick={() => setDeleteElectionOpen(true)}
                    >
                      <DeleteSVG className="size-4" />
                      Delete election
                    </AppButton>
                  </section>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </AppQueryState>

      <CandidateFormModal
        open={candidateModalOpen}
        saving={savingCandidate}
        candidate={editingCandidate}
        onClose={() => {
          setCandidateModalOpen(false);
          setEditingCandidate(null);
        }}
        onSubmit={(form) => void handleCandidateSubmit(form)}
      />

      <ConfirmationModal
        isOpen={deleteCandidate !== null}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={() => void handleDeleteCandidate()}
        title="Remove candidate?"
        message={
          deleteCandidate
            ? `${deleteCandidate.name} will be removed from this election.`
            : ""
        }
        confirmLabel="Remove"
        variant="danger"
        isLoading={deletingCandidate}
      />

      <ConfirmationModal
        isOpen={deleteElectionOpen}
        onClose={() => setDeleteElectionOpen(false)}
        onConfirm={() => void handleDeleteElection()}
        title="Delete election?"
        message="The public voting page and all votes will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        isLoading={deletingElection}
      />
    </PageContainer>
  );
}

function LogoDropPreview({
  logoUrl,
  name,
}: {
  logoUrl: string | null;
  name: string;
}) {
  if (logoUrl) {
    return (
      <>
        <img
          src={logoUrl}
          alt={name}
          className="max-h-32 max-w-full rounded-xl object-contain"
        />
        <p className="mt-3 text-sm font-semibold">Click or drop to replace</p>
      </>
    );
  }

  return (
    <>
      <ImagePlus className="mb-3 size-8 text-primary" />
      <p className="font-semibold">Click or drag to upload logo</p>
    </>
  );
}
