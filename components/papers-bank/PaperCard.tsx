"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  BookOpen,
  Share2,
  Copy,
  Check,
  Play,
  Eye,
  Calendar,
  Layers,
  Award,
  CheckCircle2,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import AppButton from "@/components/AppButton";
import UserAvatar from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import type { PaperBankItem } from "@/lib/papers-bank";
import PaperShareModal from "./PaperShareModal";

interface PaperCardProps {
  paper: PaperBankItem;
  userRole?: string | null;
  onAttempt?: (paperId: string) => void;
  onView?: (paperId: string) => void;
}

export default function PaperCard({
  paper,
  userRole,
  onAttempt,
  onView,
}: PaperCardProps) {
  const router = useRouter();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isTeacher = userRole === "TEACHER" || userRole === "teacher";
  const isPaper1 = paper.paperType === 1;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareableUrl = typeof window !== "undefined"
      ? `${window.location.origin}/papers-bank/${paper.id}`
      : `/papers-bank/${paper.id}`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareableUrl);
      } else {
        const el = document.createElement("textarea");
        el.value = shareableUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      toast.success("Direct link copied! 📋");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handlePrimaryAction = () => {
    if (isTeacher) {
      if (onView) onView(paper.id);
      else router.push(`/teacher/papers-bank/${paper.id}/view`);
    } else {
      if (onAttempt) onAttempt(paper.id);
      else router.push(`/student/papers-bank/${paper.id}/attempt`);
    }
  };

  const formattedDate = paper.createdAt
    ? new Date(paper.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently added";

  const getSourceBadge = () => {
    if (paper.mode === "slos") {
      return {
        label: "SLO Curriculum AI",
        className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      };
    }
    if (paper.mode === "past_papers") {
      return {
        label: "Curated Past Exam Bank",
        className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      };
    }
    return {
      label: "Educator Custom",
      className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    };
  };

  const sourceBadge = getSourceBadge();

  return (
    <>
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-primary p-5 sm:p-6 text-primary-foreground shadow-lg transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl">
        {/* Ambient Lighting & Dual Watermark */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-primary-dark" />
          <div className="absolute -right-8 -top-10 size-44 rounded-full bg-primary-foreground/10 blur-3xl transition-colors duration-700 group-hover:bg-primary-foreground/15" />
          <div className="absolute -bottom-12 -left-8 size-40 rounded-full bg-primary-foreground/5 blur-2xl" />

          {/* Large subtle watermarks */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-2 top-0 select-none text-6xl sm:text-7xl font-black tracking-tighter text-primary-foreground/10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6"
          >
            {isPaper1 ? "P1" : "P2"}
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-1 -left-1 select-none text-5xl font-black tracking-tighter text-primary-foreground/10 sm:text-6xl"
          >
            {paper.classLevel}
          </span>
        </div>

        <div className="relative z-10 space-y-4">
          {/* Header Row: Badges & Share Quick Action */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-primary-foreground/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary-foreground ring-1 ring-primary-foreground/25 backdrop-blur-sm shadow-xs">
                {isPaper1 ? "Paper 1 · MCQs" : "Paper 2 · Theory"}
              </span>

              <span className="inline-flex items-center rounded-full bg-primary-foreground/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground/95 ring-1 ring-primary-foreground/20 backdrop-blur-sm">
                {sourceBadge.label}
              </span>

              {paper.isSharedWithMe && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/20 px-2.5 py-1 text-[10px] font-black text-primary-foreground ring-1 ring-primary-foreground/30">
                  <Share2 className="size-2.5" /> Shared with you
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex size-8 items-center justify-center rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:scale-105 active:scale-95 cursor-pointer transition-all shadow-xs backdrop-blur-xs"
                title="Copy shareable link"
              >
                {copied ? (
                  <Check className="size-3.5 text-primary-foreground" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="flex size-8 items-center justify-center rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:scale-105 active:scale-95 cursor-pointer transition-all shadow-xs backdrop-blur-xs"
                title="Share with friends or students"
              >
                <Share2 className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Paper Title & Subject */}
          <div className="space-y-1">
            <h4 className="text-base sm:text-lg font-black tracking-tight text-primary-foreground line-clamp-2 leading-snug group-hover:text-primary-foreground/90 transition-colors">
              {paper.title}
            </h4>
            <p className="text-xs font-bold text-primary-foreground/80">
              {paper.subject} · Class {paper.classLevel} · {paper.board}
            </p>
          </div>

          {/* Chapters Included Badges */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary-foreground/80">
              <Layers className="size-3 text-primary-foreground/90" />
              <span>Chapters Tested ({paper.chapterNames.length || 1})</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(paper.chapterNames.length > 0
                ? paper.chapterNames
                : [paper.subject]
              )
                .slice(0, 3)
                .map((ch, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-2.5 py-1 text-[11px] font-bold text-primary-foreground backdrop-blur-xs truncate max-w-[200px]"
                  >
                    {ch}
                  </span>
                ))}
              {paper.chapterNames.length > 3 && (
                <span className="inline-flex items-center rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-2 py-1 text-[10px] font-bold text-primary-foreground/80">
                  +{paper.chapterNames.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Creator Profile Header */}
          <div className="flex items-center justify-between border-t border-primary-foreground/15 pt-3">
            <div className="flex items-center gap-2 min-w-0">
              <UserAvatar
                src={paper.creator.profileImage}
                name={paper.creator.name}
                username={paper.creator.username}
                id={paper.creator.id}
                size={28}
                className="size-7 shrink-0 ring-1 ring-primary-foreground/30"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-primary-foreground truncate">
                    {paper.creator.name}
                  </p>
                  <span className="rounded-md bg-primary-foreground/20 px-1.5 py-0.5 text-[8.5px] font-black uppercase text-primary-foreground ring-1 ring-primary-foreground/25">
                    {paper.creator.role === "TEACHER" ? "Teacher" : "Student"}
                  </span>
                </div>
                <p className="text-[10px] text-primary-foreground/70">
                  {formattedDate}
                </p>
              </div>
            </div>

            {paper.attemptCount > 0 && (
              <span className="text-[10px] font-semibold text-primary-foreground/80 shrink-0">
                {paper.attemptCount} attempt{paper.attemptCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>

        {/* Stats Row & Primary Action Button */}
        <div className="relative z-10 mt-5 space-y-3 pt-3 border-t border-primary-foreground/15">
          <div className="flex items-center justify-between text-xs text-primary-foreground/90 font-bold">
            <span className="flex items-center gap-1.5 text-primary-foreground font-black">
              <FileText className="size-3.5 text-primary-foreground/80" />
              {paper.totalQuestions} Questions
            </span>
            <span className="flex items-center gap-1.5 font-black text-amber-300">
              <Award className="size-3.5" />
              {paper.totalMarks} Marks
            </span>
          </div>

          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary-foreground px-4 text-xs font-black uppercase tracking-widest text-primary shadow-md transition-all duration-200 hover:bg-primary-foreground/95 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {isTeacher ? (
                <>
                  <Eye className="size-3.5" /> View
                </>
              ) : (
                <>
                  <Play className="size-3.5 fill-current" /> Attempt
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary-foreground/25 bg-primary-foreground/10 px-4 text-xs font-bold text-primary-foreground backdrop-blur-xs transition-all duration-200 hover:bg-primary-foreground/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Share paper"
            >
              <Share2 className="size-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      <PaperShareModal
        paperId={paper.id}
        paperTitle={paper.title}
        subject={paper.subject}
        paperType={paper.paperType}
        classLevel={paper.classLevel}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
}
