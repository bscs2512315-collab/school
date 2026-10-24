"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Copy, Vote } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import AppQueryState from "@/components/AppQueryState";
import ConfirmationModal from "@/components/ConfirmationModal";
import CreateElectionModal from "@/components/elections/CreateElectionModal";
import { Typography } from "@/components/ui/Typography";
import AddSVG from "@/public/svgs/AddSVG";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import { API_ENDPOINTS, FRONTEND_ROUTES } from "@/constants/endpoints";
import { apiDelete, apiPost } from "@/lib/api/api-client";
import { formatElectionWindow, getClientErrorMessage } from "@/lib/elections/format";
import { useTeacherElections } from "@/hooks/teacher/useTeacherElections";
import { copyElectionLink } from "@/hooks/elections/useElectionPublicUrl";
import { queryKeys } from "@/lib/api/query-keys";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { ElectionEvent } from "@/types/election";
import { ElectionStatus } from "@/types/enums";

export default function TeacherElectionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const electionsQuery = useTeacherElections();
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [electionToDelete, setElectionToDelete] = useState<ElectionEvent | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const elections = electionsQuery.data ?? [];

  const copyUrl = async (slug: string) => {
    try {
      await copyElectionLink(slug);
      toast.success("Public voting link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleCreate = async (form: FormData) => {
    setCreating(true);
    try {
      const res = await apiPost<ElectionEvent>(API_ENDPOINTS.TEACHER.ELECTIONS, form);
      if (!res.success) {
        toast.error("Failed to create election");
        return;
      }
      toast.success("Election created");
      setModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.teacher.elections() });
      router.push(FRONTEND_ROUTES.TEACHER_ELECTION(res.data.id));
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Failed to create election"));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!electionToDelete) return;
    setDeleting(true);
    try {
      const res = await apiDelete(
        API_ENDPOINTS.TEACHER.ELECTION(electionToDelete.id),
      );
      if (!res.success) {
        toast.error("Failed to delete election");
        return;
      }
      toast.success("Election deleted");
      setElectionToDelete(null);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teacher.elections(),
      });
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Failed to delete election"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Elections"
        actions={
          <AppButton
            type="button"
            className="rounded-xl h-11 sm:h-12 px-6 font-bold shadow-lg shadow-primary/20"
            onClick={() => setModalOpen(true)}
          >
            <AddSVG className="size-4 mr-2" />
            New election
          </AppButton>
        }
      />
      <div className="mb-4">
        <Typography variant="muted" className="text-sm">
          Create a public voting page for school elections. Students do not
          need an ExBoard account — they vote with name, roll number, and a
          live selfie.
        </Typography>
      </div>

      <AppQueryState
        query={electionsQuery}
        isEmpty={(data) => data.length === 0}
        emptyTitle="No elections yet"
        emptyMessage="Create an election event, add candidates, and share the public voting link."
        onRetry={() => void electionsQuery.refetch()}
      >
        {() => (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {elections.map((election) => (
              <div
                key={election.id}
                className="group relative flex h-full min-h-full flex-col overflow-hidden rounded-3xl bg-primary shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/25"
              >
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-primary-dark" />
                  <div className="absolute -top-12 -right-10 size-48 rounded-full bg-primary-foreground/10 blur-3xl transition-colors duration-700 group-hover:bg-primary-foreground/15" />
                  <div className="absolute -bottom-14 -left-10 size-40 rounded-full bg-primary-foreground/5 blur-2xl" />
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 1px 1px, var(--color-primary-foreground) 1px, transparent 0)",
                      backgroundSize: "18px 18px",
                    }}
                  />
                </div>

                <button
                  type="button"
                  className="relative z-10 flex flex-1 flex-col p-5 text-left sm:p-6"
                  onClick={() =>
                    router.push(FRONTEND_ROUTES.TEACHER_ELECTION(election.id))
                  }
                >
                  <div className="mb-4 flex justify-center pt-6 sm:pt-8">
                    {election.logoUrl ? (
                      <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary-foreground/20 bg-white shadow-lg transition-transform duration-500 group-hover:scale-105">
                        <img
                          src={election.logoUrl}
                          alt={election.name}
                          className="max-h-16 max-w-full object-contain sm:max-h-20"
                        />
                      </div>
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur-md sm:size-20 sm:rounded-3xl">
                        <Vote className="size-8 text-primary-foreground" />
                      </div>
                    )}
                    <span className="absolute top-3 right-3 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary-foreground backdrop-blur-md">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          election.status === ElectionStatus.LIVE
                            ? "animate-pulse bg-primary-foreground"
                            : "bg-primary-foreground/50",
                        )}
                      />
                      {statusLabel(election.status)}
                    </span>
                  </div>

                  <p className="line-clamp-2 break-words text-xl font-bold leading-tight tracking-tight text-primary-foreground sm:text-2xl sm:font-black">
                    {election.name}
                  </p>
                  <p className="mt-1 text-xs font-medium text-primary-foreground/70">
                    {formatElectionWindow(election.startsAt, election.endsAt)}
                  </p>

                  <div className="mb-auto mt-5 grid grid-cols-2 gap-3">
                    <div className="relative overflow-hidden rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-3.5 backdrop-blur-md sm:p-4">
                      <Vote className="absolute -top-1 -right-1 size-11 text-primary-foreground/25 sm:size-12" />
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70">
                        Candidates
                      </span>
                      <span className="mt-0.5 block text-lg font-black text-primary-foreground">
                        {election.candidateCount}
                      </span>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-3.5 backdrop-blur-md sm:p-4">
                      <BarChart3 className="absolute -top-1 -right-1 size-11 text-primary-foreground/25 sm:size-12" />
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70">
                        Votes
                      </span>
                      <span className="mt-0.5 block text-lg font-black text-primary-foreground">
                        {election.voteCount}
                      </span>
                    </div>
                  </div>
                </button>

                <div className="relative z-10 grid grid-cols-2 gap-2 border-t border-primary-foreground/15 p-3">
                    <AppButton
                      type="button"
                      variant="ghost"
                      className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 text-xs font-bold text-primary-foreground backdrop-blur-md hover:bg-primary-foreground/20 hover:text-primary-foreground"
                      onClick={() => void copyUrl(election.slug)}
                    >
                      <Copy className="size-4" />
                      Copy Link
                    </AppButton>
                    <AppButton
                      type="button"
                      variant="ghost"
                      className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/80 text-xs font-bold text-destructive-foreground backdrop-blur-md hover:bg-destructive"
                      onClick={() => setElectionToDelete(election)}
                    >
                      <DeleteSVG className="size-4" />
                      Delete
                    </AppButton>
                  </div>
              </div>
            ))}
          </div>
        )}
      </AppQueryState>

      <CreateElectionModal
        open={modalOpen}
        creating={creating}
        onClose={() => setModalOpen(false)}
        onSubmit={(form) => void handleCreate(form)}
      />

      <ConfirmationModal
        isOpen={electionToDelete !== null}
        onClose={() => setElectionToDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Delete election?"
        message={
          electionToDelete
            ? `${electionToDelete.name} and its public voting page, candidates, and votes will be permanently removed.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </PageContainer>
  );
}

const STATUS_LABELS: Record<ElectionStatus, string> = {
  [ElectionStatus.UPCOMING]: "Upcoming",
  [ElectionStatus.LIVE]: "Live",
  [ElectionStatus.ENDED]: "Ended",
};

function statusLabel(status: ElectionStatus): string {
  return STATUS_LABELS[status];
}
