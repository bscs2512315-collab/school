"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import { Typography } from "@/components/ui/Typography";
import AppButton from "@/components/AppButton";
import { Printer } from "lucide-react";
import PlaySVG from "@/public/svgs/PlaySVG";
import { convertMathToHTML, isUrduText } from "@/lib/utils/math-notation";
import { cn } from "@/lib/utils";
import AppQueryState from "@/components/AppQueryState";
import QuestionImage from "@/components/exam/QuestionImage";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { useStudentPastPaperDetail } from "@/hooks/student/useStudentPastPaperDetail";
import { getChoiceBadgeLabel } from "@/lib/paper/choice-badge";
import PaperHeaderSponsor from "@/components/exam/PaperHeaderSponsor";

export default function StudentViewPastPaperPage() {
  const router = useRouter();
  const params = useParams();
  const paperId = params.id as string;
  const paperQuery = useStudentPastPaperDetail(paperId);
  const [isStartingExam, setIsStartingExam] = useState(false);

  const handleStartExam = () => {
    setIsStartingExam(true);
    router.push(FRONTEND_ROUTES.STUDENT_PAST_PAPER_ATTEMPT(paperId));
  };

  return (
    <PageContainer>
      <AppQueryState
        query={paperQuery}
        loadingMessage="Loading past paper..."
        errorMessage="The examination paper you are looking for is not available."
        onRetry={() => paperQuery.refetch()}
        fullScreen={false}
        emptyTitle="Paper Not Found"
        emptyMessage="The examination paper you are looking for is not available."
      >
        {(paper) => (
          <>
            <div className="no-print">
              <PageHeader
                title={paper.subject}
                onBack={() => router.push(paper.paperNumber === 2 ? FRONTEND_ROUTES.STUDENT_PAST_PAPERS_2 : FRONTEND_ROUTES.STUDENT_PAST_PAPERS_1)}
                actions={
                  <div className="flex items-center gap-3">
                    <PaperHeaderSponsor placement={paper.paperNumber === 1 ? "paper_1" : "paper_2"} />
                    <AppButton
                      variant="outline"
                      className="h-12 rounded-2xl border-border/60 px-6 font-bold hover:bg-muted"
                      onClick={() => window.print()}
                    >
                      <span className="mr-2">Print</span>
                      <Printer className="size-5" />
                    </AppButton>
                    <AppButton
                      className="h-12 rounded-2xl px-8 font-bold shadow-lg shadow-primary/20"
                      isLoading={isStartingExam}
                      onClick={handleStartExam}
                    >
                      <PlaySVG className="mr-2 size-5" />
                      Start Exam
                    </AppButton>
                  </div>
                }
              />
            </div>

            <div className="mb-10 hidden border-b-[3px] border-black pb-8 text-center print:mb-10 print:block">
              <div className="mb-6 flex justify-center">
                <img src="/Logo.png" alt="Logo" className="h-20 w-auto" />
              </div>
              <Typography className="mb-2 text-3xl font-black uppercase tracking-[0.3em] text-black">
                {paper.board}
              </Typography>
              <div className="mt-6 flex justify-center gap-12 border-t-2 border-black/10 pt-6 text-lg font-bold text-black">
                <span>LEVEL: {paper.class}</span>
                <span>DOMAIN: {paper.subject}</span>
                <span>SESSION: {paper.year}</span>
              </div>
            </div>

            <div className="space-y-10">
              <div className="no-print flex items-center gap-3 px-2">
                <div className="h-6 w-1.5 rounded-full bg-primary" />
                <Typography variant="h3" className="text-2xl font-black tracking-tight">
                  Assessment Preview{" "}
                  <span className="ml-2 font-black text-primary/40">{paper.questions?.length || 0}</span>
                </Typography>
              </div>

              <div className="space-y-6 print:space-y-12 sm:space-y-8">
                {paper.questions.map((question, qIdx) => {
                  const isUrdu = isUrduText(question.questionText) || paper.subject?.toLowerCase().includes("urdu");
                  const isSindh = Boolean(paper.board?.toLowerCase().includes("sindh"));
                  const choiceLabel = getChoiceBadgeLabel(paper.questions, qIdx, isSindh);

                  return (
                    <div
                      key={question.id}
                      className="group relative rounded-2xl border border-border/60 bg-card p-4 shadow-xl shadow-foreground/2 transition-all hover:shadow-primary/5 sm:rounded-[2.5rem] sm:p-10 print:rounded-none print:border-none print:bg-transparent print:p-0"
                    >
                      {/* Chapter Name in separate line at top of Question no. on small screens */}
                      {question.chapterName ? (
                        <div className="no-print mb-1.5 flex items-center sm:hidden">
                          <span className="inline-flex items-center rounded-xl bg-black text-white dark:bg-white dark:text-black px-2.5 py-0.5 text-xs font-bold shadow-xs">
                            <span>{question.chapterName}</span>
                          </span>
                        </div>
                      ) : null}

                      <div className="relative z-10 mb-4 flex flex-col gap-3 border-b border-border/40 pb-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:border-b-0 sm:pb-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                          <div className={cn(
                            "flex size-9 items-center justify-center rounded-xl bg-primary text-xs font-black text-primary-foreground shadow-md shadow-primary/20 print:rounded-none print:border-black print:bg-transparent print:text-black print:shadow-none sm:size-auto sm:px-5 sm:py-2 sm:text-lg",
                            isUrdu && "font-urdu"
                          )}>
                            {isUrdu
                              ? `س ${isSindh ? (qIdx + 1) : `${question.questionNumber}${question.questionPart || ""}`}`
                              : `Q${isSindh ? (qIdx + 1) : `${question.questionNumber}${question.questionPart || ""}`}`}
                          </div>
                          {question.chapterName ? (
                            <span className="no-print hidden sm:inline-flex items-center gap-1 rounded-xl border border-border/60 bg-muted/60 px-3 py-1 text-xs font-bold text-foreground">
                              {question.chapterName}
                            </span>
                          ) : null}
                          {choiceLabel && (
                            <span className="no-print inline-flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 sm:px-3 sm:py-1 sm:text-xs">
                              {choiceLabel}
                            </span>
                          )}
                          <div className="no-print flex flex-col">
                            <span className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-primary">
                              Classification
                            </span>
                            <span className="rounded-xl border border-border/50 bg-muted px-2 py-0.5 text-[10px] font-black uppercase text-foreground sm:px-3 sm:py-1 sm:text-xs">
                              {isSindh
                                ? question.questionType === "ERQ"
                                ? "Long QnA"
                                : question.questionType === "CRQ"
                                ? "Short QnA"
                                : question.questionType
                                : question.questionType}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 self-end rounded-xl border border-border/40 bg-muted/50 px-3 py-1.5 text-xs font-black print:border-black/20 print:bg-transparent sm:self-auto sm:px-4 sm:py-2 sm:text-sm">
                          Marks:{" "}
                          <span className="text-primary print:text-black">{question.marks || "____"}</span>
                        </div>
                      </div>

                      <div
                        dir={isUrdu ? "rtl" : "ltr"}
                        className={cn(
                          "relative z-10 mb-6 text-base font-medium text-foreground print:text-black sm:mb-8 sm:text-lg",
                          isUrdu ? "font-urdu text-right leading-[2.2]" : "leading-relaxed text-left"
                        )}
                      >
                        <span
                          dangerouslySetInnerHTML={{ __html: convertMathToHTML(question.questionText) }}
                        />
                      </div>

                      {question.imageUrl ? (
                        <div className="relative z-10 mb-6 sm:mb-8">
                          <QuestionImage
                            src={question.imageUrl}
                            alt={`Question ${question.questionNumber}`}
                            className="max-h-48 rounded-xl border border-border/60 bg-muted/20 sm:max-h-64 sm:rounded-2xl"
                            skeletonHeightClass="h-48 sm:h-64"
                          />
                        </div>
                      ) : null}

                      {question.questionType === "MCQ" && question.mcqOptions ? (
                        <div
                          dir={isUrdu ? "rtl" : "ltr"}
                          className={cn(
                            "relative z-10 mt-4 space-y-2 sm:mt-6 sm:space-y-3",
                            isUrdu ? "mr-1 sm:mr-6" : "ml-1 sm:ml-6"
                          )}
                        >
                          {question.mcqOptions.map((opt, idx) => {
                            const isOptUrdu = isUrdu || isUrduText(opt.text);
                            return (
                              <div
                                key={opt.id}
                                dir={isOptUrdu ? "rtl" : "ltr"}
                                className={cn(
                                  "flex items-center gap-3 rounded-2xl border-2 border-transparent p-3 transition-all hover:bg-muted/30 sm:gap-5 sm:rounded-3xl sm:p-4",
                                  isOptUrdu && "font-urdu"
                                )}
                              >
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground/85 dark:bg-zinc-800 dark:text-zinc-100 dark:border dark:border-zinc-700/60 font-sans text-[10px] font-black leading-none select-none self-center sm:size-8 sm:text-xs">
                                  <span className="flex items-center justify-center leading-none">
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                </div>
                                <span
                                  className={cn(
                                    "text-sm font-bold text-foreground sm:text-lg self-center",
                                    isOptUrdu ? "text-right leading-[2.2]" : "text-left"
                                  )}
                                  dangerouslySetInnerHTML={{ __html: convertMathToHTML(opt.text) }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : null}

                      {question.questionType === "CRQ" || question.questionType === "ERQ" ? (
                        <div className="mt-6 space-y-4 opacity-60 print:opacity-100 sm:mt-8 sm:space-y-6">
                          {Array.from({ length: question.questionType === "CRQ" ? 4 : 8 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-6 w-full border-b-2 border-dashed border-border/50 print:border-black/30 sm:h-8"
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <style jsx global>{`
              @media print {
                @page {
                  margin: 2cm;
                }
                body {
                  background: background !important;
                  color: black !important;
                }
                .no-print {
                  display: none !important;
                }
                nav,
                footer,
                .sidebar,
                .header {
                  display: none !important;
                }
                main {
                  padding: 0 !important;
                  margin: 0 !important;
                }
              }
            `}</style>
          </>
        )}
      </AppQueryState>
    </PageContainer>
  );
}
