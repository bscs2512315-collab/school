"use client";

import PageContainer from "@/components/PageContainer";
import { Typography } from "@/components/ui/Typography";
import { Settings, User, Shield, Grid, Activity, Award, Flame, Zap } from "lucide-react";
import TrophySVG from "@/public/svgs/TrophySVG";
import Link from "next/link";
import Image from "next/image";
import AppLoader from "@/components/AppLoader";
import { cn } from "@/lib/utils";
import { useStoredUser } from "@/hooks/useStoredUser";
import { useUserById } from "@/hooks/user/useUserProfile";
import { FRONTEND_ROUTES } from "@/constants/endpoints";

export default function AdminAccountPage() {
  const { user, isReady } = useStoredUser();
  const profileQuery = useUserById(user?.id);

  const profileData = profileQuery.data as {
    name?: string;
    username?: string;
    profileImage?: string;
    city?: string;
    schoolName?: string;
    points?: number;
    followersCount?: number;
    followingCount?: number;
  } | null;

  const isLoading = !isReady || (Boolean(user?.id) && profileQuery.isLoading);

  if (isLoading) {
    return (
      <PageContainer>
        <AppLoader />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20">
          <Typography className="text-xl">User not found. Please log in again.</Typography>
        </div>
      </PageContainer>
    );
  }

  const achievements = [
    { title: "First Blood", description: "Complete your first challenge", icon: Flame, color: "text-red-500", bg: "bg-red-500/10" },
    { title: "Top 10%", description: "Reach the top 10% on the leaderboard", icon: TrophySVG, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Knowledge Seeker", description: "Complete 5 past papers", icon: Award, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Fast Learner", description: "Score 100 points in a day", icon: Zap, color: "text-primary", bg: "bg-primary/10" },
    { title: "Social Butterfly", description: "Follow 5 friends", icon: User, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Elite Rank", description: "Achieve the elite rank class", icon: Shield, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <PageContainer>
      <div className="relative mb-8 flex flex-col items-center overflow-hidden rounded-3xl border border-border/60 bg-card p-5 text-center shadow-lg shadow-black/5 sm:rounded-[3rem] sm:p-8 md:p-12">
        <div className="absolute left-0 top-0 z-0 h-32 w-full bg-linear-to-r from-primary/20 via-primary/5 to-transparent" />

        <div className="relative z-10 mb-2 flex w-full justify-end sm:mb-4">
          <Link href={FRONTEND_ROUTES.ADMIN_SETTINGS}>
            <button className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground shadow-md transition-all duration-300 hover:bg-primary hover:text-background">
              <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </Link>
        </div>

        <div className="relative z-10 mb-6">
          {profileData?.profileImage || user.profileImage ? (
            <div className="h-28 w-28 sm:h-32 sm:w-32 overflow-hidden rounded-full border-4 border-background bg-linear-to-tr from-primary to-purple-500 p-1 shadow-xl">
              <Image
                src={profileData?.profileImage || user.profileImage || ""}
                alt={user.name}
                width={128}
                height={128}
                className="h-full w-full rounded-full border-4 border-background object-cover"
              />
            </div>
          ) : (
            <div className="flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full border-4 border-background bg-linear-to-tr from-primary to-purple-500 p-1 shadow-xl">
              <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-background bg-muted text-muted-foreground">
                <User className="h-10 w-10 sm:h-12 sm:w-12" />
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 mb-6 sm:mb-8 space-y-2">
          <Typography className="text-2xl sm:text-3xl font-black tracking-tight">
            {profileData?.name || user.name}
          </Typography>
          <Typography variant="muted" className="text-xs sm:text-sm font-bold uppercase tracking-wide">
            {profileData?.username ? `@${profileData.username}` : user.role}
          </Typography>
          {profileData?.city ? (
            <Typography variant="muted" className="text-xs">
              {profileData.city} • {profileData.schoolName || "No School"}
            </Typography>
          ) : null}
        </div>

        <div className="relative z-10 mb-4 grid w-full max-w-lg grid-cols-3 gap-2 border-t border-border/40 pt-6 sm:gap-4 sm:pt-8">
          <div className="flex flex-col items-center justify-center">
            <Typography className="text-xl sm:text-2xl font-black">
              {profileData?.points ?? 0}
            </Typography>
            <Typography variant="muted" className="mt-1 text-[10px] font-black uppercase tracking-widest">
              Points
            </Typography>
          </div>
          <div className="flex flex-col items-center justify-center border-l border-r border-border/40">
            <Typography className="text-xl sm:text-2xl font-black">{profileData?.followersCount ?? 0}</Typography>
            <Typography variant="muted" className="mt-1 text-[10px] font-black uppercase tracking-widest">
              Followers
            </Typography>
          </div>
          <div className="flex flex-col items-center justify-center">
            <Typography className="text-xl sm:text-2xl font-black">{profileData?.followingCount ?? 0}</Typography>
            <Typography variant="muted" className="mt-1 text-[10px] font-black uppercase tracking-widest">
              Following
            </Typography>
          </div>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8">
        <div className="mb-6 sm:mb-8 flex items-center justify-center gap-6 sm:gap-12 border-b border-border/40 pb-4">
          <button className="flex flex-col items-center gap-2 text-primary">
            <Grid size={24} />
            <span className="mt-1 h-1 w-8 rounded-full bg-primary text-[10px] font-black uppercase tracking-widest" />
          </button>
          <button className="flex flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
            <Activity size={24} />
            <span className="mt-1 h-1 w-8 rounded-full bg-transparent text-[10px] font-black uppercase tracking-widest" />
          </button>
          <button className="flex flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
            <Award size={24} />
            <span className="mt-1 h-1 w-8 rounded-full bg-transparent text-[10px] font-black uppercase tracking-widest" />
          </button>
        </div>

        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {achievements.map((item, idx) => (
            <div
              key={idx}
              className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-4 sm:p-6 text-center shadow-md transition-all duration-300 hover:border-primary/30 hover:shadow-xl"
            >
              <div
                className={cn(
                  "mb-4 flex h-14 w-14 sm:h-16 sm:w-16 flex-col items-center justify-center rounded-2xl transition-transform group-hover:rotate-6 group-hover:scale-110",
                  item.bg,
                  item.color,
                )}
              >
                <item.icon size={28} className="sm:h-8 sm:w-8" />
              </div>
              <Typography className="mb-2 text-sm font-black tracking-tight">{item.title}</Typography>
              <Typography
                variant="muted"
                className="text-center text-[10px] font-bold uppercase leading-relaxed opacity-70 transition-opacity group-hover:opacity-100"
              >
                {item.description}
              </Typography>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
