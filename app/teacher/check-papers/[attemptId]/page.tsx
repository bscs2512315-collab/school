"use client";

import { useEffect, useState } from "react";
import { Archive, CheckCircle2, GraduationCap, Loader2, MessageSquare, Save, X, ZoomIn } from "lucide-react";
import ImageSVG from "@/public/svgs/ImageSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInput from "@/components/AppInput";
import AppLoader from "@/components/AppLoader";
import AppTextarea from "@/components/AppTextarea";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import { Typography } from "@/components/ui/Typography";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { cn, formatCapitalizeWords } from "@/lib/utils";

interface Question {
  id: string;
  question_number: number;
  question_part: string | null;
  question_text: string;
  question_type: string;
  marks: number;
  student_answer: { imageUrl: string } | null;
}

interface AttemptData {
  attempt: {
    student_name: string;
    subject: string;
    created_at: string;
  };
  questions: Question[];
}

export default function GradePaperPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [data, setData] = useState<AttemptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [grades, setGrades] = useState<
    Record<string, { score: string; feedback: string }>
  >({});
  const [overallFeedback, setOverallFeedback] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/teacher/pending-papers/${attemptId}`);
        const resData = await res.json();
        if (resData.success) {
          setData(resData.data);
          const initialGrades: Record<
            string,
            { score: string; feedback: string }
          > = {};
          resData.data.questions.forEach((q: Question) => {
            initialGrades[q.id] = { score: "", feedback: "" };
          });
          setGrades(initialGrades);
        } else {
          toast.error(resData.message);
        }
      } catch {
        toast.error("Failed to load attempt details");
      } finally {
        setIsLoading(false);
      }
    };
    void fetchDetails();
  }, [attemptId]);

  const handleGradeChange = (qId: string, field: string, value: string) => {
    setGrades((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    const unfinished = data?.questions.some((q) => !grades[q.id].score);
    if (unfinished) {
      toast.error("Please provide marks for all questions");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        attemptId,
        overallFeedback,
        grades: Object.keys(grades).reduce(
          (acc: Record<string, unknown>, qId) => {
            const q = data?.questions.find((quest) => quest.id === qId);
            acc[qId] = {
              score: grades[qId].score,
              maxMarks: q?.marks,
              feedback: grades[qId].feedback,
              imageUrl: q?.student_answer?.imageUrl,
            };
            return acc;
          },
          {},
        ),
      };

      const res = await fetch("/api/teacher/grade-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (resData.success) {
        toast.success("Paper graded successfully!");
        router.push(FRONTEND_ROUTES.TEACHER_DASHBOARD);
      } else {
        toast.error(resData.message);
      }
    } catch {
      toast.error("Failed to submit grades");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <AppLoader />;
  if (!data) return null;

  const awarded = Object.values(grades).reduce(
    (sum, g) => sum + (Number(g.score) || 0),
    0,
  );
  const maxTotal = data.questions.reduce((sum, q) => sum + q.marks, 0);
  const estimatedPoints =
    10 + Math.floor((awarded / Math.max(maxTotal, 1)) * 100) / 10 * 5;

  return (
    <PageContainer className="max-w-7xl pb-40">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <PageHeader title={`Grading: ${formatCapitalizeWords(data.attempt.student_name)}`} showLine />
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                {data.attempt.subject}
              </span>
              <Typography variant="muted" className="text-xs font-medium">
                Submitted {new Date(data.attempt.created_at).toLocaleString()}
              </Typography>
            </div>
          </div>
          <AppButton
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="h-12 rounded-2xl px-8 font-black shadow-xl shadow-primary/20"
          >
            {isSubmitting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Save className="size-5" />
            )}
            Finalize Grading
          </AppButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {data.questions.map((q, idx) => (
            <AppCard
              key={q.id}
              className="overflow-hidden rounded-[2rem] border-border/50 bg-card/40 p-0"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border/40 bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground">
                    {idx + 1}
                  </div>
                  <Typography className="font-bold">
                    Question {q.question_number}
                    {q.question_part || ""}
                    <span className="ml-2 text-xs font-black italic text-muted-foreground">
                      ({q.question_type})
                    </span>
                  </Typography>
                </div>
                <span className="rounded-xl bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                  {q.marks} Marks
                </span>
              </div>

              <div className="space-y-6 p-6">
                <Typography className="border-l-4 border-primary/20 py-1 pl-4 text-sm leading-relaxed">
                  {q.question_text}
                </Typography>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <Typography className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Student Answer
                    </Typography>
                    {q.student_answer?.imageUrl ? (
                      <button
                        type="button"
                        className="group/img relative aspect-video cursor-zoom-in overflow-hidden rounded-2xl border border-border/50"
                        onClick={() =>
                          setSelectedImage(q.student_answer!.imageUrl)
                        }
                      >
                        <img
                          src={q.student_answer.imageUrl}
                          alt={`Answer for question ${q.question_number}`}
                          className="size-full object-cover transition-transform group-hover/img:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 opacity-0 transition-all group-hover/img:bg-foreground/20 group-hover/img:opacity-100">
                          <ZoomIn className="size-8 text-background" />
                        </div>
                      </button>
                    ) : (q.student_answer as Record<string, unknown>)?.imagesArchived ? (
                      <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-500/30 bg-blue-500/5 p-4 text-center">
                        <Archive className="size-7 text-blue-500" />
                        <Typography className="text-xs font-semibold text-foreground">
                          Answer Image Archived
                        </Typography>
                        <Typography variant="muted" className="text-[11px]">
                          Removed after the 48-hour post-approval window.
                        </Typography>
                      </div>
                    ) : (
                      <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/50 bg-muted/40">
                        <ImageSVG className="size-8 text-muted-foreground" />
                        <Typography variant="muted" className="text-xs italic">
                          No answer uploaded
                        </Typography>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-end space-y-5">
                    <div className="space-y-2">
                      <Typography className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Award Marks
                      </Typography>
                      <div className="flex items-center gap-3">
                        <AppInput
                          type="number"
                          max={q.marks}
                          min={0}
                          placeholder="0"
                          value={grades[q.id].score}
                          onChange={(e) =>
                            handleGradeChange(q.id, "score", e.target.value)
                          }
                          className="h-12 w-24 border-primary/20 bg-primary/5 text-center text-lg font-black focus:border-primary"
                        />
                        <Typography className="font-bold text-muted-foreground">
                          / {q.marks}
                        </Typography>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Typography className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Question Feedback (Optional)
                      </Typography>
                      <div className="relative">
                        <MessageSquare className="absolute top-4 left-4 size-4 text-muted-foreground z-10" />
                        <AppTextarea
                          placeholder="Explain what was good or where they can improve..."
                          value={grades[q.id].feedback}
                          onChange={(e) =>
                            handleGradeChange(q.id, "feedback", e.target.value)
                          }
                          className="min-h-24 w-full rounded-2xl border-border/40 bg-muted/30 py-3 pr-4 pl-11 text-sm font-medium focus:border-primary/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AppCard>
          ))}
        </div>

        <div className="h-fit space-y-6 lg:sticky lg:top-6 lg:col-span-4">
          <AppCard className="space-y-6 rounded-[2rem] border-2 border-primary/20 p-6 shadow-xl shadow-primary/5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-2.5">
                <GraduationCap className="size-5 text-primary" />
              </div>
              <Typography className="text-xl font-black">
                Overall Assessment
              </Typography>
            </div>

            <div className="space-y-1 rounded-2xl bg-muted/40 p-4">
              <Typography className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Current Total
              </Typography>
              <Typography className="text-3xl font-black text-primary">
                {awarded}
                <span className="ml-1 text-lg text-muted-foreground">
                  / {maxTotal}
                </span>
              </Typography>
            </div>

            <div className="space-y-2">
              <Typography className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Summary Feedback to Student
              </Typography>
              <AppTextarea
                placeholder="Write an overall summary of the performance..."
                value={overallFeedback}
                onChange={(e) => setOverallFeedback(e.target.value)}
                className="min-h-32 w-full rounded-3xl border-border/40 bg-muted/30 p-5 text-sm font-medium focus:border-primary/50"
              />
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-rank-2/20 bg-rank-2/10 p-4">
              <TrophySVG className="size-5 shrink-0 text-rank-2" />
              <div className="space-y-1">
                <Typography className="text-xs font-black text-rank-2">
                  Gamification Preview
                </Typography>
                <Typography className="text-[10px] font-medium text-muted-foreground">
                  Based on this score, the student will receive approximately{" "}
                  <span className="font-bold text-foreground">
                    {estimatedPoints}
                  </span>{" "}
                  points.
                </Typography>
              </div>
            </div>

            <AppButton
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="h-14 w-full rounded-2xl font-black shadow-2xl shadow-primary/20"
            >
              {isSubmitting ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <Save className="size-6" />
              )}
              Finish & Publish Result
            </AppButton>
          </AppCard>

          <AppCard className="flex flex-col gap-4 rounded-[2rem] border-border/40 bg-muted/20 p-6">
            <Typography className="text-sm font-bold">Grading Policy</Typography>
            <ul className="space-y-3 text-[11px] font-medium text-muted-foreground">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                Answers must be visible. If illegible, award 0.
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                Partial marks can be awarded for correct steps even if the final
                result is wrong.
              </li>
            </ul>
          </AppCard>
        </div>
      </div>

      {selectedImage ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-foreground/90 p-4 backdrop-blur-xl lg:p-12"
          onClick={() => setSelectedImage(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSelectedImage(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute top-8 right-8 rounded-full bg-background/10 p-4 text-background/60 transition-colors hover:text-background"
            onClick={() => setSelectedImage(null)}
          >
            <X className="size-8" />
          </button>
          <img
            src={selectedImage}
            alt="Student answer enlarged"
            className={cn(
              "max-h-full max-w-full rounded-xl object-contain shadow-2xl",
            )}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </PageContainer>
  );
}
