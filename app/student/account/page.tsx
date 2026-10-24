"use client";

import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import { Typography } from "@/components/ui/Typography";
import TrophySVG from "@/public/svgs/TrophySVG";
import LeaderboardSVG from "@/public/svgs/LeaderboardSVG";
import HistorySVG from "@/public/svgs/HistorySVG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import StarSVG from "@/public/svgs/StarSVG";
import ZapSVG from "@/public/svgs/ZapSVG";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import SecureExamSVG from "@/public/svgs/SecureExamSVG";
import CrownSVG from "@/public/svgs/CrownSVG";
import HeartSVG from "@/public/svgs/HeartSVG";
import MedalSVG from "@/public/svgs/MedalSVG";
import AppLoader from "@/components/AppLoader";
import { cn } from "@/lib/utils";
import NoviceSVG from "@/public/svgs/NoviceSVG";
import ApprenticeSVG from "@/public/svgs/ApprenticeSVG";
import ScholarSVG from "@/public/svgs/ScholarSVG";
import WarriorSVG from "@/public/svgs/WarriorSVG";
import KnightSVG from "@/public/svgs/KnightSVG";
import HeroSVG from "@/public/svgs/HeroSVG";
import ChampionSVG from "@/public/svgs/ChampionSVG";
import MasterSVG from "@/public/svgs/MasterSVG";
import GrandmasterSVG from "@/public/svgs/GrandmasterSVG";
import EliteSVG from "@/public/svgs/EliteSVG";
import LegendSVG from "@/public/svgs/LegendSVG";
import MythicSVG from "@/public/svgs/MythicSVG";
import AccountHeader from "./components/AccountHeader";
import AchievementsList from "./components/AchievementsList";
import PerformanceStats from "./components/PerformanceStats";
import ActivityList from "./components/ActivityList";
import AcademicDetailsCard from "./components/AcademicDetailsCard";
import MilestoneDetailsModal from "./components/MilestoneDetailsModal";
import { useStoredUser } from "@/hooks/useStoredUser";
import { useUserById } from "@/hooks/user/useUserProfile";
import { useStudentMilestones } from "@/hooks/student/useStudentMilestones";
import { useStudentBadges } from "@/hooks/student/useStudentBadges";
import { useStudentHistory } from "@/hooks/student/useStudentHistory";
import type { StudentMilestone } from "@/types/student";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Star: StarSVG,
  Flame: ZapSVG,
  BookOpen: BookOpenSVG,
  Trophy: TrophySVG,
  Shield: SecureExamSVG,
  Crown: CrownSVG,
  Zap: ZapSVG,
  Heart: HeartSVG,
  Award: MedalSVG,
};

const rankBadgeMap: Record<string, typeof NoviceSVG> = {
  Novice: NoviceSVG,
  Apprentice: ApprenticeSVG,
  Scholar: ScholarSVG,
  Warrior: WarriorSVG,
  Knight: KnightSVG,
  Hero: HeroSVG,
  Champion: ChampionSVG,
  Master: MasterSVG,
  Grandmaster: GrandmasterSVG,
  Elite: EliteSVG,
  Legend: LegendSVG,
  Mythic: MythicSVG,
};

enum StudentAccountTab {
  JOURNEY = "journey",
  PERFORMANCE = "performance",
  ACTIVITY = "activity",
  ACADEMIC = "academic",
}

export default function AccountPage() {
  const { user, isReady } = useStoredUser();
  const profileQuery = useUserById(user?.id);
  const milestonesQuery = useStudentMilestones();
  const badgesQuery = useStudentBadges();
  const historyQuery = useStudentHistory({ limit: 30 });

  const [activeTab, setActiveTab] = useState<StudentAccountTab>(StudentAccountTab.JOURNEY);
  const [selectedMilestone, setSelectedMilestone] = useState<StudentMilestone | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);

  const milestones = milestonesQuery.data ?? [];
  const history = historyQuery.data ?? [];
  const profileData = profileQuery.data ?? null;

  const badgesData = badgesQuery.data;
  const performanceBadges =
    badgesData && "performanceBadges" in badgesData
      ? badgesData.performanceBadges
      : Array.isArray(badgesData)
      ? badgesData
      : [];

  const periodicHonors =
    badgesData && "periodicHonors" in badgesData ? badgesData.periodicHonors : [];

  const activeRaces =
    badgesData && "activeRaces" in badgesData ? badgesData.activeRaces : [];

  const isLoading =
    !isReady || (Boolean(user?.id) && profileQuery.isLoading) || milestonesQuery.isLoading;

  const handleMilestoneClick = (milestone: StudentMilestone) => {
    setSelectedMilestone(milestone);
    setIsMilestoneModalOpen(true);
  };

  if (isLoading) {
    return (
      <PageContainer className="p-0">
        <div className="flex min-h-[60vh] items-center justify-center">
          <AppLoader />
        </div>
      </PageContainer>
    );
  }

  const unlockedMilestonesCount = milestones.filter((m) => m.unlocked).length;
  const unlockedBadgesCount =
    performanceBadges.filter((b) => b.unlocked).length +
    periodicHonors.filter((p) => p.unlocked).length;

  const totalBadgesCount =
    (performanceBadges.length || 6) + (periodicHonors.length || 3);

  const tabs = [
    {
      key: StudentAccountTab.JOURNEY,
      label: "Ranks & Journey",
      icon: TrophySVG,
      badge: `${unlockedMilestonesCount + unlockedBadgesCount}/${(milestones.length || 12) + totalBadgesCount}`,
    },
    {
      key: StudentAccountTab.PERFORMANCE,
      label: "Performance",
      icon: LeaderboardSVG,
    },
    {
      key: StudentAccountTab.ACTIVITY,
      label: "Practice History",
      icon: HistorySVG,
      badge: history.length > 0 ? history.length.toString() : undefined,
    },
    {
      key: StudentAccountTab.ACADEMIC,
      label: "Academic Profile",
      icon: ClassroomSVG,
    },
  ];

  return (
    <PageContainer className="p-0 pb-16 space-y-0 sm:space-y-6 sm:px-6 sm:pt-4 sm:pb-16 lg:px-8 lg:pt-6 lg:pb-16">
      {user ? (
        <>
          <AccountHeader
            user={user}
            profileData={profileData}
            milestones={milestones}
            badges={performanceBadges}
            periodicHonors={periodicHonors}
            rankBadgeMap={rankBadgeMap}
            onMilestoneClick={handleMilestoneClick}
          />

          <div className="relative z-20 -mt-6 w-full px-4 sm:px-0">
            {/* Tab Navigation */}
            <div className="inline-flex max-w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-border/80 bg-card p-1.5 shadow-sm scrollbar-none snap-x mb-6">
              {tabs.map(({ key, label, icon: TabIcon, badge }) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={cn(
                      "flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer",
                      {
                        "bg-primary text-primary-foreground shadow-sm": isActive,
                        "text-muted-foreground hover:bg-muted/70 hover:text-foreground":
                          !isActive,
                      },
                    )}
                  >
                    <TabIcon className="size-4 shrink-0" />
                    <span>{label}</span>
                    {badge ? (
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-black leading-none",
                          {
                            "bg-primary-foreground/20 text-primary-foreground": isActive,
                            "bg-muted text-muted-foreground": !isActive,
                          },
                        )}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in-50 duration-300">
              {activeTab === StudentAccountTab.JOURNEY && (
                <AchievementsList
                  milestones={milestones}
                  badges={performanceBadges}
                  periodicHonors={periodicHonors}
                  activeRaces={activeRaces}
                  rankBadgeMap={rankBadgeMap}
                  iconMap={iconMap}
                  onMilestoneClick={handleMilestoneClick}
                />
              )}

              {activeTab === StudentAccountTab.PERFORMANCE && (
                <PerformanceStats
                  profileData={profileData}
                  milestones={milestones}
                  history={history}
                />
              )}

              {activeTab === StudentAccountTab.ACTIVITY && (
                <ActivityList history={history} />
              )}

              {activeTab === StudentAccountTab.ACADEMIC && (
                <AcademicDetailsCard user={user} profileData={profileData} />
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Typography className="text-xl font-bold">User session not found.</Typography>
          <Typography variant="muted" className="mt-1 text-sm">
            Please log in again to view your profile and achievements.
          </Typography>
        </div>
      )}

      <MilestoneDetailsModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        milestone={selectedMilestone}
        rankBadgeMap={rankBadgeMap}
        iconMap={iconMap}
      />
    </PageContainer>
  );
}
