"use client";

import { useMemo, useState } from "react";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppState from "@/components/AppState";
import AppTabs from "@/components/AppTabs";
import AppQueryState from "@/components/AppQueryState";
import LeaderboardView, { LeaderboardEntry } from "@/components/LeaderboardView";
import SchoolLeaderboardView from "@/components/leaderboard/SchoolLeaderboardView";
import { Board, Class, LeaderboardTab } from "@/types/enums";
import { useLeaderboard, useSchoolLeaderboard } from "@/hooks/useLeaderboard";
import { useStoredUser } from "@/hooks/useStoredUser";
import type { LeaderboardSchool, LeaderboardUser } from "@/types/leaderboard";
import ChallengeSVG from "@/public/svgs/ChallengeSVG";
import BuildingSVG from "@/public/svgs/BuildingSVG";

const CITY_OPTIONS = ["All Cities", "Karachi", "Lahore", "Islamabad"];
const ALL_CLASSES = "All Classes";
const ALL_BOARDS = "All Boards";

export default function TeacherLeaderboardPage() {
  const { user } = useStoredUser();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>(LeaderboardTab.STUDENTS);
  const isSchoolsTab = activeTab === LeaderboardTab.SCHOOLS;

  const [userCity, setUserCity] = useState<string>("All Cities");
  const [userClass, setUserClass] = useState<string>(ALL_CLASSES);
  const [userBoard, setUserBoard] = useState<string>(ALL_BOARDS);

  const filterParams = useMemo(() => {
    const params: Record<string, string> = { type: "country" };

    if (userCity !== "All Cities") {
      params.city = userCity;
    }
    if (userClass && userClass !== ALL_CLASSES) {
      params.class = userClass;
    }
    if (userBoard && userBoard !== ALL_BOARDS) {
      params.board = userBoard;
    }

    return params;
  }, [userBoard, userCity, userClass]);

  const leaderboardQuery = useLeaderboard(filterParams, { enabled: !isSchoolsTab });
  const schoolLeaderboardQuery = useSchoolLeaderboard(filterParams, { enabled: isSchoolsTab });
  const activeQuery = isSchoolsTab ? schoolLeaderboardQuery : leaderboardQuery;

  const users: LeaderboardEntry[] = useMemo(() => {
    return (leaderboardQuery.data ?? []).map((entry) => ({
      id: entry.id,
      name: entry.name,
      username: entry.username ?? `@${entry.name.toLowerCase().replace(/\s/g, "_")}`,
      points: entry.points,
      profilePic: entry.profilePicture ?? undefined,
      schoolName: entry.schoolName ?? null,
      schoolLogo: entry.schoolLogo ?? null,
      classLevel: entry.class ?? null,
    }));
  }, [leaderboardQuery.data]);

  const schools = schoolLeaderboardQuery.data ?? [];

  const hasActiveFilters =
    userCity !== "All Cities" ||
    userClass !== ALL_CLASSES ||
    userBoard !== ALL_BOARDS;

  const handleClearFilters = () => {
    setUserCity("All Cities");
    setUserClass(ALL_CLASSES);
    setUserBoard(ALL_BOARDS);
  };

  const filterDropdowns = [
    {
      id: "board-filter",
      label: "Board",
      value: userBoard,
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setUserBoard(e.target.value),
      options: [
        { value: ALL_BOARDS, label: ALL_BOARDS },
        ...Object.values(Board).map((board) => ({
          value: board,
          label: board,
        })),
      ],
    },
    {
      id: "city-filter",
      label: "City",
      value: userCity,
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setUserCity(e.target.value),
      options: CITY_OPTIONS.map((city) => ({
        value: city,
        label: city,
      })),
    },
    {
      id: "class-filter",
      label: "Class",
      value: userClass,
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setUserClass(e.target.value),
      options: [
        { value: ALL_CLASSES, label: ALL_CLASSES },
        ...Object.values(Class).map((cls) => ({
          value: cls,
          label: `Class ${cls}`,
        })),
      ],
    },
  ];

  return (
    <PageContainer className="flex min-h-[calc(100dvh-4.5rem)] min-w-0 flex-col">
      <PageHeader
        title="Leaderboard"
        description="Track top student achievements and school rankings across the board."
        showLine={true}
        showWatermark={!activeQuery.isLoading}
      />

      <div className="mb-8">
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
        className="flex min-h-0 flex-1 items-center justify-center"
      >
        {() =>
          isSchoolsTab ? (
            <AppState
              isEmpty={schools.length === 0}
              title="Competition Initializing"
              description="The school leaderboard is being refreshed with latest performance data."
              fullScreen={false}
            >
              <SchoolLeaderboardView
                schools={schools}
                showFullRankings
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
                filterDropdowns={filterDropdowns}
              />
            </AppState>
          ) : (
            <AppState
              isEmpty={users.length === 0}
              title="Competition Initializing"
              description="The leaderboard is being refreshed with latest performance data."
              fullScreen={false}
            >
              <LeaderboardView
                users={users}
                currentUserId={user?.id}
                showFullRankings
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
                filterDropdowns={filterDropdowns}
              />
            </AppState>
          )
        }
      </AppQueryState>

      <div className="pb-10" />
    </PageContainer>
  );
}
