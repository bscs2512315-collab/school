"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, User, X } from "lucide-react";
import AppButton from "@/components/AppButton";
import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiPost } from "@/lib/api/api-client";
import { getRaceKey, type RaceColumn, type VoterBallotRow } from "@/lib/elections/races";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ElectionTally } from "@/types/election";

interface EditVoterBallotModalProps {
  open: boolean;
  voter: VoterBallotRow | null;
  electionId: string;
  raceColumns: RaceColumn[];
  tallies: ElectionTally[];
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export default function EditVoterBallotModal({
  open,
  voter,
  electionId,
  raceColumns,
  tallies,
  onClose,
  onSuccess,
}: EditVoterBallotModalProps) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Group all candidates by raceKey
  const candidatesByRace = useMemo(() => {
    const map = new Map<string, ElectionTally[]>();
    for (const item of tallies) {
      const raceKey = getRaceKey(item.category, item.gender);
      const list = map.get(raceKey);
      if (list) {
        list.push(item);
      } else {
        map.set(raceKey, [item]);
      }
    }
    return map;
  }, [tallies]);

  // Initialize selections from voter picks
  useEffect(() => {
    if (!voter) return;
    const initial: Record<string, string> = {};
    for (const [raceKey, vote] of Object.entries(voter.picks)) {
      if (vote?.candidateId) {
        initial[raceKey] = vote.candidateId;
      }
    }
    setSelections(initial);
  }, [voter]);

  if (!open || !voter) return null;

  // Find which races have been changed
  const changes = raceColumns
    .filter((col) => {
      const originalCandidateId = voter.picks[col.key]?.candidateId || "";
      const currentCandidateId = selections[col.key] || "";
      return (
        currentCandidateId !== "" &&
        currentCandidateId !== originalCandidateId
      );
    })
    .map((col) => ({
      voteId: voter.picks[col.key]?.id,
      raceKey: col.key,
      candidateId: selections[col.key],
    }));

  const hasChanges = changes.length > 0;

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      const res = await apiPost<{ updatedCount?: number }>(
        API_ENDPOINTS.TEACHER.ELECTION_VOTES_EDIT(electionId),
        {
          voterRollNumber: voter.voterRollNumber,
          changes,
        },
      );

      if (!res.success) {
        toast.error(res.message || "Failed to update votes");
        return;
      }

      toast.success(
        `Updated ${changes.length} vote${changes.length === 1 ? "" : "s"} for ${voter.voterName}`,
      );
      await onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update vote");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-[2rem] border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-3">
            {voter.voterSelfieUrl ? (
              <img
                src={voter.voterSelfieUrl}
                alt=""
                className="size-11 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <User className="size-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">
                  Edit Voter Ballot
                </h3>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                  {voter.voterRollNumber}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Voter: <span className="font-bold text-foreground">{voter.voterName}</span>
                {voter.discarded ? (
                  <span className="ml-2 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-600">
                    Discarded
                  </span>
                ) : null}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body: List of Races */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <p className="text-xs text-muted-foreground">
            Reassign candidate votes for this student. The tally will automatically transfer to the new candidate.
          </p>

          <div className="space-y-3">
            {raceColumns.map((col) => {
              const currentPick = voter.picks[col.key];
              const selectedCandidateId = selections[col.key] || "";
              const candidates = candidatesByRace.get(col.key) || [];
              const isChanged =
                selectedCandidateId !== "" &&
                selectedCandidateId !== (currentPick?.candidateId || "");

              const selectedCandidate = candidates.find(
                (c) => c.candidateId === selectedCandidateId,
              );

              return (
                <div
                  key={col.key}
                  className={cn(
                    "rounded-2xl border p-4 transition-all",
                    isChanged
                      ? "border-primary bg-primary/5 shadow-xs"
                      : "border-border/60 bg-card/50",
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-sm font-black tracking-tight">
                      {col.label}
                    </span>
                    {isChanged ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-foreground">
                        <Check className="size-3" /> Changed
                      </span>
                    ) : currentPick ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Original pick: {currentPick.candidateName}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        No vote recorded
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {selectedCandidate ? (
                      <img
                        src={selectedCandidate.profileImageUrl}
                        alt=""
                        className="size-10 shrink-0 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="size-10 shrink-0 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">
                        ?
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <select
                        value={selectedCandidateId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelections((prev) => ({
                            ...prev,
                            [col.key]: val,
                          }));
                        }}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold text-foreground focus:border-primary focus:outline-none transition-colors"
                      >
                        <option value="" disabled>
                          Select candidate...
                        </option>
                        {candidates.map((c) => (
                          <option key={c.candidateId} value={c.candidateId}>
                            {c.candidateName}
                            {c.symbolName ? ` (${c.symbolName})` : ""}
                            {c.candidateId === currentPick?.candidateId
                              ? " — (Voter's pick)"
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {isChanged ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelections((prev) => ({
                            ...prev,
                            [col.key]: currentPick?.candidateId || "",
                          }));
                        }}
                        className="text-xs font-bold text-muted-foreground hover:text-foreground shrink-0 underline"
                      >
                        Reset
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border/50 px-6 py-4">
          <p className="text-xs text-muted-foreground font-medium">
            {hasChanges
              ? `${changes.length} change${changes.length === 1 ? "" : "s"} ready to save`
              : "No changes made yet"}
          </p>
          <div className="flex gap-2">
            <AppButton
              type="button"
              variant="outline"
              className="h-11 rounded-xl px-5 font-bold"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </AppButton>
            <AppButton
              type="button"
              className="h-11 rounded-xl px-6 font-black"
              disabled={!hasChanges || saving}
              onClick={() => void handleSave()}
            >
              {saving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
              Save changes
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
