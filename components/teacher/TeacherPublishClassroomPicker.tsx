"use client";

import AppSelect from "@/components/AppSelect";
import {
  classroomPublishLabel,
  filterClassroomsForPaper,
  useTeacherClassrooms,
  type TeacherClassroomOption,
} from "@/hooks/teacher/useTeacherClassrooms";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface TeacherPublishClassroomPickerProps {
  subject: string;
  classLevel: string;
  value: string;
  onChange: (classroomId: string, classroom?: TeacherClassroomOption) => void;
  className?: string;
  /** When true, list every classroom (e.g. image-generated drafts). */
  allowAnyClassroom?: boolean;
}

export default function TeacherPublishClassroomPicker({
  subject,
  classLevel,
  value,
  onChange,
  className,
  allowAnyClassroom = false,
}: TeacherPublishClassroomPickerProps) {
  const classroomsQuery = useTeacherClassrooms(
    allowAnyClassroom || Boolean(subject && classLevel),
  );
  const matches = useMemo(
    () =>
      allowAnyClassroom
        ? classroomsQuery.data ?? []
        : filterClassroomsForPaper(classroomsQuery.data, subject, classLevel),
    [allowAnyClassroom, classroomsQuery.data, subject, classLevel],
  );

  const options = matches.map((c) => ({
    value: c.id,
    label: classroomPublishLabel(c),
  }));

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
        Publish to classroom
      </label>
      {classroomsQuery.isLoading ? (
        <p className="text-xs text-muted-foreground">Loading classrooms…</p>
      ) : matches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {allowAnyClassroom
            ? "No classrooms yet. Create a school or private classroom first, then publish."
            : `No classroom matches ${subject} · Class ${classLevel}. Create a school or private classroom first, then publish.`}
        </p>
      ) : (
        <AppSelect
          searchable
          value={value}
          options={options}
          placeholder="Select classroom"
          onChange={(e) => {
            const next = e.target.value;
            const selected = matches.find((c) => c.id === next);
            onChange(next, selected);
          }}
        />
      )}
    </div>
  );
}
