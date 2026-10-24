"use client";

import Image from "next/image";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import AppButton from "@/components/AppButton";
import { Typography } from "@/components/ui/Typography";
import { usePageTitle } from "@/components/layout/PageTitleContext";
import RefreshSVG from "@/public/svgs/RefreshSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import CloseCircleSVG from "@/public/svgs/CloseCircleSVG";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import QuestionImage from "@/components/exam/QuestionImage";
import { convertMathToHTML, isUrduText } from "@/lib/utils/math-notation";
import { cn } from "@/lib/utils";
import type { GeneratedPaper, GeneratePaperSubmitResult } from "@/types/generate";

interface GenerateResultScreenProps {
  paper: GeneratedPaper;
  result: GeneratePaperSubmitResult;
  onRetry: () => void;
  onBack: () => void;
  retryLabel?: string;
}

function getGradeInfo(pct: number) {
  if (pct >= 96) return { grade: "A++", remark: "Exceptional" };
  if (pct >= 91) return { grade: "A+", remark: "Outstanding" };
  if (pct >= 86) return { grade: "A", remark: "Excellent" };
  if (pct >= 81) return { grade: "B++", remark: "Very Good" };
  if (pct >= 76) return { grade: "B+", remark: "Good" };
  if (pct >= 71) return { grade: "B", remark: "Fairly Good" };
  if (pct >= 61) return { grade: "C+", remark: "Above Average" };
  if (pct >= 51) return { grade: "C", remark: "Average" };
  if (pct >= 40) return { grade: "D", remark: "Below Average" };
  return { grade: "U", remark: "Below Pass" };
}

function getNovaFeedback(pct: number, score: number) {
  if (score === 0) {
    return {
      title: "Keep Your Head High!",
      message:
        "Every expert started somewhere. Don't be discouraged! Take time to study each solution in the breakdown below, understand the reasoning, and let's try again.",
    };
  }
  if (pct >= 90) {
    return {
      title: "Mastery Achieved! 🌟",
      message:
        "Outstanding performance! You've conquered this paper with top marks. Keep up this incredible momentum for your exams!",
    };
  }
  if (pct >= 75) {
    return {
      title: "Great Job! 🎯",
      message:
        "Impressive work! You demonstrated strong conceptual understanding. Review the few questions you missed below to aim for 100%!",
    };
  }
  if (pct >= 60) {
    return {
      title: "Good Effort! 📈",
      message:
        "Solid attempt! You've passed comfortably, but there are a few areas worth strengthening. Check out the answers below and give it another go!",
    };
  }
  if (pct >= 45) {
    return {
      title: "Passed, Let's Push Further! 💪",
      message:
        "You cleared the passing benchmark! Revisiting the topics you struggled with and attempting another run will push your score much higher.",
    };
  }
  return {
    title: "Practice Makes Progress! 💡",
    message:
      "Don't fret over this score! Focus on learning from the answer breakdown below, note down the formulas or rules, and re-attempt to see your growth.",
  };
}

function formatClassLevel(cls?: string | number) {
  if (!cls) return "";
  const str = cls.toString().replace(/^Class\s*/i, "").trim();
  if (str === "9") return "IX";
  if (str === "10") return "X";
  if (str === "11") return "XI";
  if (str === "12") return "XII";
  return str;
}

export default function GenerateResultScreen({
  paper,
  result,
  onRetry,
  onBack,
  retryLabel = "Re Attempt",
}: GenerateResultScreenProps) {
  const setHeaderBack = usePageTitle()?.setHeaderBack;
  useEffect(() => {
    setHeaderBack?.(onBack);
    return () => setHeaderBack?.(null);
  }, [onBack, setHeaderBack]);
  const gradeInfo = getGradeInfo(result.percentage);
  const novaFeedback = getNovaFeedback(result.percentage, result.score);
  const questions = paper.questions || [];

  return (
    <div className="flex w-full flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 sm:gap-6">
      {/* Score Card Hero */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="relative overflow-hidden bg-primary px-4 pt-5 pb-0 sm:px-6 sm:pt-6 sm:pb-0 md:px-7 md:pt-7 md:pb-0 text-primary-foreground">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-3xl" />

          {/* Mobile Nova Speech Bubble (< md) */}
          <div className="relative z-10 mb-3 w-full rounded-2xl border border-primary-foreground/25 bg-primary-foreground/15 p-2.5 sm:p-3 text-left shadow-xs backdrop-blur-md md:hidden">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground/90">
              <Sparkles className="size-3 text-amber-300 shrink-0" />
              <span className="shrink-0">Nova AI Tutor</span>
              <span className="text-primary-foreground/60">•</span>
              <span className="truncate text-amber-200">{novaFeedback.title}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium leading-snug text-primary-foreground">
              &ldquo;{novaFeedback.message}&rdquo;
            </p>
          </div>

          {/* Main Content: Score & Subject Info + Desktop Speech Bubble + Nova Mascot */}
          <div className="relative z-10 flex items-end justify-between gap-4 md:gap-6">
            {/* Score & Paper Details Section */}
            <div className="shrink-0 pb-2.5 text-left sm:pb-3 md:pb-3.5">
              {/* Score Numbers */}
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-5xl sm:text-6xl md:text-7xl font-black leading-none tracking-tight">
                  {result.score}
                </span>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-foreground/60">
                  / {result.totalMarks}
                </span>
              </div>

              {/* Grade Remark */}
              <p className="mt-1 text-lg sm:text-xl md:text-2xl font-bold leading-none tracking-tight text-primary-foreground">
                {gradeInfo.remark}
              </p>

              {/* Subject & Paper Info */}
              <div className="mt-2.5 sm:mt-3">
                <p className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-primary-foreground">
                  {paper.subject}
                </p>
                <p className="mt-0.5 text-xs sm:text-sm font-medium text-primary-foreground/80">
                  {formatClassLevel(paper.classLevel) || paper.classLevel}
                  {paper.board ? ` • ${paper.board}` : ""}
                  {` • Paper ${paper.paperType || 1}`}
                </p>
              </div>
            </div>

            {/* Desktop Nova Speech Bubble (positioned slightly higher on large screens) */}
            <div className="hidden md:flex flex-1 min-w-0 self-start md:mt-1 lg:mt-2 flex-col rounded-2xl border border-primary-foreground/25 bg-primary-foreground/15 p-3.5 lg:p-4 text-left shadow-xs backdrop-blur-md">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground/90">
                <Sparkles className="size-3.5 text-amber-300 shrink-0" />
                <span className="shrink-0">Nova AI Tutor</span>
                <span className="text-primary-foreground/60">•</span>
                <span className="truncate text-amber-200">{novaFeedback.title}</span>
              </div>
              <p className="text-xs lg:text-sm font-medium leading-relaxed text-primary-foreground">
                &ldquo;{novaFeedback.message}&rdquo;
              </p>
            </div>

            {/* Nova Mascot */}
            <div className="relative -mb-px flex h-36 w-28 shrink-0 items-end justify-center self-end sm:h-40 sm:w-32 md:h-48 md:w-40 lg:h-52 lg:w-44">
              <Image
                src="/nova-tutor.webp"
                alt="Nova AI Tutor"
                fill
                priority
                sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, (max-width: 1024px) 176px, 192px"
                className="object-contain object-bottom drop-shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-card">
          {[
            { label: "Grade", value: gradeInfo.grade },
            { label: "Accuracy", value: `${result.percentage}%` },
            { label: "Points", value: `+${result.pointsAwarded}` },
          ].map((stat) => (
            <div key={stat.label} className="px-2 py-3 text-center sm:py-4 md:py-5">
              <div className="text-lg font-bold text-foreground sm:text-2xl md:text-3xl">
                {stat.value}
              </div>
              <div className="mt-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-row items-center gap-3">
        <AppButton
          onClick={onRetry}
          className="h-11 sm:h-12 flex-1 rounded-xl sm:rounded-2xl font-semibold"
        >
          <RefreshSVG className="mr-2 size-4" />
          {retryLabel}
        </AppButton>
      </div>

      {/* Per-question Breakdown */}
      <div>
        <div className="mb-4 flex items-center gap-2.5 sm:mb-5 sm:gap-3">
          <div className="h-5 sm:h-6 w-1.5 rounded-full bg-primary" />
          <Typography variant="h3" className="text-base font-bold tracking-tight sm:text-lg md:text-xl">
            Answer Breakdown
            <span className="ml-2 text-xs sm:text-sm font-semibold text-muted-foreground">
              {questions.length} questions
            </span>
          </Typography>
        </div>
        <div className="space-y-3">
          {questions.map((question, idx) => {
            const qResult = result.questionResults[question.id];
            const isCorrect = qResult?.correct ?? false;
            const selectedOpt = question.mcqOptions?.find(
              (o) => o.id?.toUpperCase() === qResult?.selectedAnswer?.toUpperCase()
            );
            const correctOpt = question.mcqOptions?.find(
              (o) => o.id?.toUpperCase() === qResult?.correctAnswer?.toUpperCase()
            );

            const isUrdu =
              isUrduText(question.questionText) ||
              paper.subject?.toLowerCase().includes("urdu") ||
              question.mcqOptions?.some((opt) => isUrduText(opt.text));

            return (
              <div
                key={question.id}
                className={cn("rounded-2xl border p-3.5 sm:p-5 transition-all", {
                  "border-primary/30 bg-primary/5": isCorrect,
                  "border-destructive/30 bg-destructive/5": !isCorrect,
                })}
              >
                <div className="min-w-0">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Q{idx + 1}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      · {question.marks} mark{question.marks !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div
                    dir={isUrdu ? "rtl" : "ltr"}
                    className={cn(
                      "mb-3 text-xs sm:text-sm font-medium text-foreground",
                      isUrdu ? "font-urdu text-right leading-[2.2]" : "leading-relaxed text-left"
                    )}
                    dangerouslySetInnerHTML={{
                      __html: convertMathToHTML(question.questionText),
                    }}
                  />
                  {question.imageUrl ? (
                    <QuestionImage
                      src={question.imageUrl}
                      alt="Question diagram"
                      className="max-h-32 rounded-lg border border-border/40 bg-muted/20"
                      skeletonHeightClass="h-28 sm:h-32"
                      containerClassName="mb-3 sm:mb-4"
                    />
                  ) : null}
                  {!qResult?.selectedAnswer ? (
                    <div
                      dir={isUrdu ? "rtl" : "ltr"}
                      className={cn(
                        "mb-2 inline-flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground",
                        isUrdu && "font-urdu text-right"
                      )}
                    >
                      <SyllabusSVG className="size-3.5 shrink-0" />
                      <span>{isUrdu ? "حل نہیں کیا گیا" : "Not attempted"}</span>
                    </div>
                  ) : null}

                  {question.mcqOptions && question.mcqOptions.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {question.mcqOptions.map((opt, optIdx) => {
                        const normalize = (value?: string | null) =>
                          String(value ?? "").trim().toUpperCase();
                        const optLetter = opt.id || String.fromCharCode(65 + optIdx);
                        const optIdNorm = normalize(optLetter);
                        const optTextNorm = normalize(opt.text);

                        const isCorrectOption =
                          (qResult?.correctAnswer != null &&
                            (normalize(qResult.correctAnswer) === optIdNorm ||
                             normalize(qResult.correctAnswer) === optTextNorm)) ||
                          (question.correctAnswer != null &&
                            (normalize(question.correctAnswer) === optIdNorm ||
                             normalize(question.correctAnswer) === optTextNorm));

                        const isSelectedOption =
                          qResult?.selectedAnswer != null &&
                          (normalize(qResult.selectedAnswer) === optIdNorm ||
                           normalize(qResult.selectedAnswer) === optTextNorm);

                        const isOptUrdu = isUrdu || isUrduText(opt.text);
                        const rawText = (opt.text || "").trim();
                        const strippedText = rawText
                          .replace(/^([A-Da-d][\.\)]|\([A-Da-d]\))\s*/, "")
                          .trim();
                        const displayText = strippedText || rawText;

                        return (
                          <div
                            key={opt.id || optIdx}
                            dir={isOptUrdu ? "rtl" : "ltr"}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-xl border p-2.5 sm:p-3 transition-colors",
                              isCorrectOption
                                ? "border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-500/20"
                                : isSelectedOption
                                  ? "border-destructive/50 bg-destructive/10 dark:bg-destructive/20"
                                  : "border-border/60 bg-card/60"
                            )}
                          >
                            <div
                              className={cn(
                                "flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1",
                                isOptUrdu && "flex-row-reverse text-right"
                              )}
                            >
                              <span
                                className={cn(
                                  "flex size-6.5 sm:size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold font-sans select-none",
                                  isCorrectOption
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : isSelectedOption
                                      ? "bg-destructive text-destructive-foreground shadow-xs"
                                      : "bg-muted text-muted-foreground border border-border/50"
                                )}
                              >
                                {optLetter}
                              </span>
                              <span
                                className={cn(
                                  "min-w-0 flex-1 text-xs sm:text-sm",
                                  isCorrectOption
                                    ? "text-emerald-700 dark:text-emerald-300 font-semibold"
                                    : isSelectedOption
                                      ? "text-destructive font-semibold"
                                      : "text-foreground font-medium",
                                  isOptUrdu
                                    ? "font-urdu text-right leading-[2.2]"
                                    : "text-left leading-relaxed"
                                )}
                                dangerouslySetInnerHTML={{
                                  __html: convertMathToHTML(displayText),
                                }}
                              />
                            </div>

                            {/* Status badges */}
                            <div className="flex shrink-0 items-center gap-1.5">
                              {isCorrectOption && isSelectedOption ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                                  <CheckCircleSVG className="size-3" />
                                  {isOptUrdu ? "صحیح / آپ کا انتخاب" : "Correct / Your Choice"}
                                </span>
                              ) : isCorrectOption ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                  <CheckCircleSVG className="size-3" />
                                  {isOptUrdu ? "صحیح جواب" : "Correct"}
                                </span>
                              ) : isSelectedOption ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 text-destructive px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                  <CloseCircleSVG className="size-3" />
                                  {isOptUrdu ? "آپ کا جواب" : "Your Choice"}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={cn("flex flex-col gap-1.5 sm:gap-2", isUrdu ? "items-end" : "items-start")}>
                      {!isCorrect && qResult?.selectedAnswer ? (
                        <div
                          dir={isUrdu ? "rtl" : "ltr"}
                          className={cn(
                            "flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive",
                            isUrdu && "font-urdu text-right"
                          )}
                        >
                          <CloseCircleSVG className="mt-0.5 size-3.5 shrink-0" />
                          <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                            <span className="font-bold">{isUrdu ? "آپ کا جواب:" : "Your answer:"}</span>
                            <div className="break-words">
                              <span className="font-semibold">
                                {selectedOpt
                                  ? `${selectedOpt.id}. `
                                  : qResult?.selectedAnswer
                                  ? `Option ${qResult.selectedAnswer} `
                                  : "— "}
                              </span>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: convertMathToHTML(selectedOpt?.text ?? ""),
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : null}
                      <div
                        dir={isUrdu ? "rtl" : "ltr"}
                        className={cn(
                          "flex items-start gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-medium text-primary dark:bg-muted dark:text-foreground",
                          isUrdu && "font-urdu text-right"
                        )}
                      >
                        <CheckCircleSVG className="mt-0.5 size-3.5 shrink-0" />
                        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                          <span className="font-bold">{isUrdu ? "صحیح جواب:" : "Correct:"}</span>
                          <div className="break-words">
                            <span className="font-semibold">
                              {correctOpt
                                ? `${correctOpt.id}. `
                                : qResult?.correctAnswer
                                ? `Option ${qResult.correctAnswer} `
                                : "— "}
                            </span>
                            <span
                              dangerouslySetInnerHTML={{
                                __html: convertMathToHTML(correctOpt?.text ?? ""),
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
