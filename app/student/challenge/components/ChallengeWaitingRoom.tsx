"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Swords,
  XCircle,
} from "lucide-react";
import StudentsSVG from "@/public/svgs/StudentsSVG";
import AppButton from "@/components/AppButton";
import SubjectWatermarkCluster from "@/components/generate/SubjectWatermarkCluster";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import type { ChallengeDetail, ChallengeParticipant } from "@/types/challenge";

interface ChallengeWaitingRoomProps {
  challenge: ChallengeDetail;
  /** @deprecated - component manages its own timer internally */
  remainingSecs?: number;
  formatTime: (seconds: number) => string;
  onRespond: (action: "accept" | "decline") => void;
  onBack: () => void;
}

function WaitingRoomBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <div className="absolute inset-0 bg-linear-to-br from-primary via-primary/95 to-primary-dark" />
      <div className="absolute top-[-20%] right-[-10%] size-[80%] rounded-full bg-primary-foreground/10 blur-[80px]" />
      <div className="absolute bottom-[-10%] left-[-10%] size-[60%] rounded-full bg-emerald-400/15 blur-[60px]" />
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}

function getParticipantStatusStyle(status: string) {
  if (status === "ACCEPTED") {
    return "border-emerald-200/30 bg-emerald-400/20 text-primary-foreground";
  }
  if (status === "DECLINED") {
    return "border-red-200/30 bg-red-400/20 text-primary-foreground";
  }
  return "border-amber-200/30 bg-amber-400/20 text-primary-foreground animate-pulse";
}

function getParticipantStatusLabel(status: string) {
  if (status === "ACCEPTED") return "Ready";
  if (status === "DECLINED") return "Declined";
  return "Pending";
}

function ParticipantRow({ participant }: { participant: ChallengeParticipant }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-background/10 p-3 backdrop-blur-md sm:rounded-3xl sm:p-4">
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-background/15">
        {participant.profileImage ? (
          <Image
            src={participant.profileImage}
            alt=""
            width={40}
            height={40}
            className="size-full object-cover"
          />
        ) : (
          <span className="text-sm font-black text-background">
            {participant.name?.charAt(0)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-bold text-background">{participant.name}</p>
        <p className="truncate text-[10px] font-bold text-background/60">@{participant.username}</p>
      </div>
      <span
        className={cn(
          "rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md",
          getParticipantStatusStyle(participant.status),
        )}
      >
        {getParticipantStatusLabel(participant.status)}
      </span>
    </div>
  );
}

export default function ChallengeWaitingRoom({
  challenge,
  formatTime,
  onRespond,
  onBack,
}: ChallengeWaitingRoomProps) {
  const acceptedCount = challenge.participants.filter((p) => p.status === "ACCEPTED").length;
  const isInvited = challenge.myStatus === "INVITED";
  const [remainingSecs, setRemainingSecs] = useState(0);

  useEffect(() => {
    const waitMs = (challenge.maxWaitMinutes || 5) * 60 * 1000;
    const createdMs = new Date(challenge.createdAt).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((waitMs - (Date.now() - createdMs)) / 1000));
      setRemainingSecs(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [challenge.createdAt, challenge.maxWaitMinutes]);

  return (
    <div className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-4 space-y-6 pb-8">
      <div className="group relative overflow-hidden rounded-4xl border border-primary/20 shadow-lg sm:rounded-[2.5rem]">
        <WaitingRoomBackground />
        <SubjectWatermarkCluster subject={challenge.subject} placement="card" />

        <div className="relative z-10 p-6 text-center sm:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-background/15 px-4 py-1.5 backdrop-blur-md">
            <Swords className="size-3 text-background" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-background">
              Waiting Room
            </span>
          </div>

          <Typography className="text-2xl font-black tracking-tight text-primary-foreground sm:text-3xl">
            {challenge.subject} Challenge
          </Typography>
          <Typography className="mt-2 text-sm text-primary-foreground/70">
            Created by {challenge.isCreator ? "you" : challenge.creatorName}
          </Typography>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-white/20 bg-background/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-background backdrop-blur-md">
              {challenge.classLevel} · {challenge.board}
            </span>
            <span className="rounded-full border border-white/20 bg-background/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-background backdrop-blur-md">
              Paper {challenge.paperType}
            </span>
            <span className="rounded-full border border-white/20 bg-background/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-background backdrop-blur-md">
              {acceptedCount}/{challenge.participants.length} Ready
            </span>
          </div>
        </div>
      </div>

      {isInvited ? (
        <div className="relative overflow-hidden rounded-4xl border border-amber-500/30 bg-linear-to-br from-amber-600 via-amber-500 to-amber-900/90 p-6 shadow-lg sm:rounded-[2.5rem] sm:p-8">
          <div className="absolute top-0 right-0 size-40 rounded-full bg-background/10 blur-3xl" />
          <div className="relative z-10 text-center">
            <Typography className="text-lg font-black text-background sm:text-xl">
              You&apos;ve Been Challenged!
            </Typography>
            <Typography className="mt-2 text-sm text-background/80">
              {challenge.creatorName} has challenged you in {challenge.subject}. Accept to compete!
            </Typography>
            <div className="mt-6 flex gap-3">
              <AppButton
                variant="outline"
                onClick={() => onRespond("decline")}
                className="h-12 flex-1 rounded-2xl border-white/30 bg-background/10 font-black text-background hover:bg-background/20"
              >
                <XCircle className="mr-2 size-4" />
                Decline
              </AppButton>
              <AppButton
                onClick={() => onRespond("accept")}
                className="h-12 flex-1 rounded-2xl border border-white/20 bg-background font-black text-primary shadow-lg hover:bg-background/90"
              >
                <Swords className="mr-2 size-4" />
                Accept
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-4xl border border-amber-500/20 bg-linear-to-br from-amber-600 via-amber-500 to-amber-900/90 p-6 shadow-lg sm:rounded-[2.5rem] sm:p-8">
        <div className="absolute top-0 right-0 size-48 rounded-full bg-background/10 blur-3xl" />
        <div className="relative z-10 text-center">
          <div className="mb-4 flex items-center justify-center gap-2 text-background/80">
            <Clock className="size-5" />
            <Typography className="text-sm font-bold">Starts automatically in</Typography>
          </div>
          <Typography className="font-mono text-5xl font-black tracking-tight text-background sm:text-6xl">
            {formatTime(remainingSecs)}
          </Typography>
          <Typography className="mt-3 text-xs text-background/70">
            Or when all participants respond
          </Typography>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-4xl border border-primary/20 p-6 shadow-lg sm:rounded-[2.5rem] sm:p-8">
        <WaitingRoomBackground />
        <div className="relative z-10">
          <div className="mb-5 flex items-center gap-2">
            <StudentsSVG className="size-5 text-primary-foreground" />
            <Typography className="text-base font-black text-primary-foreground">
              Participants
            </Typography>
          </div>
          <div className="space-y-3">
            {challenge.participants.map((participant) => (
              <ParticipantRow key={participant.userId} participant={participant} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center pb-4">
        <AppButton
          variant="outline"
          onClick={onBack}
          className="rounded-2xl px-6 font-bold"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back
        </AppButton>
      </div>
    </div>
  );
}
