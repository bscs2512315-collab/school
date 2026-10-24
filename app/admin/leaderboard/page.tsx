"use client";

import { useMemo, useState } from "react";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import { Filter } from "lucide-react";
import AppState from "@/components/AppState";
import AppTabs from "@/components/AppTabs";
import AppQueryState from "@/components/AppQueryState";
import LeaderboardView, { LeaderboardEntry } from "@/components/LeaderboardView";
import SchoolLeaderboardView from "@/components/leaderboard/SchoolLeaderboardView";
import FilterDrawer from "@/components/FilterDrawer";
import { Board, Class, LeaderboardTab } from "@/types/enums";
import { useLeaderboard, useSchoolLeaderboard } from "@/hooks/useLeaderboard";
import ChallengeSVG from "@/public/svgs/ChallengeSVG";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import type { LeaderboardSchool, LeaderboardUser } from "@/types/leaderboard";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>(LeaderboardTab.STUDENTS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const isSchoolsTab = activeTab === LeaderboardTab.SCHOOLS;
  const [board, setBoard] = useState("");
  const [city, setCity] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const filters = useMemo(() => ({
    type: "country",
    ...(board && { board }),
    ...(city && { city }),
    ...(studentClass && { class: studentClass }),
  }), [board, city, studentClass]);

  const leaderboardQuery = useLeaderboard(filters, { enabled: !isSchoolsTab });
  const schoolLeaderboardQuery = useSchoolLeaderboard(filters, { enabled: isSchoolsTab });
  const activeQuery = isSchoolsTab ? schoolLeaderboardQuery : leaderboardQuery;

  const leaderboard: LeaderboardEntry[] = useMemo(() => {
    return (leaderboardQuery.data ?? []).map((entry) => ({
      id: entry.id,
      name: entry.name,
      username: `@${entry.name.toLowerCase().replace(/\s/g, "_")}`,
      points: entry.points,
      profilePic: entry.profilePicture ?? undefined,
      schoolName: entry.schoolName ?? null,
      schoolLogo: entry.schoolLogo ?? null,
      classLevel: entry.class ?? null,
    }));
  }, [leaderboardQuery.data]);

  const schools = schoolLeaderboardQuery.data ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Performance Analytics"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="flex size-10 items-center justify-center rounded-2xl border border-border/40 bg-card text-foreground transition-all hover:bg-muted sm:size-12"
            >
              <Filter size={20} />
            </button>
          </div>
        }
      />

      <FilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)}>
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Filter by Board
            </h3>
            <select value={board} onChange={(event) => setBoard(event.target.value)} className="w-full appearance-none rounded-xl border border-border/50 bg-card px-4 py-3 font-medium focus:outline-hidden focus:ring-2 focus:ring-primary/50">
              <option value="">All Boards</option>
              {Object.values(Board).map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Filter by City
            </h3>
            <select value={city} onChange={(event) => setCity(event.target.value)} className="w-full appearance-none rounded-xl border border-border/50 bg-card px-4 py-3 font-medium focus:outline-hidden focus:ring-2 focus:ring-primary/50">
              <option value="">All Cities</option>
              {(["Karachi", "Lahore", "Islamabad"]).map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Filter by Class
            </h3>
            <select value={studentClass} onChange={(event) => setStudentClass(event.target.value)} className="w-full appearance-none rounded-xl border border-border/50 bg-card px-4 py-3 font-medium focus:outline-hidden focus:ring-2 focus:ring-primary/50">
              <option value="">All Classes</option>
              {Object.values(Class).map((value) => <option key={value} value={value}>Class {value}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setIsFilterOpen(false)}
            className="mt-4 w-full rounded-2xl bg-primary py-3 font-black text-primary-foreground transition-all hover:shadow-lg"
          >
            Done
          </button>
          <button type="button" onClick={() => { setBoard(""); setCity(""); setStudentClass(""); }} className="w-full rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground">
            Clear Filters
          </button>
        </div>
      </FilterDrawer>

      <div className="mb-8 mt-4 w-full sm:max-w-md">
        <AppTabs
          fullWidth
          className="w-full sm:w-fit"
          tabs={[
            { label: "Students", value: LeaderboardTab.STUDENTS, icon: ChallengeSVG },
            { label: "Schools", value: LeaderboardTab.SCHOOLS, icon: BuildingSVG },
          ]}
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as LeaderboardTab)}
        />
      </div>

      <AppQueryState<LeaderboardUser[] | LeaderboardSchool[]>
        query={activeQuery}
        loadingMessage="Loading leaderboard..."
        errorMessage="Failed to load leaderboard."
        onRetry={() => activeQuery.refetch()}
        fullScreen={false}
      >
        {() =>
          isSchoolsTab ? (
            <AppState
              isEmpty={schools.length === 0}
              title="No Records Available"
              description="There are currently no school performance records to display."
              fullScreen={false}
            >
              <SchoolLeaderboardView
                schools={schools}
                showFullRankings
                emptyTitle="No Records Available"
                emptyDescription="There are currently no school performance records to display."
              />
            </AppState>
          ) : (
            <AppState
              isEmpty={leaderboard.length === 0}
              title="No Records Available"
              description="There are currently no performance records to display."
              fullScreen={false}
            >
              <LeaderboardView
                users={leaderboard}
                showFullRankings
                emptyTitle="No Records Available"
                emptyDescription="There are currently no performance records to display."
              />
            </AppState>
          )
        }
      </AppQueryState>

      <div className="pb-20" />
    </PageContainer>
  );
}
