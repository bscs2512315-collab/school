"use client";

import PageContainer from "@/components/PageContainer";
import { useRouter, useParams } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import PageHeader from "@/components/PageHeader";
import AppState from "@/components/AppState";
import AppQueryState from "@/components/AppQueryState";
import SLOTable from "@/components/SLOTable";
import { AlertCircle, BookOpen } from "lucide-react";
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

export default function ChapterSLOPage() {
  const router = useRouter();
  const params = useParams();
  const curriculumId = params?.id as string;
  const chapterId = params?.chapterId as string;

  const curriculumQuery = useAdminCurriculumDetail(curriculumId);

  return (
    <AppQueryState
      query={curriculumQuery}
      errorMessage="Failed to fetch curriculum"
      onRetry={() => curriculumQuery.refetch()}
      fullScreen={false}
    >
      {(curriculum) => {
        const chapter = curriculum.chapters.find((ch) => ch.id === chapterId);

        if (!chapter) {
          return (
            <PageContainer>
              <AppState
                isEmpty={true}
                title="Data Misalignment"
                description="We couldn't locate the specific unit framework you're looking for."
                icon={AlertCircle}
                action={{
                  label: "Return to Curriculum",
                  onClick: () => router.push(FRONTEND_ROUTES.ADMIN_CURRICULUM_DETAIL(curriculumId)),
                }}
                fullScreen={false}
              />
            </PageContainer>
          );
        }

        const subtopics = getChapterSubtopics(chapter);

        return (
          <PageContainer>
            <PageHeader
              title={`Unit ${chapter.chapterNumber}: ${chapter.chapterName}`}
              onBack={() => router.push(FRONTEND_ROUTES.ADMIN_CURRICULUM_DETAIL(curriculumId))}
            />

            <div className="mt-8">
              <AppState
                isEmpty={subtopics.length === 0}
                title="SLOs Pending"
                description="This unit has not been populated with extracted Student Learning Outcomes yet."
                icon={BookOpen}
                fullScreen={false}
              >
                <SLOTable
                  chapterNumber={chapter.chapterNumber}
                  chapterName={chapter.chapterName}
                  subtopics={subtopics}
                  isEditMode={false}
                />
              </AppState>
            </div>
          </PageContainer>
        );
      }}
    </AppQueryState>
  );
}
