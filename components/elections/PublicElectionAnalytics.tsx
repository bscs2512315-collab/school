"use client";

import ElectionAnalyticsCharts from "@/components/elections/ElectionAnalyticsCharts";
import AppQueryState from "@/components/AppQueryState";
import { usePublicElectionAnalytics } from "@/hooks/elections/usePublicElectionAnalytics";
import { ElectionStatus } from "@/types/enums";

export default function PublicElectionAnalytics({
  slug,
  status,
}: {
  slug: string;
  status: ElectionStatus;
}) {
  const query = usePublicElectionAnalytics(slug, status);

  return (
    <section className="space-y-4">
      <div className="text-center sm:text-left">
        <h2 className="text-lg font-black tracking-tight">Live results</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Vote counts and share of the total. No voter names are shown.
        </p>
      </div>
      <AppQueryState
        query={query}
        emptyTitle="Results unavailable"
        emptyMessage="Live tallies will appear here once voting begins."
        onRetry={() => void query.refetch()}
      >
        {(analytics) => (
          <ElectionAnalyticsCharts
            analytics={analytics}
            isLive={status === ElectionStatus.LIVE}
          />
        )}
      </AppQueryState>
    </section>
  );
}
