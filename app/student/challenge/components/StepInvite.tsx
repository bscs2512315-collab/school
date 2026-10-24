"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import SearchSVG from "@/public/svgs/SearchSVG";
import PlusSVG from "@/public/svgs/PlusSVG";
import StudentsSVG from "@/public/svgs/StudentsSVG";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import {
  GenerateSectionDivider,
  GenerateStepFooter,
  GenerateStepShell,
  GenerateStepTopNav,
} from "@/components/generate/GeneratePaperUI";
import AppInput from "@/components/AppInput";
import UserAvatar from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

interface UserSearchResult {
  id: string;
  name: string;
  username: string;
  profileImage: string | null;
}

interface StepInviteProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  searchResults: UserSearchResult[];
  invitedUsers: UserSearchResult[];
  isCreating: boolean;
  onInviteUser: (user: UserSearchResult) => void;
  onRemoveUser: (id: string) => void;
  onBack: () => void;
  onCreateChallenge: () => void;
}

export default function StepInvite({
  searchQuery,
  setSearchQuery,
  isSearching,
  searchResults,
  invitedUsers,
  isCreating,
  onInviteUser,
  onRemoveUser,
  onBack,
  onCreateChallenge,
}: StepInviteProps) {
  return (
    <GenerateStepShell>
      {/* Top Back Navigation */}
      <GenerateStepTopNav
        onBack={onBack}
        stepBadge="Final Step"
        title="Invite Squad & Classmates"
        subtitle="Search and challenge friends to a live showdown"
      />

      <GenerateSectionDivider label="1. Find &amp; Invite Classmates" />

      <div className="relative">
        <div className="relative">
          <SearchSVG className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <AppInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name or @username..."
            className="h-12 rounded-xl pl-11 pr-11 bg-background text-sm"
          />
          {isSearching ? (
            <Loader2 className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary" />
          ) : null}
        </div>

        {searchResults.length > 0 ? (
          <div className="absolute top-full z-30 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl backdrop-blur-md">
            {searchResults.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => onInviteUser(user)}
                className="flex w-full items-center justify-between gap-3 border-b border-border/60 p-3 text-left last:border-b-0 hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    src={user.profileImage}
                    name={user.name}
                    username={user.username}
                    id={user.id}
                    size={36}
                    className="size-9 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{user.name}</p>
                    <p className="truncate text-[10px] font-semibold text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                  <PlusSVG className="size-3" />
                  Invite
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <GenerateSectionDivider label={`2. Invited Squad (${invitedUsers.length})`} />

      {invitedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-card/60 p-8 text-center sm:p-10 backdrop-blur-md">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <StudentsSVG className="size-6" />
          </div>
          <p className="text-sm font-bold text-foreground">No classmates invited yet</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Search for your friends above to invite them to this challenge.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {invitedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/80 p-3 shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <UserAvatar
                  src={user.profileImage}
                  name={user.name}
                  username={user.username}
                  id={user.id}
                  size={36}
                  className="size-9 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-foreground">{user.name}</p>
                  <p className="truncate text-[10px] font-semibold text-muted-foreground">
                    @{user.username}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRemoveUser(user.id)}
                className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                title="Remove invitation"
              >
                <DeleteSVG className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <GenerateStepFooter
        nextHint="Launch live challenge arena for invited friends"
        continueLabel="Launch Challenge ⚔️"
        onContinue={onCreateChallenge}
        onBack={onBack}
        disabled={invitedUsers.length === 0}
        loading={isCreating}
      />
    </GenerateStepShell>
  );
}
