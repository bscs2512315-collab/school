"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { cn } from "@/lib/utils";
import AppButton from "@/components/AppButton";
import UserAvatar from "@/components/UserAvatar";
import MailSVG from "@/public/svgs/MailSVG";
import ChallengeSVG from "@/public/svgs/ChallengeSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import CloseCircleSVG from "@/public/svgs/CloseCircleSVG";
import { getSubjectIcon } from "@/lib/generate/subject-icons";

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

interface ChallengeCardProps {
  challenge: Challenge;
  onRespond: (
    e: React.MouseEvent,
    challengeId: string,
    action: "accept" | "decline",
  ) => void;
}

export default function ChallengeCard({ challenge, onRespond }: ChallengeCardProps) {
  const router = useRouter();
  const isInvited = challenge.myStatus === "INVITED";
  const isActive = challenge.status === "ACTIVE";
  const isCompleted = challenge.status === "COMPLETED";

  const SubjectIcon = getSubjectIcon(challenge.subject);

  const getStatusBadge = () => {
    if (isInvited) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
          <MailSVG className="size-3.5" />
          Invited
        </span>
      );
    }
    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-foreground shadow-xs animate-pulse">
          <ChallengeSVG className="size-3.5" />
          Live Arena
        </span>
      );
    }
    if (isCompleted) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
          <TrophySVG className="size-3.5 text-primary" />
          Finished
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <ClockSVG className="size-3.5" />
        Waiting Room
      </span>
    );
  };

  const progressPercent = Math.min(
    100,
    Math.round(
      ((challenge.acceptedCount || 1) / Math.max(1, challenge.totalParticipants || 1)) * 100,
    ),
  );

  return (
    <div
      onClick={() => router.push(FRONTEND_ROUTES.STUDENT_CHALLENGE_DETAIL(challenge.id))}
      className={cn(
        "group relative flex min-h-[220px] sm:min-h-[240px] flex-col justify-between overflow-hidden rounded-2xl border-2 p-4 sm:p-5 text-left transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-lg backdrop-blur-md",
        isActive
          ? "border-primary/60 bg-card/90 shadow-md ring-2 ring-primary/15"
          : isInvited
            ? "border-primary/40 bg-card/80 shadow-xs hover:border-primary/60"
            : "border-border/70 bg-card/70 hover:border-primary/40 hover:bg-card/90 shadow-xs",
      )}
    >
      {/* Background Subject Watermark */}
      <SubjectIcon
        aria-hidden
        className="pointer-events-none absolute -right-3 -bottom-3 size-28 text-primary/5 select-none transition-transform duration-500 group-hover:scale-110 group-hover:text-primary/10"
      />

      {/* Top Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2">
          {getStatusBadge()}
          <span className="rounded-md border border-border/70 bg-muted/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {challenge.paperType === 2 ? "Paper II · CRQ" : "Paper I · MCQ"}
          </span>
        </div>

        {/* Title and Metadata */}
        <div className="mt-3 space-y-1">
          <h3 className="line-clamp-1 text-base sm:text-lg font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
            {challenge.subject}
          </h3>
          <p className="text-[11px] font-semibold text-muted-foreground">
            Class {challenge.classLevel} · {challenge.board}
          </p>
        </div>
      </div>

      {/* Squad & Creator Progress */}
      <div className="relative z-10 my-3 space-y-2.5 rounded-xl border border-border/60 bg-background/50 p-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <UserAvatar
              src={challenge.creatorImage}
              name={challenge.creatorName}
              username={challenge.creatorUsername || ""}
              id={challenge.id}
              size={24}
              className="size-6 shrink-0"
            />
            <span className="truncate font-bold text-foreground text-xs">
              {challenge.isCreator ? "You (Host)" : challenge.creatorName}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground shrink-0">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>
              {challenge.acceptedCount}/{challenge.totalParticipants} Joined
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="relative z-10 pt-1">
        {isInvited ? (
          <div className="grid grid-cols-2 gap-2">
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => onRespond(e, challenge.id, "decline")}
              className="h-9 rounded-xl border-border/80 text-xs font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            >
              <CloseCircleSVG className="size-3.5 mr-1" />
              Decline
            </AppButton>
            <AppButton
              type="button"
              size="sm"
              onClick={(e) => onRespond(e, challenge.id, "accept")}
              className="h-9 rounded-xl bg-primary text-xs font-black text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              <CheckCircleSVG className="size-3.5 mr-1" />
              Accept
            </AppButton>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">
              {challenge.completedCount > 0
                ? `${challenge.completedCount} finished`
                : "Challenge ready"}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-black text-primary group-hover:translate-x-0.5 transition-transform">
              {isActive ? "Enter Arena" : "View Challenge"}
              <ArrowRightSVG className="size-3.5" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
