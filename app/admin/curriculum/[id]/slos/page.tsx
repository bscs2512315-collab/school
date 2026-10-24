"use client";

import PageContainer from "@/components/PageContainer";
import { Typography } from "@/components/ui/Typography";
import { useRouter, useParams } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import AppButton from "@/components/AppButton";
import PageHeader from "@/components/PageHeader";
import { Printer, X } from "lucide-react";
import SLOTable from "@/components/SLOTable";
import AppQueryState from "@/components/AppQueryState";
import { useAdminCurriculumDetail } from "@/hooks/admin/useAdminCurriculumDetail";
import type { Subtopic } from "@/lib/utils/syllabus-parser";

function getChapterSubtopics(chapter: {
  analyzed_content?: unknown;
  analyzedContent?: { subtopics?: unknown[] };
}): Subtopic[] {
  if (typeof chapter.analyzed_content === "string") {
    try {
      const parsed = JSON.parse(chapter.analyzed_content) as { subtopics?: Subtopic[] };
      return parsed.subtopics ?? [];
    } catch {
      return [];
    }
  }

  const fromSnake = (chapter.analyzed_content as { subtopics?: Subtopic[] } | undefined)?.subtopics;
  const fromCamel = chapter.analyzedContent?.subtopics as Subtopic[] | undefined;
  return fromSnake ?? fromCamel ?? [];
}

export default function ViewAllSLOsPage() {
  const router = useRouter();
  const params = useParams();
  const curriculumId = params?.id as string;

  const curriculumQuery = useAdminCurriculumDetail(curriculumId);

  return (
    <AppQueryState
      query={curriculumQuery}
      isEmpty={(data) => !data}
      emptyTitle="Curriculum Redacted"
      emptyMessage="The requested framework does not exist or has been decommissioned."
      errorMessage="Failed to fetch curriculum"
      onRetry={() => curriculumQuery.refetch()}
      fullScreen={false}
    >
      {(curriculum) => (
        <PageContainer className="relative z-10 px-6 py-16 print:mx-0 print:max-w-none print:bg-background print:px-0 print:py-0">
          <div className="pointer-events-none fixed inset-0 z-[-1] hidden items-center justify-center opacity-[0.04] print:flex">
            <img src="/Logo.png" alt="Watermark" className="w-[600px] grayscale" />
          </div>

          <div className="sticky top-0 z-20 mb-12 border-b border-border/50 bg-background/80 py-4 backdrop-blur-sm print:hidden">
            <PageHeader
              title={`${curriculum.subject} Syllabus`}
              actions={
                <>
                  <AppButton
                    variant="default"
                    className="h-12 rounded-2xl bg-primary px-8 font-black shadow-xl shadow-primary/20"
                    onClick={() => window.print()}
                  >
                    <Printer className="mr-2 h-5 w-5" />
                    Print All SLOs
                  </AppButton>
                  <AppButton
                    variant="outline"
                    className="h-12 rounded-2xl border-border/60 px-12 font-black"
                    onClick={() => router.push(FRONTEND_ROUTES.ADMIN_CURRICULUM_DETAIL(curriculumId))}
                  >
                    <X className="mr-2 h-5 w-5" />
                    Close View
                  </AppButton>
                </>
              }
              className="mb-0"
            />
          </div>

          <div className="relative mb-12 hidden h-[28cm] flex-col print:flex">
            <div className="mb-10 flex flex-col items-center border-b-[6px] border-primary pb-8 text-center">
              <div className="mb-4 rounded-3xl bg-primary/5 p-4 print:bg-transparent">
                <img src="/Logo.png" alt="Logo" className="h-20" />
              </div>
              <Typography
                variant="h1"
                className="mb-3 text-center text-5xl font-black uppercase tracking-tight text-primary"
              >
                Academic Syllabus Framework
              </Typography>
              <div className="flex gap-10 rounded-full border border-primary/10 bg-primary/5 px-8 py-2 text-[11px] font-black uppercase tracking-widest text-primary print:bg-transparent">
                <span>Subject: {curriculum.subject}</span>
                <span>Class: {curriculum.class}</span>
                <span>Board: {curriculum.board}</span>
                <span>Year: {new Date().getFullYear()}</span>
              </div>
            </div>

            <div className="flex flex-1 flex-col px-12 py-8">
              <Typography
                variant="h2"
                className="mb-8 border-l-8 border-primary pl-6 text-3xl font-black uppercase tracking-tighter text-primary"
              >
                Curriculum Overview
              </Typography>

              <div className="mb-8 w-full overflow-hidden rounded-3xl border-2 border-primary/20 print:border-black/10">
                <table className="w-full">
                  <thead className="bg-black text-background print:bg-transparent print:text-black">
                    <tr>
                      <th className="w-24 p-4 text-left text-[10px] font-black uppercase tracking-widest">
                        Unit No.
                      </th>
                      <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest">
                        Topic Title
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-transparent print:bg-transparent">
                    {curriculum.chapters.map((chapter) => (
                      <tr
                        key={chapter.id}
                        className="border-t border-primary/10 print:border-black/5 print:bg-transparent"
                      >
                        <td className="p-4 font-black text-primary print:text-black">
                          {chapter.chapterNumber.toString().padStart(2, "0")}
                        </td>
                        <td className="p-4 text-xs font-bold uppercase tracking-tight text-foreground print:text-black">
                          {chapter.chapterName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex gap-12 px-4">
                <div className="flex-1 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Framework Methodology
                  </div>
                  <Typography variant="muted" className="text-[11px] leading-relaxed">
                    Structured according to the latest educational directives, ensuring each Student
                    Learning Outcome is categorized by its cognitive level (Knowledge, Understanding,
                    Application).
                  </Typography>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Compliance & Accuracy
                  </div>
                  <Typography variant="muted" className="text-[11px] leading-relaxed">
                    All content has been verified for accuracy and alignment with the official board
                    syllabus, providing a definitive roadmap for both educators and students.
                  </Typography>
                </div>
              </div>

              <div className="mt-auto pt-12 text-center">
                <Typography
                  variant="muted"
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40"
                >
                  © {new Date().getFullYear()} ExBoard AI Educational Frameworks • Generated by
                  Muhammad Taha
                </Typography>
              </div>
            </div>

            <div className="print:break-after-page" />
          </div>

          <div className="space-y-32 print:space-y-12">
            {curriculum.chapters.map((chapter) => (
              <div key={chapter.id}>
                <SLOTable
                  chapterNumber={chapter.chapterNumber}
                  chapterName={chapter.chapterName}
                  subtopics={getChapterSubtopics(chapter)}
                  isEditMode={false}
                />
              </div>
            ))}
          </div>

          <div className="mt-24 hidden border-t border-gray-200 pt-8 text-center text-[10px] font-bold uppercase tracking-widest text-gray-500 print:block">
            Generated via ExBoard AI Admin Portal • {curriculum.subject} Syllabus
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-50 hidden h-1.5 bg-primary print:block" />
        </PageContainer>
      )}
    </AppQueryState>
  );
}
