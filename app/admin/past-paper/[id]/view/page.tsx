"use client";

import { useParams, useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import { Typography } from "@/components/ui/Typography";
import AppButton from "@/components/AppButton";
import { Edit, Printer, ScanSearch, CheckCircle2 } from "lucide-react";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import AppQueryState from "@/components/AppQueryState";
import { convertMathToHTML, isUrduText } from "@/lib/utils/math-notation";
import { cn } from "@/lib/utils";
import { useAdminPastPaperDetail } from "@/hooks/admin/useAdminPastPaperDetail";
import { getChoiceBadgeLabel } from "@/lib/paper/choice-badge";

export default function ViewPastPaperPage() {
  const router = useRouter();
  const params = useParams();
  const paperId = params.id as string;
  const paperQuery = useAdminPastPaperDetail(paperId);

  return (
    <PageContainer>
      <AppQueryState
        query={paperQuery}
        loadingMessage="Assembling paper view..."
        errorMessage="The assessment you are trying to access is no longer available."
        onRetry={() => paperQuery.refetch()}
        fullScreen={false}
      >
        {(paper) => (
          <>
            <div className="no-print">
              <PageHeader
                title={paper.subject}
                onBack={() => {
                  const redirectRoute =
                    paper.paperNumber === 2
                      ? FRONTEND_ROUTES.ADMIN_PAST_PAPERS_2
                      : FRONTEND_ROUTES.ADMIN_PAST_PAPERS_1;
                  router.push(redirectRoute);
                }}
                actions={
                  <div className="flex gap-3">
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
                      onClick={() => router.push(FRONTEND_ROUTES.ADMIN_PAST_PAPER_EDIT(paperId))}
                    >
                      <Edit className="mr-2 size-5" />
                      Edit paper
                    </AppButton>
                  </div>
                }
              />
            </div>

            <div className="mb-10 hidden border-b-[3px] border-black pb-8 text-center print:block">
              <div className="mb-6 flex justify-center">
                <img src="/Logo.png" alt="Logo" className="h-20 w-auto" />
              </div>
              <Typography className="mb-2 text-3xl font-black uppercase tracking-[0.3em] text-black">
                {paper.board}
              </Typography>
              <Typography className="mb-4 text-xl font-black italic text-black">
                Formal Examination Paper
              </Typography>
              <div className="mt-6 flex justify-center gap-12 border-t-2 border-black/10 pt-6 text-lg font-bold text-black">
                <span>LEVEL: {paper.class}</span>
                <span>DOMAIN: {paper.subject}</span>
                <span>SESSION: {paper.year}</span>
              </div>
            </div>

            <div className="space-y-10">
              <div className="no-print flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1.5 rounded-full bg-primary" />
                  <Typography variant="h3" className="text-2xl font-black tracking-tight">
                    Assessment Flow{" "}
                    <span className="ml-2 font-black text-primary/40">
                      {paper.questions?.length || 0}
                    </span>
                  </Typography>
                </div>
              </div>

              <div className="space-y-8 print:space-y-12">
                {paper.questions.map((question, qIdx) => {
                  const isUrdu = isUrduText(question.questionText) || paper.subject?.toLowerCase().includes("urdu");
                  const isSindh = Boolean(paper.board?.toLowerCase().includes("sindh"));
                  const choiceLabel = getChoiceBadgeLabel(paper.questions, qIdx, isSindh);

                  return (
                    <div
                      key={question.id}
                      className="group relative rounded-[2.5rem] border border-border/60 bg-card p-8 shadow-2xl shadow-foreground/2 transition-all duration-500 hover:shadow-primary/5 sm:p-10 print:rounded-none print:border-none print:bg-transparent print:p-0"
                    >
                      <div className="no-print absolute right-0 top-0 -mr-4 -mt-4 p-10 opacity-0 transition-all duration-700 group-hover:opacity-100">
                        <ScanSearch className="size-24 rotate-12 text-primary/5" />
                      </div>

                      <div className="relative z-10 mb-8 flex items-start justify-between">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className={cn(
                            "rounded-2xl border-2 border-transparent bg-primary px-5 py-2 text-lg font-black text-primary-foreground shadow-lg shadow-primary/20 print:rounded-none print:border-black print:bg-transparent print:text-xl print:text-black print:shadow-none",
                            isUrdu && "font-urdu"
                          )}>
                            {isUrdu
                              ? `س ${isSindh ? (qIdx + 1) : `${question.questionNumber}${question.questionPart || ""}`}`
                              : `Q${isSindh ? (qIdx + 1) : `${question.questionNumber}${question.questionPart || ""}`}`}
                          </div>
                          {choiceLabel && (
                            <span className="no-print inline-flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-black uppercase text-amber-600 dark:text-amber-400">
                              {choiceLabel}
                            </span>
                          )}
                          <div className="no-print flex flex-col">
                            <span className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-primary">
                              Classification
                            </span>
                            <span className={cn(
                              "rounded-xl border px-3 py-1 text-xs font-black uppercase",
                              question.questionType === "ERQ"
                                ? "border-purple-500/30 bg-purple-500/15 text-purple-600 dark:text-purple-400"
                                : question.questionType === "CRQ"
                                ? "border-sky-500/30 bg-sky-500/15 text-sky-600 dark:text-sky-400"
                                : "border-border/50 bg-muted text-foreground"
                            )}>
                              {isSindh
                                ? question.questionType === "ERQ"
                                  ? "Long QnA"
                                  : question.questionType === "CRQ"
                                  ? "Short QnA"
                                  : question.questionType
                                : question.questionType}
                            </span>
                          </div>
                          {question.chapterName ? (
                            <div className="no-print flex flex-col">
                              <span className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Unit Alignment
                              </span>
                              <span className="rounded-xl border border-border/30 bg-muted/40 px-3 py-1 text-xs font-bold text-muted-foreground">
                                {question.chapterName}
                              </span>
                            </div>
                          ) : null}
                        </div>
                        <div className="rounded-xl border border-border/40 bg-muted/50 px-4 py-2 text-sm font-black print:rounded-none print:border-black/20 print:bg-transparent print:text-lg">
                          Marks:{" "}
                          <span className="text-primary print:text-black">
                            {question.marks || "____"}
                          </span>
                        </div>
                      </div>

                      <div
                        dir={isUrdu ? "rtl" : "ltr"}
                        className={cn(
                          "relative z-10 mb-8 whitespace-pre-wrap text-lg font-medium text-foreground print:text-xl print:text-black",
                          isUrdu ? "font-urdu text-right leading-[2.2]" : "leading-relaxed text-left"
                        )}
                      >
                        <span
                          dangerouslySetInnerHTML={{ __html: convertMathToHTML(question.questionText) }}
                        />
                      </div>

                      {question.imageUrl ? (
                        <div className="relative z-10 mb-8">
                          <img
                            src={question.imageUrl}
                            alt={`Question ${question.questionNumber} Asset`}
                            className="max-h-64 rounded-2xl border border-border/60 bg-muted/20 object-contain"
                          />
                        </div>
                      ) : null}

                      {question.questionType === "MCQ" && question.mcqOptions ? (
                        <div
                          dir={isUrdu ? "rtl" : "ltr"}
                          className={cn(
                            "relative z-10 space-y-3",
                            isUrdu ? "mr-2 sm:mr-6 print:mr-12" : "ml-2 sm:ml-6 print:ml-12"
                          )}
                        >
                          {question.mcqOptions.map((opt, idx) => {
                            const isCorrect = question.correctAnswer === opt.id;
                            const isOptUrdu = isUrdu || isUrduText(opt.text);
                            return (
                              <div
                                key={opt.id}
                                dir={isOptUrdu ? "rtl" : "ltr"}
                                className={cn(
                                  "group/opt flex items-center gap-5 rounded-3xl border-2 p-4 transition-all duration-300",
                                  {
                                    "border-green-500/20 bg-green-500/5 shadow-lg shadow-green-500/5": isCorrect,
                                    "border-transparent hover:bg-muted/30": !isCorrect,
                                  },
                                  isOptUrdu && "font-urdu"
                                )}
                              >
                                <div
                                  className={cn(
                                    "flex size-8 shrink-0 items-center justify-center rounded-2xl font-sans text-xs font-black leading-none select-none self-center transition-all duration-300",
                                    {
                                      "border-2 border-green-500 bg-green-500 text-white shadow-lg shadow-green-500/20": isCorrect,
                                      "bg-muted/80 text-foreground/85 dark:bg-zinc-800 dark:text-zinc-100 dark:border dark:border-zinc-700/60 group-hover/opt:bg-muted dark:group-hover/opt:bg-zinc-700": !isCorrect,
                                    },
                                  )}
                                >
                                  <span className="flex items-center justify-center leading-none">
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                </div>
                                <span
                                  className={cn(
                                    "flex-1 text-lg font-bold self-center",
                                    isCorrect ? "text-green-700 dark:text-green-400" : "text-foreground",
                                    isOptUrdu ? "text-right leading-[2.2]" : "text-left"
                                  )}
                                  dangerouslySetInnerHTML={{ __html: convertMathToHTML(opt.text) }}
                                />
                                {isCorrect ? (
                                  <div className="flex shrink-0 animate-in items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-1.5 text-green-600 duration-500 fade-in zoom-in dark:text-green-400">
                                    <CheckCircle2 className="size-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                      Correct Response
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}

                      {question.questionType === "CRQ" || question.questionType === "ERQ" ? (
                        <div className="mt-8 space-y-6 opacity-60 print:opacity-100">
                          {Array.from({ length: question.questionType === "CRQ" ? 4 : 10 }).map(
                            (_, i) => (
                              <div
                                key={i}
                                className="h-8 w-full border-b-2 border-dashed border-border/50 print:border-black/30"
                              />
                            ),
                          )}
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
                .PageContainer_root {
                  max-width: 100% !important;
                  padding: 0 !important;
                  border: none !important;
                }
              }
            `}</style>
          </>
        )}
      </AppQueryState>
    </PageContainer>
  );
}
