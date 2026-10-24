"use client";

import Link from "next/link";
import { Typography } from "@/components/ui/Typography";
import { ExternalLink } from "lucide-react";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import NovaSVG from "@/public/svgs/NovaSVG";
import ReviewExamsSVG from "@/public/svgs/ReviewExamsSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import CloseCircleSVG from "@/public/svgs/CloseCircleSVG";
import UserAvatar from "@/components/UserAvatar";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { cn, formatCapitalizeWords, formatEmail } from "@/lib/utils";

export interface RecentQueueItem {
  id: string;
  user_id?: string;
  student_name: string;
  student_email: string;
  student_profile_image?: string | null;
  subject: string;
  grading_status: string;
  created_at: string;
  score: number | null;
  total_marks: number | null;
}

interface RecentReviewQueuePanelProps {
  items: RecentQueueItem[];
  pendingTotal: number;
  onOpenReviewExams: () => void;
}

function statusMeta(status: string) {
  if (status === "pending_manual") {
    return {
      label: "Pending (Manual)",
      badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      icon: ClockSVG,
    };
  }
  if (status === "pending") {
    return {
      label: "Pending (Nova AI)",
      badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
      icon: NovaSVG,
    };
  }
  if (status === "graded") {
    return {
      label: "Graded",
      badgeClass: "border-primary/30 bg-primary/10 text-primary",
      icon: CheckCircleSVG,
    };
  }
  if (status === "failed") {
    return {
      label: "Needs Retry",
      badgeClass: "border-destructive/30 bg-destructive/10 text-destructive",
      icon: CloseCircleSVG,
    };
  }
  return {
    label: status,
    badgeClass: "border-primary/30 bg-primary/10 text-primary",
    icon: TrophySVG,
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecentReviewQueuePanel({
  items,
  pendingTotal,
  onOpenReviewExams,
}: RecentReviewQueuePanelProps) {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-4 sm:p-6 shadow-xs">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Typography variant="h3" className="text-base font-bold sm:text-lg text-foreground">
            Recent Exam Submissions & Review Queue
          </Typography>
          <p className="text-[11px] font-medium text-muted-foreground">
            Real-time Paper II exam submissions across all subjects
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenReviewExams}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs transition-transform hover:scale-105 cursor-pointer"
        >
          <ReviewExamsSVG className="size-4" />
          <span>Review Exams ({pendingTotal})</span>
          <ArrowRightSVG className="size-3.5" />
        </button>
      </div>

      <div className="space-y-2.5">
        {items.length > 0 ? (
          items.map((item, idx) => {
            const { label: badgeLabel, badgeClass, icon: Icon } = statusMeta(
              item.grading_status,
            );
            const rawName = item.student_name || item.student_email || "Student";
            const studentDisplayName = formatCapitalizeWords(rawName);
            const studentEmail = formatEmail(item.student_email);
            const percentage =
              item.score !== null && item.total_marks && item.total_marks > 0
                ? Math.round((item.score / item.total_marks) * 100)
                : null;

            return (
              <div
                key={`${item.id}-${idx}`}
                className="group flex flex-col gap-3 rounded-2xl border border-border/50 bg-muted/20 p-3.5 transition-all duration-200 hover:border-primary/40 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:p-4"
              >
                {/* Left Side: Avatar + Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <UserAvatar
                    name={studentDisplayName}
                    src={item.student_profile_image}
                    id={item.user_id || item.id}
                    size="md"
                    className="size-10 shrink-0 shadow-2xs"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-foreground truncate max-w-56 sm:max-w-72">
                        {studentDisplayName}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                          badgeClass,
                        )}
                      >
                        <Icon className="size-2.5" />
                        {badgeLabel}
                      </span>
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground/80">
                        {item.subject}
                      </span>
                      <span>•</span>
                      <span>{formatDate(item.created_at)}</span>
                      {studentEmail && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-44 text-[11px] lowercase">
                            {studentEmail}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Score + Action Button */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-border/40 sm:border-t-0">
                  {item.grading_status === "graded" && item.score !== null ? (
                    <div className="text-left sm:text-right">
                      <div className="flex items-baseline gap-1 sm:justify-end">
                        <span className="text-lg font-black text-primary">
                          {item.score}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground">
                          /{item.total_marks}
                        </span>
                      </div>
                      {percentage !== null && (
                        <p className="text-[10px] font-bold text-muted-foreground">
                          {percentage}% scored
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-left sm:text-right">
                      <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                        {item.grading_status === "failed" ? "Action Required" : "Awaiting Evaluation"}
                      </span>
                    </div>
                  )}

                  <Link
                    href={FRONTEND_ROUTES.ADMIN_CHECK_PAPERS(item.id)}
                    className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-10 text-center rounded-2xl border border-dashed border-border/60 bg-muted/10">
            <p className="text-sm font-medium text-muted-foreground">
              No recent exam submissions found in the review queue.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
