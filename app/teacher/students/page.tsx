"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AppButton from "@/components/AppButton";
import AppLoader from "@/components/AppLoader";
import AppSearch from "@/components/AppSearch";
import AppState from "@/components/AppState";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import { Typography } from "@/components/ui/Typography";
import {
  type TeacherStudent,
  useTeacherStudents,
} from "@/hooks/teacher/useTeacherStudents";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { cn, formatCapitalizeWords, formatEmail } from "@/lib/utils";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import StudentsSVG from "@/public/svgs/StudentsSVG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import MailSVG from "@/public/svgs/MailSVG";
import ReviewExamsSVG from "@/public/svgs/ReviewExamsSVG";
import SubjectsSVG from "@/public/svgs/SubjectsSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import HistorySVG from "@/public/svgs/HistorySVG";

const INITIAL_CHAPTER_GROUPS = 4;
const INITIAL_STUDENTS = 6;

function progressClass(progress: number): string {
  if (progress >= 75) return "text-trend-up";
  if (progress >= 50) return "text-rank-2";
  return "text-trend-down";
}

function formatActivityDate(value: string | null): string {
  if (!value) return "No activity yet";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function StudentAvatar({
  student,
  className,
}: {
  student: TeacherStudent;
  className?: string;
}) {
  return student.profile_image ? (
    <img
      src={student.profile_image}
      alt={student.name}
      className={cn("rounded-xl object-cover", className)}
    />
  ) : (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-primary/10 font-bold text-primary",
        className,
      )}
    >
      {student.name.charAt(0).toUpperCase()}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
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

export default function TeacherStudentsPage() {
  const studentsQuery = useTeacherStudents();
  const students = studentsQuery.data ?? [];
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [showAllStudents, setShowAllStudents] = useState(false);

  const classOptions = useMemo(() => {
    const classes = Array.from(
      new Set(
        students.flatMap((student) =>
          student.classrooms.map((classroom) => classroom.classLevel),
        ),
      ),
    ).sort();
    return [
      { value: "all", label: "All classes" },
      ...classes.map((classLevel) => ({
        value: classLevel,
        label: `Class ${classLevel}`,
      })),
    ];
  }, [students]);

  const subjectOptions = useMemo(() => {
    const subjects = Array.from(
      new Set(
        students.flatMap((student) =>
          student.subjects.map((subject) => subject.subject),
        ),
      ),
    ).sort();
    return [
      { value: "all", label: "All subjects" },
      ...subjects.map((subject) => ({ value: subject, label: subject })),
    ];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        (student.username || "").toLowerCase().includes(query);
      const matchesClass =
        classFilter === "all" ||
        student.classrooms.some(
          (classroom) => classroom.classLevel === classFilter,
        );
      const matchesSubject =
        subjectFilter === "all" ||
        student.subjects.some(
          (subject) => subject.subject === subjectFilter,
        );
      return matchesSearch && matchesClass && matchesSubject;
    });
  }, [classFilter, searchTerm, students, subjectFilter]);

  const chapterGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        subject: string;
        chapter: string;
        students: Array<{ id: string; name: string; progress: number }>;
      }
    >();

    for (const student of filteredStudents) {
      for (const subject of student.subjects) {
        if (
          subjectFilter !== "all" &&
          subject.subject !== subjectFilter
        ) {
          continue;
        }
        for (const chapter of subject.chapters) {
          const key = `${subject.subject}::${chapter.chapter}`;
          const group = groups.get(key) ?? {
            subject: subject.subject,
            chapter: chapter.chapter,
            students: [],
          };
          group.students.push({
            id: student.id,
            name: student.name,
            progress: chapter.progress,
          });
          groups.set(key, group);
        }
      }
    }

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        average: Math.round(
          group.students.reduce(
            (sum, student) => sum + student.progress,
            0,
          ) / group.students.length,
        ),
        students: group.students.sort((a, b) => b.progress - a.progress),
      }))
      .sort((a, b) => b.average - a.average);
  }, [filteredStudents, subjectFilter]);

  const averageScore = students.length
    ? Math.round(
        students.reduce((sum, student) => sum + student.avg_score, 0) /
          students.length,
      )
    : 0;
  const averageCompletion = students.length
    ? Math.round(
        students.reduce(
          (sum, student) => sum + student.completion_rate,
          0,
        ) / students.length,
      )
    : 0;
  const activeStudents = students.filter(
    (student) => student.last_active_at,
  ).length;
  const visibleChapterGroups = showAllChapters
    ? chapterGroups
    : chapterGroups.slice(0, INITIAL_CHAPTER_GROUPS);
  const visibleStudents = showAllStudents
    ? filteredStudents
    : filteredStudents.slice(0, INITIAL_STUDENTS);

  if (studentsQuery.isLoading) return <AppLoader />;

  return (
    <PageContainer className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <PageHeader title="Students Report" showLine />
          <Typography variant="muted" className="mt-1 text-sm">
            Track every enrolled student across your classrooms, subjects, and
            chapters.
          </Typography>
        </div>
        <Link
          href={FRONTEND_ROUTES.TEACHER_ACTIVITIES}
          className="inline-flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <HistorySVG className="size-4" />
          <span>Live Student Activities</span>
        </Link>
      </div>

      {students.length === 0 ? (
        <AppState
          isEmpty
          title="No students yet"
          description="Students will appear here after they join one of your classrooms."
          icon={StudentsSVG}
          fullScreen={false}
        />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: "Enrolled",
                value: students.length,
                detail: "Across your classrooms",
                icon: StudentsSVG,
              },
              {
                label: "Average score",
                value: `${averageScore}%`,
                detail: "Latest graded attempts",
                icon: TrophySVG,
              },
              {
                label: "Completion",
                value: `${averageCompletion}%`,
                detail: "Assigned papers attempted",
                icon: ReviewExamsSVG,
              },
              {
                label: "Active students",
                value: activeStudents,
                detail: "With recorded activity",
                icon: ClockSVG,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/50 bg-card/40 p-4 sm:p-5"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <stat.icon className="size-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                  {stat.detail}
                </p>
              </div>
            ))}
          </section>

          <AppSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search students..."
            dropdowns={[
              {
                id: "class",
                placeholder: "Class",
                value: classFilter,
                onChange: (event) => setClassFilter(event.target.value),
                options: classOptions,
              },
              {
                id: "subject",
                placeholder: "Subject",
                value: subjectFilter,
                onChange: (event) => setSubjectFilter(event.target.value),
                options: subjectOptions,
              },
            ]}
            hasActiveFilters={
              classFilter !== "all" ||
              subjectFilter !== "all" ||
              Boolean(searchTerm.trim())
            }
            onClearFilters={() => {
              setClassFilter("all");
              setSubjectFilter("all");
              setSearchTerm("");
            }}
            resultsCount={filteredStudents.length}
          />

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <Typography className="flex items-center gap-2 text-lg font-bold">
                  <SubjectsSVG className="size-5 text-primary" />
                  Chapter performance
                </Typography>
                <Typography variant="muted" className="mt-1 text-xs sm:text-sm">
                  Compare student mastery for every assessed chapter.
                </Typography>
              </div>
              {chapterGroups.length > INITIAL_CHAPTER_GROUPS ? (
                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-xl"
                  onClick={() => setShowAllChapters((value) => !value)}
                >
                  {showAllChapters ? "Show less" : "View more"}
                </AppButton>
              ) : null}
            </div>

            {visibleChapterGroups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-6 text-center">
                <SubjectsSVG className="mx-auto size-8 text-primary" />
                <p className="mt-2 text-sm font-semibold">
                  No chapter results yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Chapter comparisons appear after students complete assigned
                  papers.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {visibleChapterGroups.map((group) => (
                  <div
                    key={`${group.subject}-${group.chapter}`}
                    className="rounded-2xl border border-border/50 bg-card/40 p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary">
                          {group.subject}
                        </p>
                        <h3 className="mt-1 truncate font-bold">
                          {group.chapter}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "text-xl font-bold",
                            progressClass(group.average),
                          )}
                        >
                          {group.average}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          class average
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {group.students.slice(0, 5).map((student) => (
                        <Link
                          key={student.id}
                          href={FRONTEND_ROUTES.TEACHER_STUDENT_REPORT(
                            student.id,
                          )}
                          className="block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                            <span className="min-w-0 break-words font-semibold">
                              {student.name}
                            </span>
                            <span
                              className={cn(
                                "font-bold",
                                progressClass(student.progress),
                              )}
                            >
                              {student.progress}%
                            </span>
                          </div>
                          <ProgressBar value={student.progress} />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <Typography className="flex items-center gap-2 text-lg font-bold">
                  <StudentsSVG className="size-5 text-primary" />
                  Student reports
                </Typography>
                <Typography variant="muted" className="mt-1 text-xs sm:text-sm">
                  Open a student report for subject, chapter, and activity
                  details.
                </Typography>
              </div>
              {filteredStudents.length > INITIAL_STUDENTS ? (
                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-xl"
                  onClick={() => setShowAllStudents((value) => !value)}
                >
                  {showAllStudents ? "Show less" : "View more"}
                </AppButton>
              ) : null}
            </div>

            {visibleStudents.length === 0 ? (
              <AppState
                isEmpty
                title="No matching students"
                description="Try a different name, class, or subject filter."
                icon={StudentsSVG}
                fullScreen={false}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleStudents.map((student) => (
                  <div
                    key={student.id}
                    className="rounded-2xl border border-border/50 bg-card/40 p-4 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-center gap-3">
                      <StudentAvatar student={student} className="size-12" />
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-bold">{formatCapitalizeWords(student.name)}</p>
                        <div className="flex items-start gap-1.5 text-muted-foreground">
                          <MailSVG className="size-3 shrink-0" />
                          <span className="min-w-0 break-all text-xs lowercase">
                            {formatEmail(student.email)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="my-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-muted/40 p-2">
                        <p className="text-base font-bold">
                          {student.avg_score}%
                        </p>
                        <p className="text-xs uppercase text-muted-foreground">
                          score
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-2">
                        <p className="text-base font-bold">
                          {student.completion_rate}%
                        </p>
                        <p className="text-xs uppercase text-muted-foreground">
                          complete
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-2">
                        <p className="text-base font-bold">
                          {student.attempts_count}
                        </p>
                        <p className="text-xs uppercase text-muted-foreground">
                          attempts
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 break-words text-xs text-muted-foreground">
                        Last active {formatActivityDate(student.last_active_at)}
                      </p>
                      <Link
                        href={FRONTEND_ROUTES.TEACHER_STUDENT_REPORT(
                          student.id,
                        )}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary/10 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
                      >
                        View report
                        <ArrowRightSVG className="size-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </>
      )}
    </PageContainer>
  );
}

function StudentReport({
  student,
  onClose,
}: {
  student: TeacherStudent;
  onClose: () => void;
}) {
  return (
    <section className="scroll-mt-24 overflow-hidden rounded-2xl border border-primary/30 bg-card/50 shadow-sm">
      <div className="bg-primary p-5 text-primary-foreground sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <StudentAvatar
              student={student}
              className="size-14 bg-primary-foreground/15 text-primary-foreground"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70">
                Complete student report
              </p>
              <h2 className="truncate text-xl font-bold">{formatCapitalizeWords(student.name)}</h2>
              <p className="truncate text-xs text-primary-foreground/75 lowercase">
                {formatEmail(student.email)}
              </p>
            </div>
          </div>
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={onClose}
          >
            Close report
          </AppButton>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Average", value: `${student.avg_score}%` },
            { label: "Completion", value: `${student.completion_rate}%` },
            { label: "Attempts", value: student.attempts_count },
            { label: "Points", value: student.points },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl bg-primary-foreground/10 p-3"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-primary-foreground/65">
                {metric.label}
              </p>
              <p className="mt-1 text-xl font-bold">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div>
            <Typography className="flex items-center gap-2 font-bold">
              <ClassroomSVG className="size-5 text-primary" />
              Classrooms
            </Typography>
            <div className="mt-3 flex flex-wrap gap-2">
              {student.classrooms.map((classroom) => (
                <span
                  key={classroom.id}
                  className="rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary"
                >
                  {classroom.subject} · Class {classroom.classLevel}
                </span>
              ))}
            </div>
          </div>

          <div>
            <Typography className="flex items-center gap-2 font-bold">
              <SubjectsSVG className="size-5 text-primary" />
              Subject and chapter breakdown
            </Typography>
            <div className="mt-3 space-y-3">
              {student.subjects.map((subject) => (
                <div
                  key={subject.subject}
                  className="rounded-2xl border border-border/50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">{subject.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {subject.attempts} of {subject.assigned} papers completed
                      </p>
                    </div>
                    <p
                      className={cn(
                        "text-lg font-bold",
                        progressClass(subject.progress),
                      )}
                    >
                      {subject.progress}%
                    </p>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={subject.progress} />
                  </div>
                  {subject.chapters.length > 0 ? (
                    <div className="mt-4 space-y-2.5 border-t border-border/50 pt-3">
                      {subject.chapters.map((chapter) => (
                        <div key={chapter.chapter}>
                          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                            <span className="truncate text-muted-foreground">
                              {chapter.chapter}
                            </span>
                            <span
                              className={cn(
                                "font-bold",
                                progressClass(chapter.progress),
                              )}
                            >
                              {chapter.progress}%
                            </span>
                          </div>
                          <ProgressBar value={chapter.progress} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Typography className="flex items-center gap-2 font-bold">
            <ClockSVG className="size-5 text-primary" />
            Recent activity
          </Typography>
          {student.recent_activity.length > 0 ? (
            <div className="mt-3 space-y-3">
              {student.recent_activity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/50 p-3"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ReviewExamsSVG className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.subject} ·{" "}
                      {formatActivityDate(activity.attemptedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    {activity.score !== null ? (
                      <p
                        className={cn(
                          "font-bold",
                          progressClass(activity.score),
                        )}
                      >
                        {activity.score}%
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-rank-2">
                        In review
                      </p>
                    )}
                    <p className="text-xs capitalize text-muted-foreground">
                      {activity.paperType.replace("paper", "Paper ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-6 text-center">
              <ClockSVG className="mx-auto size-8 text-primary" />
              <p className="mt-2 text-sm font-semibold">No activity yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Assigned paper attempts will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
