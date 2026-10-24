"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Copy,
  Info,
  Pencil,
  Search,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import AppState from "@/components/AppState";
import AppButton from "@/components/AppButton";
import EditVoterBallotModal from "@/components/elections/EditVoterBallotModal";
import { API_ENDPOINTS } from "@/constants/endpoints";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { apiPost } from "@/lib/api/api-client";
import { formatVoteTime, getClientErrorMessage } from "@/lib/elections/format";
import {
  getRaceColumnsFromTallies,
  groupVotesByVoter,
} from "@/lib/elections/races";
import type { VoterBallotRow } from "@/lib/elections/races";
import { detectOddRollNumbers } from "@/lib/elections/rollDetection";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ElectionVote, ElectionVotesPayload } from "@/types/election";

type DiscardTarget = "selected" | "flagged" | "single" | null;
type SearchScope = "all" | "name" | "roll";
type VotesFilter =
  | "all"
  | "issues"
  | "odd"
  | "duplicate"
  | "resolved"
  | "discarded";

export default function ElectionVotesPanel({
  payload,
  electionId,
}: {
  payload: ElectionVotesPayload;
  electionId: string;
}) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("all");
  const [activeFilter, setActiveFilter] = useState<VotesFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);

  // Modal states
  const [modalTarget, setModalTarget] = useState<DiscardTarget>(null);
  const [singleTargetRow, setSingleTargetRow] = useState<VoterBallotRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VoterBallotRow[] | null>(null);
  const [reason, setReason] = useState("");
  const [editingVoter, setEditingVoter] = useState<VoterBallotRow | null>(null);

  const totalVotes = payload.votes.length;

  const raceColumns = useMemo(() => {
    const fromTallies = getRaceColumnsFromTallies(payload.tallies);
    if (fromTallies.length > 0) return fromTallies;
    return getRaceColumnsFromTallies(
      payload.votes.map((vote) => ({
        category: vote.candidateCategory,
        gender: vote.candidateGender,
      })),
    );
  }, [payload.tallies, payload.votes]);

  const voterRows = useMemo(
    () => groupVotesByVoter(payload.votes),
    [payload.votes],
  );

  // Smart odd roll detection
  const flags = useMemo(
    () => detectOddRollNumbers(voterRows.map((row) => row.voterRollNumber)),
    [voterRows],
  );

  // Duplicate voter name detection across all ballots
  const duplicateInfo = useMemo(() => {
    const nameMap = new Map<string, VoterBallotRow[]>();
    for (const row of voterRows) {
      const norm = row.voterName.trim().toLowerCase().replace(/\s+/g, " ");
      if (!norm) continue;
      const list = nameMap.get(norm) ?? [];
      list.push(row);
      nameMap.set(norm, list);
    }

    const dupMap = new Map<
      string,
      { isDuplicate: boolean; count: number; otherRolls: string[] }
    >();

    for (const row of voterRows) {
      const norm = row.voterName.trim().toLowerCase().replace(/\s+/g, " ");
      const group = nameMap.get(norm) ?? [];
      if (group.length > 1) {
        dupMap.set(row.key, {
          isDuplicate: true,
          count: group.length,
          otherRolls: group
            .filter((r) => r.key !== row.key)
            .map((r) => r.voterRollNumber),
        });
      } else {
        dupMap.set(row.key, {
          isDuplicate: false,
          count: 1,
          otherRolls: [],
        });
      }
    }

    return dupMap;
  }, [voterRows]);

  // Unresolved odd roll keys (neither discarded nor resolved)
  const oddKeys = useMemo(
    () =>
      new Set(
        voterRows
          .filter(
            (row) =>
              !row.discarded &&
              !row.resolved &&
              Boolean(flags.get(row.key)?.odd),
          )
          .map((row) => row.key),
      ),
    [voterRows, flags],
  );

  // Unresolved duplicate voter keys (neither discarded nor resolved)
  const duplicateKeys = useMemo(
    () =>
      new Set(
        voterRows
          .filter(
            (row) =>
              !row.discarded &&
              !row.resolved &&
              Boolean(duplicateInfo.get(row.key)?.isDuplicate),
          )
          .map((row) => row.key),
      ),
    [voterRows, duplicateInfo],
  );

  // All unresolved flagged keys (odd OR duplicate)
  const flaggedKeys = useMemo(() => {
    const set = new Set<string>();
    oddKeys.forEach((k) => set.add(k));
    duplicateKeys.forEach((k) => set.add(k));
    return set;
  }, [oddKeys, duplicateKeys]);

  const oddSample = useMemo(() => {
    for (const key of oddKeys) {
      const flag = flags.get(key);
      if (flag?.expectedSample) return flag.expectedSample;
    }
    return null;
  }, [oddKeys, flags]);

  // Filter and search computation
  const filtered = useMemo(() => {
    let list = voterRows;

    if (activeFilter === "issues") {
      list = list.filter((r) => flaggedKeys.has(r.key));
    } else if (activeFilter === "odd") {
      list = list.filter((r) => oddKeys.has(r.key));
    } else if (activeFilter === "duplicate") {
      list = list.filter((r) => duplicateKeys.has(r.key));
    } else if (activeFilter === "resolved") {
      list = list.filter((r) => r.resolved);
    } else if (activeFilter === "discarded") {
      list = list.filter((r) => r.discarded);
    }

    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;

    return list.filter((row) => {
      if (searchScope === "name") {
        return row.voterName.toLowerCase().includes(q);
      }
      if (searchScope === "roll") {
        return row.voterRollNumber.toLowerCase().includes(q);
      }
      const haystack = [
        row.voterName,
        row.voterRollNumber,
        ...Object.values(row.picks).map((vote) => vote.candidateName),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [
    voterRows,
    activeFilter,
    flaggedKeys,
    oddKeys,
    duplicateKeys,
    searchTerm,
    searchScope,
  ]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((row) => selected.has(row.key));

  const selectedRows = voterRows.filter((row) => selected.has(row.key));
  const discardable = selectedRows.filter((row) => !row.discarded);
  const restorable = selectedRows.filter((row) => row.discarded);
  const discardedRows = voterRows.filter((row) => row.discarded);
  const resolvedRows = voterRows.filter((row) => row.resolved);

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.teacher.electionVotes(electionId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.teacher.electionAnalytics(electionId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.teacher.election(electionId),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.teacher.elections() }),
    ]);
  };

  // Resolve action: marks votes as valid
  const resolveRows = async (rows: VoterBallotRow[]) => {
    const voteIds = rows.flatMap((row) => row.voteIds);
    if (voteIds.length === 0) return;
    setBusy(true);
    try {
      await apiPost<{ resolved: number }>(
        API_ENDPOINTS.TEACHER.ELECTION_VOTES_RESOLVE(electionId),
        { voteIds },
      );
      toast.success(
        rows.length === 1
          ? `Marked ${rows[0].voterName} as valid`
          : `Marked ${rows.length} voters as valid`,
      );
      setSelected((prev) => {
        const next = new Set(prev);
        rows.forEach((r) => next.delete(r.key));
        return next;
      });
      await invalidate();
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Failed to resolve votes"));
    } finally {
      setBusy(false);
    }
  };

  // Unresolve action: reverts to unverified status
  const unresolveRows = async (rows: VoterBallotRow[]) => {
    const voteIds = rows.flatMap((row) => row.voteIds);
    if (voteIds.length === 0) return;
    setBusy(true);
    try {
      await apiPost<{ unresolved: number }>(
        API_ENDPOINTS.TEACHER.ELECTION_VOTES_UNRESOLVE(electionId),
        { voteIds },
      );
      toast.success(
        rows.length === 1
          ? `Valid status removed for ${rows[0].voterName}`
          : `Valid status removed for ${rows.length} voters`,
      );
      setSelected((prev) => {
        const next = new Set(prev);
        rows.forEach((r) => next.delete(r.key));
        return next;
      });
      await invalidate();
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Failed to unresolve votes"));
    } finally {
      setBusy(false);
    }
  };

  // Discard action (soft delete)
  const runDiscard = async () => {
    let rows: VoterBallotRow[] = [];
    if (modalTarget === "single" && singleTargetRow) {
      rows = [singleTargetRow];
    } else if (modalTarget === "flagged") {
      rows = voterRows.filter((row) => flaggedKeys.has(row.key));
    } else if (modalTarget === "selected") {
      rows = discardable;
    }

    const voteIds = rows.flatMap((row) => row.voteIds);
    if (voteIds.length === 0) {
      setModalTarget(null);
      setSingleTargetRow(null);
      return;
    }

    setBusy(true);
    try {
      await apiPost<{ discarded: number }>(
        API_ENDPOINTS.TEACHER.ELECTION_VOTES_DISCARD(electionId),
        { voteIds, reason: reason.trim() },
      );
      toast.success(
        rows.length === 1
          ? `Vote discarded for ${rows[0].voterName}`
          : `${rows.length} votes discarded`,
      );
      setSelected(new Set());
      setModalTarget(null);
      setSingleTargetRow(null);
      setReason("");
      await invalidate();
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Failed to discard votes"));
    } finally {
      setBusy(false);
    }
  };

  // Restore action
  const restoreRows = async (rows: VoterBallotRow[]) => {
    const voteIds = rows.flatMap((row) => row.voteIds);
    if (voteIds.length === 0) return;
    setBusy(true);
    try {
      await apiPost<{ restored: number }>(
        API_ENDPOINTS.TEACHER.ELECTION_VOTES_RESTORE(electionId),
        { voteIds },
      );
      toast.success(
        rows.length === 1
          ? `Restored vote for ${rows[0].voterName}`
          : `Restored ${rows.length} votes`,
      );
      setSelected(new Set());
      await invalidate();
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Failed to restore votes"));
    } finally {
      setBusy(false);
    }
  };

  // Permanent Delete action
  const runPermanentDelete = async () => {
    if (!deleteTarget || deleteTarget.length === 0) return;
    const voteIds = deleteTarget.flatMap((row) => row.voteIds);
    if (voteIds.length === 0) {
      setDeleteTarget(null);
      return;
    }

    setBusy(true);
    try {
      await apiPost<{ deleted: number }>(
        API_ENDPOINTS.TEACHER.ELECTION_VOTES_DELETE(electionId),
        { voteIds },
      );
      toast.success(
        deleteTarget.length === 1
          ? `Permanently deleted ballot for ${deleteTarget[0].voterName}`
          : `Permanently deleted ${deleteTarget.length} ballots`,
      );
      setSelected(new Set());
      setDeleteTarget(null);
      await invalidate();
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Failed to permanently delete votes"));
    } finally {
      setBusy(false);
    }
  };

  const toggleRow = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filtered.forEach((row) => next.delete(row.key));
      } else {
        filtered.forEach((row) => next.add(row.key));
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelected(new Set());
  };

  return (
    <div className="space-y-5">
      {/* Smart Flagged Detection Banner (Odd Roll Numbers & Duplicate Names) */}
      {flaggedKeys.size > 0 ? (
        <div className="flex flex-col gap-4 rounded-3xl border border-red-500/30 bg-red-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/15">
              <AlertTriangle className="size-6 text-red-500" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-black text-foreground">
                  {flaggedKeys.size} Suspicious Ballot{flaggedKeys.size === 1 ? "" : "s"} Detected
                </h4>
                {oddKeys.size > 0 ? (
                  <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-black text-red-600 dark:text-red-400">
                    {oddKeys.size} Odd Roll{oddKeys.size === 1 ? "" : "s"}
                  </span>
                ) : null}
                {duplicateKeys.size > 0 ? (
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-black text-amber-600 dark:text-amber-400">
                    {duplicateKeys.size} Duplicate Name{duplicateKeys.size === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs font-medium text-muted-foreground leading-relaxed">
                Roll numbers that don’t match expected format
                {oddSample ? ` (e.g. ${oddSample})` : ""} or multiple ballots with the same voter name.
                Click <strong>Resolve</strong> to make them valid, or <strong>Discard/Delete</strong> them.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-xl text-xs font-black"
              onClick={() => {
                setActiveFilter("issues");
                setSelected(new Set(flaggedKeys));
              }}
            >
              <CheckSquare className="size-3.5" />
              Select flagged ({flaggedKeys.size})
            </AppButton>
            <AppButton
              type="button"
              size="sm"
              className="h-9 rounded-xl bg-emerald-600 font-black text-white hover:bg-emerald-700"
              disabled={busy}
              onClick={() => {
                const flaggedRows = voterRows.filter((r) => flaggedKeys.has(r.key));
                void resolveRows(flaggedRows);
              }}
            >
              <CheckCircle2 className="size-3.5" />
              Resolve all ({flaggedKeys.size})
            </AppButton>
            <AppButton
              type="button"
              size="sm"
              className="h-9 rounded-xl bg-red-600 font-black text-white hover:bg-red-700"
              disabled={busy}
              onClick={() => {
                setReason("Flagged by odd/duplicate detection");
                setModalTarget("flagged");
              }}
            >
              <Trash2 className="size-3.5" />
              Discard flagged
            </AppButton>
          </div>
        </div>
      ) : null}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all",
              activeFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            All Voters
            <span className="rounded-full bg-background/30 px-1.5 py-0.2 text-[10px]">
              {voterRows.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("issues")}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all",
              activeFilter === "issues"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400",
            )}
          >
            <AlertTriangle className="size-3" />
            Flagged Issues
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px]",
                activeFilter === "issues"
                  ? "bg-white/20 text-white"
                  : "bg-red-600/20 text-red-600 dark:text-red-400",
              )}
            >
              {flaggedKeys.size}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("odd")}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all",
              activeFilter === "odd"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Odd Roll Numbers
            <span className="rounded-full bg-background/30 px-1.5 py-0.2 text-[10px]">
              {oddKeys.size}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("duplicate")}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all",
              activeFilter === "duplicate"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400",
            )}
          >
            <Copy className="size-3" />
            Duplicate Names
            <span className="rounded-full bg-background/30 px-1.5 py-0.2 text-[10px]">
              {duplicateKeys.size}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("resolved")}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all",
              activeFilter === "resolved"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400",
            )}
          >
            <CheckCircle2 className="size-3" />
            Resolved / Valid
            <span className="rounded-full bg-background/30 px-1.5 py-0.2 text-[10px]">
              {resolvedRows.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("discarded")}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all",
              activeFilter === "discarded"
                ? "bg-foreground text-background shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Discarded
            <span className="rounded-full bg-background/30 px-1.5 py-0.2 text-[10px]">
              {discardedRows.length}
            </span>
          </button>
        </div>

        {/* Search Bar with Scope Selection */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                searchScope === "name"
                  ? "Search by voter name (e.g. Ali sultan, Mustafa)..."
                  : searchScope === "roll"
                    ? "Search by roll number (e.g. 50050, 6677)..."
                    : "Search voter name, roll number, or candidate..."
              }
              className="h-12 w-full rounded-2xl border border-border/40 bg-muted/30 pr-10 pl-11 text-sm font-medium outline-none transition-all focus:border-primary/50"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          {/* Search scope selector pills */}
          <div className="flex items-center gap-1 rounded-2xl border border-border/40 bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setSearchScope("all")}
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-bold transition-colors",
                searchScope === "all"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              All Fields
            </button>
            <button
              type="button"
              onClick={() => setSearchScope("name")}
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-bold transition-colors",
                searchScope === "name"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Voter Name
            </button>
            <button
              type="button"
              onClick={() => setSearchScope("roll")}
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-bold transition-colors",
                searchScope === "roll"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Roll Number
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Selection Action Bar */}
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/50 bg-muted/30 px-4 py-3">
          <p className="text-sm font-bold">{selected.size} selected</p>
          <div className="ml-auto flex flex-wrap gap-2">
            <AppButton
              type="button"
              size="sm"
              className="h-9 rounded-xl bg-emerald-600 font-black text-white hover:bg-emerald-700"
              disabled={busy}
              onClick={() => void resolveRows(selectedRows)}
            >
              <CheckCircle2 className="size-3.5" />
              Resolve / Make Valid ({selected.size})
            </AppButton>

            {discardable.length > 0 ? (
              <AppButton
                type="button"
                size="sm"
                className="h-9 rounded-xl bg-red-600 font-black text-white hover:bg-red-700"
                disabled={busy}
                onClick={() => {
                  setReason("");
                  setModalTarget("selected");
                }}
              >
                <Trash2 className="size-3.5" />
                Discard ({discardable.length})
              </AppButton>
            ) : null}

            {restorable.length > 0 ? (
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl text-xs font-black"
                disabled={busy}
                onClick={() => void restoreRows(restorable)}
              >
                <Undo2 className="size-3.5" />
                Restore ({restorable.length})
              </AppButton>
            ) : null}

            <AppButton
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-red-500/30 text-xs font-black text-red-600 hover:bg-red-500/10"
              disabled={busy}
              onClick={() => setDeleteTarget(selectedRows)}
            >
              <Trash2 className="size-3.5" />
              Delete Permanently ({selected.size})
            </AppButton>

            <AppButton
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl text-xs font-bold text-muted-foreground"
              onClick={clearSelection}
            >
              Clear
            </AppButton>
          </div>
        </div>
      ) : null}

      {/* Main Votes Table */}
      {filtered.length === 0 ? (
        <AppState
          isEmpty
          title={totalVotes === 0 ? "No votes yet" : "No matches found"}
          description={
            totalVotes === 0
              ? "When students vote on the public page, each person appears once with their pick in every category."
              : "Try adjusting your search terms or filter selection."
          }
          fullScreen={false}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/50">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="sticky left-0 top-0 z-40 bg-muted px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all voters"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    className="size-4 cursor-pointer accent-amber-500"
                  />
                </th>
                <th className="sticky top-0 z-20 min-w-48 bg-muted px-3 py-3">
                  Name
                </th>
                <th className="sticky top-0 z-20 min-w-32 bg-muted px-3 py-3">
                  Roll number
                </th>
                {raceColumns.map((column) => (
                  <th
                    key={column.key}
                    className="sticky top-0 z-20 min-w-44 bg-muted px-4 py-3"
                  >
                    {column.label}
                  </th>
                ))}
                <th className="sticky top-0 z-20 min-w-28 bg-muted px-4 py-3">
                  Time
                </th>
                <th className="sticky top-0 z-20 w-28 bg-muted px-4 py-3 text-right">
                  Status
                </th>
                <th className="sticky top-0 z-20 w-44 bg-muted px-4 py-3 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isOdd = Boolean(flags.get(row.key)?.odd);
                const dup = duplicateInfo.get(row.key);
                const isDuplicate = Boolean(dup?.isDuplicate);
                const isSelected = selected.has(row.key);

                return (
                  <tr
                    key={row.key}
                    className={cn(
                      "border-t border-border/40 transition-colors",
                      !row.resolved && !row.discarded && (isOdd || isDuplicate) && "bg-red-500/5",
                      row.resolved && "bg-emerald-500/5",
                      row.discarded && "opacity-60",
                    )}
                  >
                    <td className="sticky left-0 z-40 bg-card px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${row.voterName}`}
                        checked={isSelected}
                        onChange={() => toggleRow(row.key)}
                        className="size-4 cursor-pointer accent-amber-500"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {row.voterSelfieUrl ? (
                          <img
                            src={row.voterSelfieUrl}
                            alt=""
                            className={cn(
                              "size-10 shrink-0 rounded-full object-cover",
                              row.discarded && "grayscale",
                            )}
                          />
                        ) : (
                          <div className="size-10 shrink-0 rounded-full bg-muted" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-bold text-foreground">
                            {row.voterName}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            {row.resolved ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400"
                                title="Teacher verified: valid student"
                              >
                                <CheckCircle2 className="size-2.5" /> Valid
                              </span>
                            ) : null}

                            {!row.resolved && isDuplicate ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400"
                                title={`Duplicate voter name detected: ${dup?.count} ballots with this name (Rolls: ${dup?.otherRolls.join(", ")})`}
                              >
                                <Copy className="size-2.5" /> Duplicate ({dup?.count})
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "font-medium",
                            !row.resolved && isOdd && !row.discarded && "font-black text-red-600",
                          )}
                        >
                          {row.voterRollNumber}
                        </p>
                        {!row.resolved && isOdd && !row.discarded ? (
                          <span
                            title={flags.get(row.key)?.reason ?? "Odd roll number"}
                            className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white"
                          >
                            Odd
                          </span>
                        ) : null}
                      </div>
                    </td>
                    {raceColumns.map((column) => (
                      <td key={column.key} className="px-4 py-3">
                        <CategoryPick
                          vote={row.picks[column.key]}
                          onEdit={() => setEditingVoter(row)}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatVoteTime(row.latestVoteAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.discarded ? (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                          Discarded
                        </span>
                      ) : row.resolved ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Counted (Valid)
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Counted
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {/* Resolve / Unresolve button */}
                        {!row.resolved ? (
                          <button
                            type="button"
                            onClick={() => void resolveRows([row])}
                            className="inline-flex items-center gap-1 rounded-xl border border-emerald-600/30 bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 transition-colors"
                            title={`Resolve ${row.voterName}: Mark as valid`}
                          >
                            <CheckCircle2 className="size-3" />
                            Resolve
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void unresolveRows([row])}
                            className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2 py-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                            title="Undo valid status"
                          >
                            <Undo2 className="size-3" />
                            Unresolve
                          </button>
                        )}

                        {/* Edit ballot button */}
                        <button
                          type="button"
                          onClick={() => setEditingVoter(row)}
                          className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2 py-1 text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
                          title={`Edit votes for ${row.voterName}`}
                        >
                          <Pencil className="size-3" />
                          Edit
                        </button>

                        {/* Discard / Delete button */}
                        {!row.discarded ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSingleTargetRow(row);
                              setReason(
                                isDuplicate
                                  ? "Duplicate voter submission"
                                  : isOdd
                                    ? "Odd / invalid roll number"
                                    : "",
                              );
                              setModalTarget("single");
                            }}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-500/20 transition-colors"
                            title={`Discard votes for ${row.voterName}`}
                          >
                            <Trash2 className="size-3" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget([row])}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-500/20 transition-colors"
                            title={`Permanently delete ballot for ${row.voterName}`}
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Discarded votes audit list */}
      {discardedRows.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border/50">
          <div className="flex flex-wrap items-center gap-2 bg-muted/60 px-4 py-3">
            <Undo2 className="size-4 text-muted-foreground" />
            <p className="text-sm font-black">
              {discardedRows.length} discarded voter
              {discardedRows.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="divide-y divide-border/40">
            {discardedRows.map((row) => {
              const flag = flags.get(row.key);
              const odd = Boolean(flag?.odd);
              return (
                <div key={row.key} className="space-y-2 bg-card/40 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="font-bold">{row.voterName}</p>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {row.voterRollNumber}
                    </span>
                    {odd ? (
                      <span className="text-xs font-black text-red-600 dark:text-red-400">
                        Odd roll number
                      </span>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      • {formatVoteTime(row.latestVoteAt)}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <AppButton
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs font-black"
                        disabled={busy}
                        onClick={() => void restoreRows([row])}
                      >
                        <Undo2 className="size-3" /> Restore
                      </AppButton>
                      <AppButton
                        type="button"
                        size="sm"
                        className="h-8 rounded-lg bg-red-600/10 text-red-600 text-xs font-black hover:bg-red-600/20"
                        disabled={busy}
                        onClick={() => setDeleteTarget([row])}
                      >
                        <Trash2 className="size-3" /> Delete
                      </AppButton>
                    </div>
                  </div>
                  {Object.keys(row.picks).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {Object.values(row.picks).map((vote) => (
                        <span
                          key={vote.id}
                          className="rounded-full bg-muted/70 px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                        >
                          {vote.candidateCategory}: {vote.candidateName}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {odd ? (
                    <div className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/5 px-3 py-2">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                        Flagged as odd: {flag?.reason ?? "Roll number looks suspicious"}
                      </p>
                    </div>
                  ) : null}
                  <div className="flex items-start gap-2 rounded-xl border border-border/50 bg-muted/30 px-3 py-2">
                    <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground">
                      Discard reason: {row.discardedReason || "No reason provided"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Discard Confirmation Modal */}
      {modalTarget ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => {
            setModalTarget(null);
            setSingleTargetRow(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-4xl border-0 bg-card p-5 text-card-foreground shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
              <div className="flex shrink-0 justify-center sm:justify-start">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-red-500/10 shadow-inner">
                  <AlertTriangle className="size-7 text-red-400" />
                </div>
              </div>
              <div className="min-w-0 flex-1 pt-1 text-center sm:pt-0 sm:text-left">
                <h3 className="text-xl font-black text-foreground">
                  Discard{" "}
                  {modalTarget === "single"
                    ? singleTargetRow?.voterName
                    : modalTarget === "flagged"
                      ? `${flaggedKeys.size} flagged ballots`
                      : `${discardable.length} ballot(s)`}
                </h3>
                <p className="mt-1 text-sm font-medium leading-relaxed text-muted-foreground">
                  Provide a reason for discarding. Discarded votes are excluded from
                  election results and tallies.
                </p>

                {/* Preset reasons */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    "Duplicate student ballot",
                    "Invalid roll number",
                    "Selfie did not match student",
                    "Test vote",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReason(preset)}
                      className="rounded-lg bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="e.g. Duplicate vote / selfie did not match"
                  className="mt-3 w-full resize-none rounded-2xl border border-border/50 bg-muted/30 p-3 text-sm font-medium outline-none transition-all focus:border-primary/50"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <AppButton
                type="button"
                variant="outline"
                disabled={busy}
                className="h-12 flex-1 rounded-2xl font-bold"
                onClick={() => {
                  setModalTarget(null);
                  setSingleTargetRow(null);
                }}
              >
                Cancel
              </AppButton>
              <AppButton
                type="button"
                className="h-12 flex-1 rounded-2xl bg-red-600 font-bold text-white shadow-lg hover:bg-red-700"
                disabled={busy || !reason.trim()}
                onClick={() => void runDiscard()}
              >
                {busy ? (
                  <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Discard
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}

      {/* Permanent Delete Modal */}
      {deleteTarget && deleteTarget.length > 0 ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-4xl border border-red-500/30 bg-card p-5 text-card-foreground shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-red-500/15">
                <Trash2 className="size-7 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-black text-foreground">
                  Permanently Delete {deleteTarget.length}{" "}
                  {deleteTarget.length === 1 ? "Ballot" : "Ballots"}?
                </h3>
                <p className="mt-1 text-sm font-medium text-muted-foreground leading-relaxed">
                  This will completely remove these vote records from the database.
                  This action <strong>cannot be undone</strong>.
                </p>

                <div className="mt-3 max-h-32 overflow-y-auto rounded-xl border border-border/50 bg-muted/40 p-2 text-xs">
                  {deleteTarget.map((r) => (
                    <div
                      key={r.key}
                      className="flex justify-between py-1 border-b border-border/30 last:border-0"
                    >
                      <span className="font-bold">{r.voterName}</span>
                      <span className="text-muted-foreground font-medium">
                        Roll: {r.voterRollNumber}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <AppButton
                type="button"
                variant="outline"
                disabled={busy}
                className="h-12 flex-1 rounded-2xl font-bold"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </AppButton>
              <AppButton
                type="button"
                className="h-12 flex-1 rounded-2xl bg-red-600 font-bold text-white shadow-lg hover:bg-red-700"
                disabled={busy}
                onClick={() => void runPermanentDelete()}
              >
                {busy ? (
                  <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Delete Permanently
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Ballot Modal */}
      {editingVoter ? (
        <EditVoterBallotModal
          open={Boolean(editingVoter)}
          voter={editingVoter}
          electionId={electionId}
          raceColumns={raceColumns}
          tallies={payload.tallies}
          onClose={() => setEditingVoter(null)}
          onSuccess={invalidate}
        />
      ) : null}
    </div>
  );
}

function CategoryPick({
  vote,
  onEdit,
}: {
  vote: ElectionVote | undefined;
  onEdit?: () => void;
}) {
  if (!vote) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className="group inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
        title="Click to assign vote"
      >
        <span>—</span>
        <Pencil className="size-2.5 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <div
      onClick={onEdit}
      className={cn(
        "group -m-1 flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg p-1 transition-colors hover:bg-muted/70",
        vote.discardedAt && "opacity-50",
      )}
      title={`Click to edit vote (currently ${vote.candidateName})`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <img
          src={vote.candidateProfileImageUrl}
          alt=""
          className="size-8 shrink-0 rounded-full object-cover"
        />
        <p className="truncate font-bold">{vote.candidateName}</p>
      </div>
      <Pencil className="mr-1 size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}