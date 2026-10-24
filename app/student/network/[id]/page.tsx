"use client";

import { useState, Suspense } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import StudentsSVG from "@/public/svgs/StudentsSVG";
import PageContainer from "@/components/PageContainer";
import AppLoader from "@/components/AppLoader";
import AppState from "@/components/AppState";
import AppTabs from "@/components/AppTabs";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/UserAvatar";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Typography } from "@/components/ui/Typography";
import { useQueryClient } from "@tanstack/react-query";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { useFollowUser, useUnfollowUser } from "@/hooks/user/useUserSearch";
import { useUserById, useUserFollowers } from "@/hooks/user/useUserProfile";
import type { FollowListData } from "@/types/user";

function NetworkContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const userId = params.id as string;
  const initialTab = (searchParams.get("tab") as "followers" | "following") || "followers";

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
  const [tabFollowLoading, setTabFollowLoading] = useState<string | null>(null);

  const profileQuery = useUserById(userId);
  const followersQuery = useUserFollowers(userId, activeTab);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const profile = profileQuery.data ?? null;
  const tabUsers = followersQuery.data?.users ?? [];
  const isLoading = profileQuery.isLoading;

  const handleTabFollow = async (targetId: string, isFollowing: boolean) => {
    setTabFollowLoading(targetId);
    try {
      if (isFollowing) {
        await unfollowMutation.mutateAsync(targetId);
      } else {
        await followMutation.mutateAsync(targetId);
      }

      queryClient.setQueryData<FollowListData>(
        queryKeys.users.followers(userId, activeTab),
        (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            users: old.users.map((u) =>
              u.id === targetId ? { ...u, isFollowing: !isFollowing } : u,
            ),
          };
        },
      );

      void profileQuery.refetch();
    } catch (error) {
      console.error("Tab follow error:", error);
    } finally {
      setTabFollowLoading(null);
    }
  };

  if (isLoading) {
    return <AppLoader />;
  }

  return (
    <PageContainer>
      <div className="mt-2">
        <AppTabs
          tabs={[
            {
              label: `Followers${profile ? ` (${profile.followersCount})` : ""}`,
              value: "followers",
            },
            {
              label: `Following${profile ? ` (${profile.followingCount})` : ""}`,
              value: "following",
            },
          ]}
          activeTab={activeTab}
          onChange={(val: string) => setActiveTab(val as "followers" | "following")}
          className="mb-8"
        />

        {followersQuery.isLoading ? (
          <AppState isLoading fullScreen={false} />
        ) : tabUsers.length === 0 ? (
          <AppState
            variant="empty"
            icon={StudentsSVG}
            title={activeTab === "followers" ? "No Followers Yet" : "Not Following Anyone"}
            description={
              activeTab === "followers"
                ? "This user doesn't have any followers yet."
                : "This user isn't following anyone yet."
            }
            fullScreen={false}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {tabUsers.map((u) => (
              <div
                key={u.id}
                onClick={() => router.push(FRONTEND_ROUTES.STUDENT_FRIEND_DETAIL(u.id))}
                className="group relative flex cursor-pointer flex-row items-center gap-2 overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-2.5 shadow-sm transition-shadow hover:shadow-md dark:bg-primary/10 sm:gap-3 sm:p-3"
              >
                <div className="relative shrink-0">
                  <UserAvatar
                    src={u.profileImage}
                    name={u.name}
                    username={u.username}
                    id={u.id}
                    size={56}
                    showRing
                    ringClassName="ring-2 ring-primary shadow-sm"
                    className="size-10 transition-transform group-hover:scale-105 sm:size-14"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex w-full items-center justify-between">
                    <Typography
                      variant="small"
                      className="truncate text-xs font-black leading-tight text-foreground transition-colors group-hover:text-primary sm:text-sm"
                    >
                      {u.name}
                    </Typography>
                  </div>
                  <Typography
                    variant="small"
                    className="mt-0.5 truncate text-[9px] uppercase leading-tight tracking-widest text-muted-foreground/80 sm:text-[10px]"
                  >
                    {u.username ? `@${u.username}` : "—"}
                  </Typography>

                  <div className="-mb-0.5 mt-1 flex flex-wrap items-center gap-1 sm:gap-2">
                    <span className="shrink-0 rounded-md border border-primary/20 bg-background/80 px-2 py-0.5 text-[8px] font-bold uppercase leading-none tracking-widest text-foreground shadow-sm sm:text-[9px]">
                      {u.points} pts
                    </span>
                    {u.class ? (
                      <span className="shrink-0 rounded-md border border-primary/20 bg-background/80 px-2 py-0.5 text-[8px] font-bold uppercase leading-none tracking-widest text-foreground shadow-sm sm:text-[9px]">
                        Class {u.class}
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTabFollow(u.id, u.isFollowing);
                  }}
                  disabled={tabFollowLoading === u.id}
                  className={cn(
                    "flex shrink-0 items-center justify-center gap-1 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all sm:gap-1.5 sm:px-5 sm:py-2.5 sm:text-[10px]",
                    {
                      "border border-border/60 bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-500":
                        u.isFollowing,
                      "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:opacity-90":
                        !u.isFollowing,
                    },
                  )}
                >
                  {tabFollowLoading === u.id ? (
                    <Loader2 className="h-3 w-3 animate-spin sm:h-3.5 sm:w-3.5" />
                  ) : u.isFollowing ? (
                    <>
                      <UserCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Follow
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="pb-10" />
    </PageContainer>
  );
}

export default function NetworkPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <NetworkContent />
    </Suspense>
  );
}
