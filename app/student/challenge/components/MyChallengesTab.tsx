"use client";

import React from "react";
import ChallengeSVG from "@/public/svgs/ChallengeSVG";
import PlusSVG from "@/public/svgs/PlusSVG";
import AppButton from "@/components/AppButton";
import ChallengeCard from "./ChallengeCard";
import NovaEmptyState from "@/components/NovaEmptyState";
import { ChallengeTab } from "@/types/enums";

interface Challenge {
  id: string;
  subject: string;
  classLevel: string;
  board: string;
  paperType: number;
  status: string;
  createdAt: string;
  startedAt: string | null;
  creatorName: string;
  creatorUsername: string | null;
  creatorImage: string | null;
  isCreator: boolean;
  myStatus: string;
  totalParticipants: number;
  acceptedCount: number;
  completedCount: number;
}

interface MyChallengesTabProps {
  myCreatedChallenges: Challenge[];
  myAcceptedInvites: Challenge[];
  onSetActiveTab: (tab: ChallengeTab) => void;
  onRespond: (e: React.MouseEvent, challengeId: string, action: "accept" | "decline") => void;
}

export default function MyChallengesTab({
  myCreatedChallenges,
  myAcceptedInvites,
  onSetActiveTab,
  onRespond,
}: MyChallengesTabProps) {
  const allChallenges = [...myCreatedChallenges, ...myAcceptedInvites];
  const hasChallenges = allChallenges.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChallengeSVG className="size-5 text-primary" />
          <h2 className="text-base font-black tracking-tight text-foreground dark:text-white sm:text-lg">
            My Challenges &amp; Arena Matches
          </h2>
          {hasChallenges && (
            <span className="rounded-full bg-primary/15 dark:bg-emerald-500/20 px-2.5 py-0.5 text-xs font-black text-primary dark:text-emerald-300">
              {allChallenges.length}
            </span>
          )}
        </div>

        {hasChallenges && (
          <AppButton
            size="sm"
            onClick={() => onSetActiveTab(ChallengeTab.CREATE)}
            className="h-9 gap-1.5 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            <PlusSVG className="size-3.5" />
            Create Challenge
          </AppButton>
        )}
      </div>

      {!hasChallenges ? (
        <NovaEmptyState
          title="No challenges active yet"
          description="Challenge classmates and friends to 1v1 or group board exam battles with real-time scoring."
          novaSpeech="Ready to test your knowledge against friends?"
          icon={ChallengeSVG}
          action={{
            label: "Start Your First Challenge",
            onClick: () => onSetActiveTab(ChallengeTab.CREATE),
            icon: PlusSVG,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} onRespond={onRespond} />
          ))}
        </div>
      )}
    </div>
  );
}
