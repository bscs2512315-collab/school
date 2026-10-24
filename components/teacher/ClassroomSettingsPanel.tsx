"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Copy } from "lucide-react";
import NotificationSVG from "@/public/svgs/NotificationSVG";
import EditSVG from "@/public/svgs/EditSVG";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import LockSVG from "@/public/svgs/LockSVG";
import SecureExamSVG from "@/public/svgs/SecureExamSVG";
import { apiPatch } from "@/lib/api/api-client";
import { API_ENDPOINTS } from "@/constants/endpoints";
import { cn } from "@/lib/utils";
import { Class, Subject } from "@/types/enums";
import AppButton from "@/components/AppButton";
import AppSelect from "@/components/AppSelect";

export const BOARD_OPTIONS = [
  { value: "AKUEB", label: "AKUEB (Aga Khan University Examination Board)", badge: "Available Assets" },
  { value: "Federal Board", label: "Federal Board (FBISE)", badge: "Extensible" },
  { value: "Sindh Board", label: "Sindh Board (BSEK / BIEK)", badge: "Extensible" },
  { value: "Punjab Board", label: "Punjab Board (BISE Lahore/Rawalpindi)", badge: "Extensible" },
  { value: "KPK Board", label: "KPK Board (BISE Peshawar)", badge: "Extensible" },
  { value: "Balochistan Board", label: "Balochistan Board (BISE Quetta)", badge: "Extensible" },
  { value: "Cambridge / O-Levels", label: "Cambridge Assessment International (CAIE)", badge: "Extensible" },
];

export interface ClassroomInfoDetails {
  id: string;
  name?: string | null;
  teacherId: string;
  teacherName: string;
  teacherImage: string | null;
  subject: string;
  classLevel: string;
  board?: string;
  pinCode?: string | null;
  pin?: string | null;
  schoolName: string | null;
  visibility?: "school" | "private";
  settings?: {
    autoApprovePaper2?: boolean;
    allowPostApprovalEdit?: boolean;
    notifyOnAttemptSubmission?: boolean;
  };
}

interface ClassroomSettingsPanelProps {
  classroomId: string;
  classroom?: ClassroomInfoDetails | null;
  settings?: {
    autoApprovePaper2?: boolean;
    allowPostApprovalEdit?: boolean;
    notifyOnAttemptSubmission?: boolean;
  };
  onSettingsSaved: (patch: Record<string, boolean>) => void;
  onClassroomUpdated?: (updated: Partial<ClassroomInfoDetails>) => void;
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
        checked ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

export default function ClassroomSettingsPanel({
  classroomId,
  classroom,
  settings: initialSettings,
  onSettingsSaved,
  onClassroomUpdated,
}: ClassroomSettingsPanelProps) {
  // Class Details Form State
  const [name, setName] = useState(classroom?.name || "");
  const [board, setBoard] = useState(classroom?.board || "AKUEB");
  const [subject, setSubject] = useState(classroom?.subject || "Mathematics");
  const [classLevel, setClassLevel] = useState(classroom?.classLevel || "X");
  const [savingDetails, setSavingDetails] = useState(false);

  // Settings Toggles State
  const [autoApprove, setAutoApprove] = useState(
    initialSettings?.autoApprovePaper2 ?? false,
  );
  const [allowEdit, setAllowEdit] = useState(
    initialSettings?.allowPostApprovalEdit ?? true,
  );
  const [notifyAttempts, setNotifyAttempts] = useState(
    initialSettings?.notifyOnAttemptSubmission ?? true,
  );
  const [savingToggle, setSavingToggle] = useState<string | null>(null);

  const hasDetailsChanged =
    (name ?? "").trim() !== (classroom?.name ?? "").trim() ||
    board !== (classroom?.board || "AKUEB") ||
    subject !== (classroom?.subject || "Mathematics") ||
    classLevel !== (classroom?.classLevel || "X");

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);

    try {
      const payload = {
        name: name.trim() || undefined,
        board,
        subject,
        classLevel,
      };

      const res = await apiPatch<any>(
        API_ENDPOINTS.TEACHER.CLASSROOM(classroomId),
        payload,
      );

      if (!res.success) {
        toast.error(res.message || "Failed to save classroom details");
        return;
      }

      toast.success("Classroom details updated successfully");
      if (onClassroomUpdated) {
        onClassroomUpdated({
          name: name.trim() || null,
          board,
          subject,
          classLevel,
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update classroom",
      );
    } finally {
      setSavingDetails(false);
    }
  };

  const handleToggle = async (
    key: "autoApprovePaper2" | "allowPostApprovalEdit" | "notifyOnAttemptSubmission",
    value: boolean,
  ) => {
    if (key === "autoApprovePaper2") setAutoApprove(value);
    if (key === "allowPostApprovalEdit") setAllowEdit(value);
    if (key === "notifyOnAttemptSubmission") setNotifyAttempts(value);

    setSavingToggle(key);
    try {
      const res = await apiPatch(
        API_ENDPOINTS.TEACHER.CLASSROOM(classroomId),
        { [key]: value },
      );
      if (!res.success) {
        toast.error(res.message || "Failed to save setting");
        if (key === "autoApprovePaper2") setAutoApprove(!value);
        if (key === "allowPostApprovalEdit") setAllowEdit(!value);
        if (key === "notifyOnAttemptSubmission") setNotifyAttempts(!value);
        return;
      }
      onSettingsSaved({ [key]: value });
      toast.success("Setting saved");
    } catch {
      toast.error("Failed to save setting");
      if (key === "autoApprovePaper2") setAutoApprove(!value);
      if (key === "allowPostApprovalEdit") setAllowEdit(!value);
      if (key === "notifyOnAttemptSubmission") setNotifyAttempts(!value);
    } finally {
      setSavingToggle(null);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
          Classroom Settings & Details
        </h3>
        <p className="text-xs text-muted-foreground">
          Manage classroom profile, curriculum board, subject, and evaluation rules.
        </p>
      </div>

      {/* Edit Class Details Card */}
      <form
        onSubmit={handleSaveDetails}
        className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-5"
      >
        <div className="flex items-center gap-3 pb-2 border-b border-border/60">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <EditSVG className="size-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Classroom Information</h4>
            <p className="text-xs text-muted-foreground">
              Update the name, examination board, subject, and grade for this classroom.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Classroom Display Name */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-foreground">Classroom Title / Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mathematics - Grade 10"
              className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-foreground focus:border-primary focus:bg-background focus:outline-hidden transition-all"
            />
          </div>

          {/* Board Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <BuildingSVG className="size-3.5 text-muted-foreground" />
              Examination Board
            </label>
            <AppSelect
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              options={BOARD_OPTIONS.map((opt) => ({
                value: opt.value,
                label: `${opt.label}${opt.badge ? ` (${opt.badge})` : ""}`,
              }))}
            />
          </div>

          {/* Class Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ClassroomSVG className="size-3.5 text-muted-foreground" />
              Class / Grade
            </label>
            <AppSelect
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              options={Object.values(Class).map((c) => ({
                value: c,
                label: `Class ${c}`,
              }))}
            />
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <BookOpenSVG className="size-3.5 text-muted-foreground" />
              Subject
            </label>
            <AppSelect
              searchable
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              options={Object.values(Subject).map((s) => ({
                value: s,
                label: s,
              }))}
            />
          </div>

          {/* PIN Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <LockSVG className="size-3.5 text-amber-400" />
              Student Join PIN
            </label>
            <div className="rounded-xl border border-border bg-muted/20 px-3.5 py-2 text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="font-mono text-sm font-black tracking-widest text-primary">
                {classroom?.pinCode || classroom?.pin || "PIN Generated"}
              </span>
              <button
                type="button"
                onClick={() => {
                  const p = classroom?.pinCode || classroom?.pin || "";
                  if (p) {
                    navigator.clipboard.writeText(p);
                    toast.success(`PIN ${p} copied!`);
                  }
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors"
              >
                <Copy className="size-3" />
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <AppButton
            type="submit"
            disabled={savingDetails || !hasDetailsChanged}
            className={cn(
              "rounded-xl h-10 px-5 text-xs font-bold",
              hasDetailsChanged && !savingDetails
                ? "shadow-md shadow-primary/20"
                : "opacity-60 cursor-not-allowed",
            )}
          >
            {savingDetails ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Saving Details...
              </>
            ) : (
              "Save Classroom Details"
            )}
          </AppButton>
        </div>
      </form>

      {/* Grading & Approval Preferences Header */}
      <div>
        <h4 className="text-sm font-bold text-foreground">Grading & Result Preferences</h4>
        <p className="text-xs text-muted-foreground">
          Configure how student evaluations and mark revisions are handled.
        </p>
      </div>

      {/* Auto-approve toggle */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
              <SecureExamSVG className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">
                Auto-approve Paper 2 results
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                When enabled, Paper 2 results are automatically approved by Nova
                as soon as grading finishes — students see marks immediately
                without waiting for manual teacher review.
              </p>
            </div>
          </div>

          {savingToggle === "autoApprovePaper2" ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : (
            <ToggleSwitch
              checked={autoApprove}
              onChange={(v) => void handleToggle("autoApprovePaper2", v)}
            />
          )}
        </div>
      </div>

      {/* Post-approval edit toggle */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
              <EditSVG className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">
                Allow editing marks after approval
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                When enabled, you can open any already-approved Paper 2 result
                and update individual question marks. The student is notified
                each time you save.
              </p>
            </div>
          </div>

          {savingToggle === "allowPostApprovalEdit" ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : (
            <ToggleSwitch
              checked={allowEdit}
              onChange={(v) => void handleToggle("allowPostApprovalEdit", v)}
            />
          )}
        </div>
      </div>

      {/* Attempt submission notifications toggle */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
              <NotificationSVG className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">
                Attempt Submission Notifications
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                Receive real-time notifications and alerts whenever a student completes,
                submits, or retakes an assigned Paper 1 or Paper 2 test in this classroom.
              </p>
            </div>
          </div>

          {savingToggle === "notifyOnAttemptSubmission" ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : (
            <ToggleSwitch
              checked={notifyAttempts}
              onChange={(v) => void handleToggle("notifyOnAttemptSubmission", v)}
            />
          )}
        </div>
      </div>
    </section>
  );
}
