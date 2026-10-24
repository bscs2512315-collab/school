"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import AppQueryState from "@/components/AppQueryState";
import ElectionAnalyticsCharts from "@/components/elections/ElectionAnalyticsCharts";
import ElectionLogo from "@/components/elections/ElectionLogo";
import ElectionStatusBadge from "@/components/elections/ElectionStatusBadge";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { formatElectionWindow } from "@/lib/elections/format";
import { copyElectionLink } from "@/hooks/elections/useElectionPublicUrl";
import {
  useTeacherElection,
  useTeacherElectionAnalytics,
} from "@/hooks/teacher/useTeacherElections";
import { ElectionStatus } from "@/types/enums";
import toast from "react-hot-toast";

export default function TeacherElectionAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const electionQuery = useTeacherElection(id);
  const analyticsQuery = useTeacherElectionAnalytics(
    id,
    electionQuery.data?.status,
  );

  const copyUrl = async (slug: string) => {
    try {
      await copyElectionLink(slug);
      toast.success("Public voting link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={electionQuery.data?.name || "Live analytics"}
        onBack={() => router.push(FRONTEND_ROUTES.TEACHER_ELECTION(id))}
      />

      <AppQueryState
        query={electionQuery}
        emptyTitle="Election not found"
        emptyMessage="This election may have been deleted."
        onRetry={() => void electionQuery.refetch()}
      >
        {(election) => (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-card/40 p-5 sm:flex-row sm:items-center">
              {election.logoUrl ? (
                <ElectionLogo src={election.logoUrl} alt={election.name} />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-xs font-black text-primary">
                  Logo
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-black">{election.name}</h1>
                  <ElectionStatusBadge status={election.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatElectionWindow(election.startsAt, election.endsAt)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Live vote counts and percentages. Voter names stay on the
                  Votes tab.
                </p>
              </div>
              <AppButton
                type="button"
                variant="outline"
                className="h-11 rounded-2xl"
                onClick={() => void copyUrl(election.slug)}
              >
                <Copy className="size-4" />
                Copy voting link
              </AppButton>
            </div>

            <AppQueryState
              query={analyticsQuery}
              emptyTitle="No analytics yet"
              emptyMessage="Add candidates to start tracking live results."
              onRetry={() => void analyticsQuery.refetch()}
            >
              {(analytics) => (
                <ElectionAnalyticsCharts
                  analytics={analytics}
                  isLive={election.status === ElectionStatus.LIVE}
                />
              )}
            </AppQueryState>
          </div>
        )}
      </AppQueryState>
    </PageContainer>
  );
}
