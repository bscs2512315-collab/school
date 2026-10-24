"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppLoader from "@/components/AppLoader";
import AppState from "@/components/AppState";
import PageContainer from "@/components/PageContainer";
import { Typography } from "@/components/ui/Typography";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { useTeacherStudents } from "@/hooks/teacher/useTeacherStudents";
import { cn, formatCapitalizeWords, formatEmail } from "@/lib/utils";
import ChallengeSVG from "@/public/svgs/ChallengeSVG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import MailSVG from "@/public/svgs/MailSVG";
import ReviewExamsSVG from "@/public/svgs/ReviewExamsSVG";
import StarSVG from "@/public/svgs/StarSVG";
import SubjectsSVG from "@/public/svgs/SubjectsSVG";
import TrophySVG from "@/public/svgs/TrophySVG";

function progressTextClass(progress: number): string {
  if (progress >= 75) return "text-trend-up";
  if (progress >= 50) return "text-rank-2";
  return "text-trend-down";
}

function performanceLabel(progress: number): string {
  if (progress >= 75) return "Strong performance";
  if (progress >= 50) return "Developing";
  return "Needs support";
}

function formatDate(value: string | null): string {
  if (!value) return "No activity recorded";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "Time not recorded";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all", {
          "bg-trend-up": value >= 75,
          "bg-rank-2": value >= 50 && value < 75,
          "bg-trend-down": value < 50,
        })}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default function TeacherStudentReportPage() {
  const params = useParams<{ studentId: string }>();
  const studentsQuery = useTeacherStudents();
  const studentId = decodeURIComponent(params.studentId);
  const student = studentsQuery.data?.find(
    (candidate) => candidate.id === studentId,
  );

  if (studentsQuery.isLoading) return <AppLoader />;

  if (studentsQuery.isError) {
    return (
      <PageContainer>
        <AppState
          variant="error"
          title="Unable to load report"
          description="The student report could not be loaded. Please try again."
          fullScreen={false}
        />
      </PageContainer>
    );
  }

  if (!student) {
    return (
      <PageContainer className="space-y-5">
        <AppState
          isEmpty
          title="Student not found"
          description="This student is not enrolled in any of your active classrooms."
          icon={ChallengeSVG}
          fullScreen={false}
        />
      </PageContainer>
    );
  }

  const strongestSubject = [...student.subjects].sort(
    (a, b) => b.progress - a.progress,
  )[0];
  const chapters = student.subjects.flatMap((subject) =>
    subject.chapters.map((chapter) => ({
      ...chapter,
      subject: subject.subject,
    })),
  );
  const strongestChapter = [...chapters].sort(
    (a, b) => b.progress - a.progress,
  )[0];
  const supportChapter = [...chapters].sort(
    (a, b) => a.progress - b.progress,
  )[0];

  return (
    <PageContainer className="space-y-5 sm:space-y-6 lg:space-y-8">

      <section className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg sm:rounded-3xl sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-br from-sidebar-from via-primary to-sidebar-to" />
          <div className="absolute right-0 top-0 size-48 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {student.profile_image ? (
              <div className="relative size-20 shrink-0 overflow-hidden rounded-full border-2 border-primary-foreground/25 sm:size-24">
                <Image
                  src={student.profile_image}
                  alt={student.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-full border-2 border-primary-foreground/25 bg-primary-foreground/10 text-3xl font-bold sm:size-24">
                {student.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70">
                Complete student report
              </p>
              <h1 className="mt-1 break-words text-2xl font-bold sm:text-3xl">
                {formatCapitalizeWords(student.name)}
              </h1>
              <div className="mt-2 flex items-start gap-2 text-sm text-primary-foreground/80">
                <MailSVG className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0 break-all lowercase">{formatEmail(student.email)}</span>
              </div>
              <p className="mt-2 break-words text-sm text-primary-foreground/75">
                Last active: {formatDate(student.last_active_at)}
              </p>
            </div>

            <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4 sm:min-w-40 sm:text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-primary-foreground/65">
                Overall standing
              </p>
              <p className="mt-1 text-3xl font-bold">{student.avg_score}%</p>
              <p className="mt-1 break-words text-xs text-primary-foreground/75">
                {performanceLabel(student.avg_score)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: "Average score",
                value: `${student.avg_score}%`,
                icon: TrophySVG,
              },
              {
                label: "Completion",
                value: `${student.completion_rate}%`,
                icon: ReviewExamsSVG,
              },
              {
                label: "Attempts",
                value: student.attempts_count,
                icon: ClockSVG,
              },
              {
                label: "Points",
                value: student.points,
                icon: StarSVG,
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl bg-primary-foreground/10 p-3 sm:p-4"
              >
                <metric.icon className="size-5 text-primary-foreground/80" />
                <p className="mt-3 break-words text-xs font-bold uppercase tracking-wider text-primary-foreground/65">
                  {metric.label}
                </p>
                <p className="mt-1 text-xl font-bold sm:text-2xl">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            label: "Strongest subject",
            value: strongestSubject
              ? `${strongestSubject.subject} · ${strongestSubject.progress}%`
              : "Not enough data",
            icon: SubjectsSVG,
          },
          {
            label: "Strongest chapter",
            value: strongestChapter
              ? `${strongestChapter.subject} · ${strongestChapter.chapter} · ${strongestChapter.progress}%`
              : "Not enough data",
            icon: TrophySVG,
          },
          {
            label: "Focus area",
            value: supportChapter
              ? `${supportChapter.subject} · ${supportChapter.chapter} · ${supportChapter.progress}%`
              : "Not enough data",
            icon: ReviewExamsSVG,
          },
        ].map((insight) => (
          <div
            key={insight.label}
            className="rounded-2xl border border-border/50 bg-card/40 p-4 sm:p-5"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <insight.icon className="size-5" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {insight.label}
            </p>
            <p className="mt-1 break-words font-bold text-foreground">
              {insight.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border/50 bg-card/40 p-4 sm:p-6">
        <Typography className="flex items-center gap-2 text-lg font-bold">
          <ClassroomSVG className="size-5 shrink-0 text-primary" />
          Enrolled classrooms
        </Typography>
        <Typography variant="muted" className="mt-1 text-sm">
          Subjects and classes taught by you.
        </Typography>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {student.classrooms.map((classroom) => (
            <Link
              key={classroom.id}
              href={FRONTEND_ROUTES.TEACHER_CLASSROOM(classroom.id)}
              className="rounded-2xl border border-border/50 bg-background/60 p-4 transition-colors hover:border-primary/30"
            >
              <p className="break-words font-bold text-foreground">
                {classroom.subject}
              </p>
              <p className="mt-1 break-words text-sm text-muted-foreground">
                Class {classroom.classLevel}
              </p>
              <p className="mt-3 break-words text-xs font-semibold text-primary">
                {classroom.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <Typography className="flex items-center gap-2 text-lg font-bold">
            <SubjectsSVG className="size-5 shrink-0 text-primary" />
            Subject and chapter performance
          </Typography>
          <Typography variant="muted" className="mt-1 text-sm">
            Progress is calculated from the latest approved attempt for each
            assigned paper.
          </Typography>
        </div>

        {student.subjects.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {student.subjects.map((subject) => (
              <article
                key={subject.subject}
                className="rounded-2xl border border-border/50 bg-card/40 p-4 sm:p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-bold">
                      {subject.subject}
                    </h2>
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      {subject.attempts} completed of {subject.assigned} assigned
                      papers
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p
                      className={cn(
                        "text-2xl font-bold",
                        progressTextClass(subject.progress),
                      )}
                    >
                      {subject.progress}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      subject mastery
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <ProgressBar value={subject.progress} />
                </div>

                {subject.chapters.length > 0 ? (
                  <div className="mt-5 space-y-4 border-t border-border/50 pt-4">
                    {subject.chapters.map((chapter) => (
                      <div key={chapter.chapter}>
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold">
                              {chapter.chapter}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {chapter.questions} assessed question
                              {chapter.questions === 1 ? "" : "s"}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 text-sm font-bold",
                              progressTextClass(chapter.progress),
                            )}
                          >
                            {chapter.progress}%
                          </span>
                        </div>
                        <ProgressBar value={chapter.progress} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 break-words rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
                    Chapter-level results will appear after an assessed paper
                    is completed.
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <AppState
            isEmpty
            title="No subject results yet"
            description="Performance analytics appear after this student completes an assigned paper."
            icon={SubjectsSVG}
            fullScreen={false}
          />
        )}
      </section>

      <section className="space-y-4">
        <div>
          <Typography className="flex items-center gap-2 text-lg font-bold">
            <ClockSVG className="size-5 shrink-0 text-primary" />
            Recent learning activity
          </Typography>
          <Typography variant="muted" className="mt-1 text-sm">
            Latest submissions across your classrooms.
          </Typography>
        </div>

        {student.recent_activity.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {student.recent_activity.map((activity) => {
              const needsReview = activity.score === null;
              const cardClassName = cn(
                "flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/40 p-4 sm:flex-row sm:items-center",
                { "transition-colors hover:border-primary/40 hover:bg-primary/5": needsReview },
              );
              const content = (
                <>
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ReviewExamsSVG className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-sm font-bold">
                      {activity.title}
                    </h3>
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      {activity.subject} ·{" "}
                      {activity.paperType.replace("paper", "Paper ")}
                    </p>
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      {formatDate(activity.attemptedAt)} ·{" "}
                      {formatDuration(activity.timeTaken)}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    {activity.score !== null ? (
                      <>
                        <p
                          className={cn(
                            "text-xl font-bold",
                            progressTextClass(activity.score),
                          )}
                        >
                          {activity.score}%
                        </p>
                        <p className="text-xs text-muted-foreground">approved</p>
                      </>
                    ) : (
                      <>
                        <p className="break-words text-sm font-bold text-rank-2">
                          In review
                        </p>
                        <p className="break-words text-xs capitalize text-muted-foreground">
                          {activity.status.replaceAll("_", " ")} · Review & approve
                        </p>
                      </>
                    )}
                  </div>
                </>
              );

              return needsReview ? (
                <Link
                  key={activity.id}
                  href={FRONTEND_ROUTES.TEACHER_CHECK_PAPER(activity.id)}
                  className={cardClassName}
                >
                  {content}
                </Link>
              ) : (
                <article key={activity.id} className={cardClassName}>
                  {content}
                </article>
              );
            })}
          </div>
        ) : (
          <AppState
            isEmpty
            title="No activity yet"
            description="Assigned paper submissions will appear here."
            icon={ClockSVG}
            fullScreen={false}
          />
        )}
      </section>
    </PageContainer>
  );
}
