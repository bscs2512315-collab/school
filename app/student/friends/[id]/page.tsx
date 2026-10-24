"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { usePageTitle } from "@/components/layout/PageTitleContext";
import PageContainer from "@/components/PageContainer";
import AppLoader from "@/components/AppLoader";
import AppState from "@/components/AppState";
import { cn } from "@/lib/utils";

// SVGs
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

// Components from student account
import AccountHeader from "@/app/student/account/components/AccountHeader";
import AchievementsList from "@/app/student/account/components/AchievementsList";
import PerformanceStats from "@/app/student/account/components/PerformanceStats";
import ActivityList from "@/app/student/account/components/ActivityList";
import AcademicDetailsCard from "@/app/student/account/components/AcademicDetailsCard";
import MilestoneDetailsModal from "@/app/student/account/components/MilestoneDetailsModal";

// Hooks
import { useStoredUser } from "@/hooks/useStoredUser";
import { useUserById } from "@/hooks/user/useUserProfile";
import { useStudentMilestones } from "@/hooks/student/useStudentMilestones";
import { useStudentHistory } from "@/hooks/student/useStudentHistory";
import type { StudentMilestone } from "@/types/student";

const iconMap: Record<string, any> = {
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

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const { user: currentUser, isReady } = useStoredUser();
  const profileQuery = useUserById(userId);
  const milestonesQuery = useStudentMilestones();
  const historyQuery = useStudentHistory({ limit: 30 });

  const pageTitleContext = usePageTitle();
  const setPageTitle = pageTitleContext?.setPageTitle;
  const setMobileTitle = pageTitleContext?.setMobileTitle;

  const [activeTab, setActiveTab] = useState<StudentAccountTab>(StudentAccountTab.JOURNEY);
  const [selectedMilestone, setSelectedMilestone] = useState<StudentMilestone | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);

  const profile = profileQuery.data ?? null;
  const isOwnProfile = profile?.isOwnProfile ?? (currentUser?.id === userId);
  const userPoints = profile?.points ?? 0;

  useEffect(() => {
    const rawName = (isOwnProfile ? currentUser?.name : profile?.name) || profile?.name;
    if (rawName && rawName.trim()) {
      const firstName = rawName.trim().split(/\s+/)[0];
      setPageTitle?.(firstName);
      setMobileTitle?.(firstName);
    } else {
      setPageTitle?.("Profile");
      setMobileTitle?.("Profile");
    }

    return () => {
      setPageTitle?.(null);
      setMobileTitle?.(null);
    };
  }, [profile?.name, currentUser?.name, isOwnProfile, setPageTitle, setMobileTitle]);

  const mappedMilestones: StudentMilestone[] = (milestonesQuery.data ?? []).map((m) => ({
    ...m,
    unlocked: userPoints >= m.points_required,
    progress: Math.min(
      100,
      Math.round((userPoints / (m.points_required || 1)) * 100),
    ).toString(),
  }));

  const history = historyQuery.data ?? [];
  const isLoading = !isReady || profileQuery.isLoading || milestonesQuery.isLoading;

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

  if (!profile) {
    return (
      <PageContainer>
        <AppState
          variant="error"
          title="User Not Found"
          description="This user doesn't exist or has been removed."
          fullScreen={false}
        />
      </PageContainer>
    );
  }

  const unlockedCount = mappedMilestones.filter((m) => m.unlocked).length;

  const tabs = isOwnProfile
    ? [
        {
          key: StudentAccountTab.JOURNEY,
          label: "Ranks & Journey",
          icon: TrophySVG,
          badge: `${unlockedCount}/${mappedMilestones.length || 12}`,
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
      ]
    : [
        {
          key: StudentAccountTab.JOURNEY,
          label: "Ranks & Journey",
          icon: TrophySVG,
          badge: `${unlockedCount}/${mappedMilestones.length || 12}`,
        },
      ];

  return (
    <PageContainer className="p-0 pb-16 space-y-0 sm:space-y-6 sm:px-6 sm:pt-4 sm:pb-16 lg:px-8 lg:pt-6 lg:pb-16">
      <AccountHeader
        user={isOwnProfile ? currentUser : profile}
        profileData={profile}
        milestones={mappedMilestones}
        rankBadgeMap={rankBadgeMap}
        isOwnProfile={isOwnProfile}
        onMilestoneClick={handleMilestoneClick}
      />

      <div className={cn("relative z-20 w-full px-4 sm:px-0", tabs.length > 1 ? "-mt-6" : "mt-6 sm:mt-8")}>
        {/* Tab Navigation - Only shown if more than 1 tab */}
        {tabs.length > 1 && (
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
        )}

        {/* Tab Content */}
        <div className="animate-in fade-in-50 duration-300">
          {activeTab === StudentAccountTab.JOURNEY && (
            <AchievementsList
              milestones={mappedMilestones}
              rankBadgeMap={rankBadgeMap}
              iconMap={iconMap}
              onMilestoneClick={handleMilestoneClick}
            />
          )}

          {isOwnProfile && activeTab === StudentAccountTab.PERFORMANCE && (
            <PerformanceStats
              profileData={profile}
              milestones={mappedMilestones}
              history={history}
            />
          )}

          {isOwnProfile && activeTab === StudentAccountTab.ACTIVITY && (
            <ActivityList history={history} />
          )}

          {isOwnProfile && activeTab === StudentAccountTab.ACADEMIC && (
            <AcademicDetailsCard user={currentUser ?? profile} profileData={profile} />
          )}
        </div>
      </div>

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
