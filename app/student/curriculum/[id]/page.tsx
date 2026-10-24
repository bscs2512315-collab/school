"use client";

import { useParams, useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import { Typography } from "@/components/ui/Typography";
import PageHeader from "@/components/PageHeader";
import AppState from "@/components/AppState";
import AppQueryState from "@/components/AppQueryState";
import UnitCard from "@/components/UnitCard";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import { useStudentCurriculumDetail } from "@/hooks/student/useStudentCurriculumDetail";
import { getLearningRoutes, getStoredUserRole } from "@/lib/routes/learning-routes";

export default function StudentCurriculumDetailPage() {
  const router = useRouter();
  const params = useParams();
  const curriculumId = params?.id as string;
  const curriculumQuery = useStudentCurriculumDetail(curriculumId);
  const learningRoutes = getLearningRoutes(getStoredUserRole());

  return (
    <PageContainer>
      <AppQueryState
        query={curriculumQuery}
        loadingMessage="Loading curriculum..."
        errorMessage="Failed to load curriculum details."
        onRetry={() => curriculumQuery.refetch()}
        fullScreen={false}
      >
        {(curriculum) => (
          <div className="animate-in fade-in duration-500">
            <PageHeader title={curriculum.subject} />

            <section className="mb-8 overflow-hidden rounded-2xl border border-border/60 bg-card sm:mb-10 sm:rounded-3xl">
              <div className="bg-primary px-4 py-4 sm:px-6 sm:py-5">
                <div className="min-w-0 space-y-1">
                  <Typography className="text-lg font-bold tracking-tight text-primary-foreground sm:text-xl">
                    {curriculum.subject}
                  </Typography>
                  <Typography className="text-xs text-primary-foreground/75">
                    Class {curriculum.class}
                    {curriculum.board ? ` · ${curriculum.board}` : null}
                  </Typography>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-5 sm:gap-4 sm:px-6 sm:py-6">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-12 sm:rounded-2xl">
                  <SyllabusSVG className="size-5 sm:size-6" />
                </div>
                <div className="min-w-0">
                  <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total units
                  </p>
                  <p className="break-words text-base font-bold tracking-tight text-foreground sm:text-lg">
                    {curriculum.chaptersCount}{" "}
                    <span className="font-medium text-muted-foreground">
                      {curriculum.chaptersCount === 1 ? "chapter" : "chapters"}
                    </span>
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between gap-3">
                <Typography className="text-sm font-semibold text-foreground sm:text-base">
                  Course overview
                </Typography>
                <Typography className="text-xs text-muted-foreground">
                  {curriculum.chapters?.length ?? 0}{" "}
                  {(curriculum.chapters?.length ?? 0) === 1 ? "unit" : "units"}
                </Typography>
              </div>

              <AppState
                isEmpty={!curriculum.chapters || curriculum.chapters.length === 0}
                title="No Units Yet"
                description="This subject's learning units are being prepared."
                icon={SyllabusSVG}
                fullScreen={false}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                  {curriculum.chapters?.map((chapter) => (
                    <UnitCard
                      key={chapter.id}
                      chapterNumber={chapter.chapterNumber}
                      chapterName={chapter.chapterName}
                      onViewSLOs={() => {
                        router.push(
                          learningRoutes.curriculumChapter(curriculumId, chapter.id),
                        );
                      }}
                      onClick={() => {
                        router.push(
                          learningRoutes.curriculumChapter(curriculumId, chapter.id),
                        );
                      }}
                    />
                  ))}
                </div>
              </AppState>
            </section>
          </div>
        )}
      </AppQueryState>
    </PageContainer>
  );
}
