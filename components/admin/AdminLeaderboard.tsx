"use client";

import { Typography } from "@/components/ui/Typography";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import LeaderboardSVG from "@/public/svgs/LeaderboardSVG";
import { formatCapitalizeWords, formatSchoolName } from "@/lib/utils";

interface AdminLeaderboardProps {
  data: {
    students: Array<{
      id: string;
      name: string;
      schoolName?: string;
      class?: string;
      points: number;
    }>;
    schools: Array<{
      name: string;
      studentCount?: number;
      points: number;
    }>;
  };
}

export default function AdminLeaderboard({ data }: AdminLeaderboardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
      <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="mb-4 flex items-center gap-2 sm:mb-5">
          <LeaderboardSVG className="size-5 text-primary" />
          <Typography variant="h3" className="text-base font-bold sm:text-lg">
            Top Students
          </Typography>
        </div>

        <div className="space-y-2.5">
          {data.students.length > 0 ? (
            data.students.map((student, index) => (
              <div
                key={student.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-muted/30 px-3 py-3 sm:px-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-xs font-bold leading-snug text-foreground">
                      {formatCapitalizeWords(student.name)}
                    </p>
                    <Typography variant="muted" className="break-words text-xs">
                      {student.schoolName ? formatSchoolName(student.schoolName) : "Independent Student"} · Class {student.class}
                    </Typography>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-bold text-primary">
                  {Number(student.points || 0).toLocaleString()} pts
                </p>
              </div>
            ))
          ) : (
            <div className="py-10 text-center">
              <Typography variant="muted">No students found</Typography>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="mb-4 flex items-center gap-2 sm:mb-5">
          <BuildingSVG className="size-5 text-primary" />
          <Typography variant="h3" className="text-base font-bold sm:text-lg">
            Top Schools
          </Typography>
        </div>

        <div className="space-y-2.5">
          {data.schools.length > 0 ? (
            data.schools.map((school, index) => (
              <div
                key={`${school.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-muted/30 px-3 py-3 sm:px-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-xs font-bold leading-snug text-foreground">
                      {formatSchoolName(school.name)}
                    </p>
                    <Typography variant="muted" className="break-words text-xs">
                      {school.studentCount ?? 0} students
                    </Typography>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-bold text-primary">
                  {Number(school.points || 0).toLocaleString()} pts
                </p>
              </div>
            ))
          ) : (
            <div className="py-10 text-center">
              <Typography variant="muted">No school data available</Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
