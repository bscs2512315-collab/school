"use client";

import React from "react";
import MailSVG from "@/public/svgs/MailSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import ChallengeCard from "./ChallengeCard";

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

interface InvitationsTabProps {
  incomingInvitations: Challenge[];
  onRespond: (e: React.MouseEvent, challengeId: string, action: "accept" | "decline") => void;
}

export default function InvitationsTab({ incomingInvitations, onRespond }: InvitationsTabProps) {
  const hasInvites = incomingInvitations.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2">
        <MailSVG className="size-5 text-primary" />
        <h2 className="text-base font-black tracking-tight text-foreground sm:text-lg">
          Challenge Invitations
        </h2>
        {hasInvites && (
          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-black text-primary">
            {incomingInvitations.length}
          </span>
        )}
      </div>

      {!hasInvites ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/80 bg-card/60 p-8 text-center sm:p-14 backdrop-blur-md">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-xs">
            <SparklesSVG className="size-7" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-foreground">
            No pending invitations
          </h3>
          <p className="mt-1 max-w-sm text-xs sm:text-sm text-muted-foreground">
            When friends challenge you to a past paper or SLO showdown, their invitations will appear right here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {incomingInvitations.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} onRespond={onRespond} />
          ))}
        </div>
      )}
    </div>
  );
}
