"use client";

import AddSVG from "@/public/svgs/AddSVG";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import StudentsSVG from "@/public/svgs/StudentsSVG";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import AppDropdown from "@/components/AppDropdown";
import AppInput from "@/components/AppInput";
import AppLoader from "@/components/AppLoader";
import AppState from "@/components/AppState";
import ClassroomCard from "@/components/ClassroomCard";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Typography } from "@/components/ui/Typography";
import { API_ENDPOINTS, FRONTEND_ROUTES } from "@/constants/endpoints";
import { apiDelete, apiGet, apiPost } from "@/lib/api/api-client";
import { Class, Subject } from "@/types/enums";
import toast from "react-hot-toast";
import { useSubjectOptions } from "@/hooks/subjects/useSubjects";
import { BOARD_OPTIONS } from "@/components/teacher/ClassroomSettingsPanel";
import { normalizeClassLevel } from "@/lib/teacher/class-level";

interface Classroom {
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
  schoolName?: string | null;
  paperCount?: number;
}

const CLASS_ORDER: Record<string, number> = { IX: 0, X: 1, XI: 2, XII: 3 };
const CLASS_TABS = ["all", ...Object.values(Class)] as const;
type ClassTab = (typeof CLASS_TABS)[number];

export default function TeacherClassroomsPage() {
  const subjectOptions = useSubjectOptions(Object.values(Subject));
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [board, setBoard] = useState("AKUEB");
  const [subject, setSubject] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [classroomName, setClassroomName] = useState("");
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeClass, setActiveClass] = useState<ClassTab>("all");
  const [deleteTarget, setDeleteTarget] = useState<Classroom | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadClassrooms = useCallback(async () => {
    try {
      const res = await apiGet<Classroom[]>(API_ENDPOINTS.CLASSROOMS.LIST);
      if (res.success) setClassrooms(res.data);
    } catch {
      toast.error("Failed to load classrooms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClassrooms();
  }, [loadClassrooms]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return classrooms
      .filter((c) => {
        const normalizedClass = normalizeClassLevel(c.classLevel);
        if (activeClass !== "all" && normalizedClass !== activeClass) return false;
        if (!q) return true;
        return (
          (c.name || "").toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.classLevel.toLowerCase().includes(q) ||
          (c.pinCode || c.pin || "").toLowerCase().includes(q) ||
          (c.board || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const classDifference = (CLASS_ORDER[normalizeClassLevel(a.classLevel)] ?? 99) - (CLASS_ORDER[normalizeClassLevel(b.classLevel)] ?? 99);
        return classDifference || (a.name || a.subject).localeCompare(b.name || b.subject);
      });
  }, [activeClass, classrooms, searchTerm]);

  const handleCreate = async () => {
    if (!subject || !classLevel) {
      toast.error("Select a subject and class");
      return;
    }

    setCreating(true);
    try {
      const res = await apiPost<{
        id: string;
        name: string;
        pinCode?: string;
        pin?: string;
      }>(API_ENDPOINTS.TEACHER.CLASSROOMS, {
        subject,
        classLevel,
        board,
        name: classroomName.trim() || undefined,
      });
      if (!res.success) {
        toast.error(res.message || "Failed to create classroom");
        return;
      }

      const createdLabel =
        classroomName.trim() || `${subject} · Class ${classLevel}`;
      const pin = res.data?.pinCode || res.data?.pin || "";
      toast.success(
        `Classroom "${createdLabel}" created! PIN: ${pin}`,
        { duration: 5000 },
      );
      setModalOpen(false);
      setBoard("AKUEB");
      setSubject("");
      setClassLevel("");
      setClassroomName("");

      setLoading(true);
      await loadClassrooms();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create classroom",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiDelete(
        API_ENDPOINTS.TEACHER.CLASSROOM(deleteTarget.id),
      );
      if (!res.success) {
        toast.error(res.message || "Failed to delete classroom");
        return;
      }
      toast.success("Classroom deleted");
      setDeleteTarget(null);
      await loadClassrooms();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete classroom",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-12rem)] w-full flex-1 items-center justify-center">
        <AppLoader className="min-h-0" />
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="My Classrooms"
        actions={
          <AppButton
            type="button"
            className="rounded-xl h-11 sm:h-12 px-6 font-bold shadow-lg shadow-primary/20"
            onClick={() => setModalOpen(true)}
          >
            <AddSVG className="size-4 mr-2" />
            Create Classroom
          </AppButton>
        }
      />
      <div className="mb-6">
        <Typography variant="muted" className="text-sm">
          Create classrooms, assign practice tests, and share the unique 6-character PIN with your students to join.
        </Typography>
      </div>

      {classrooms.length > 0 ? (
        <>
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {CLASS_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={activeClass === tab}
                onClick={() => setActiveClass(tab)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                  activeClass === tab
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {tab === "all" ? "All" : tab}
              </button>
            ))}
          </div>
          <div className="mb-6 relative group">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by classroom name, subject, class, or PIN..."
            className="h-12 w-full rounded-2xl border border-border/40 bg-muted/30 pr-4 pl-11 text-sm font-medium outline-none transition-all focus:border-primary/50"
           />
           </div>
         </>
       ) : null}

      {filtered.length === 0 ? (
        <AppState
          isEmpty
          title={classrooms.length === 0 ? "No classrooms yet" : "No matches"}
          description={
            classrooms.length === 0
              ? "Create your first classroom by choosing a subject, class, and examination board."
              : "Try a different search."
          }
          icon={StudentsSVG}
          fullScreen={false}
          action={
            classrooms.length === 0
              ? {
                  label: "Create Classroom",
                  onClick: () => setModalOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <ClassroomCard
              key={c.id}
              id={c.id}
              name={c.name}
              teacherName={c.teacherName}
              teacherImage={c.teacherImage}
              subject={c.subject}
              classLevel={c.classLevel}
              board={c.board}
              pinCode={c.pinCode || c.pin}
              schoolName={c.schoolName}
              paperCount={c.paperCount ?? 0}
              href={FRONTEND_ROUTES.TEACHER_CLASSROOM(c.id)}
               showTeacher={false}
               colorByClass
               onDelete={() => setDeleteTarget(c)}
            />
          ))}
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
              <Typography className="font-bold">Create Classroom</Typography>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Examination Board
                </label>
                <AppDropdown
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  placeholder="Select board"
                  options={BOARD_OPTIONS.map((b) => ({
                    value: b.value,
                    label: `${b.label} ${b.badge ? `(${b.badge})` : ""}`,
                  }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Subject
                </label>
                <AppDropdown
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Select subject"
                  options={subjectOptions}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Class
                </label>
                <AppDropdown
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  placeholder="Select class"
                  options={Object.values(Class).map((c) => ({
                    value: c,
                    label: `Class ${c}`,
                  }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Classroom / Section Name (Optional)
                </label>
                <AppInput
                  placeholder="e.g. Morning Batch, Section A"
                  value={classroomName}
                  onChange={(e) => setClassroomName(e.target.value)}
                  className="rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 border-t border-border/40 p-5">
              <AppButton
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </AppButton>
              <AppButton
                type="button"
                className="flex-1 rounded-xl font-black"
                disabled={creating || !subject || !classLevel}
                onClick={() => void handleCreate()}
              >
                {creating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <AddSVG className="size-4 mr-1.5" />
                )}
                Create Classroom
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmationModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Delete classroom?"
        message={
          deleteTarget
            ? `${deleteTarget.name || deleteTarget.subject} will be removed from your classrooms. Past results stay on record, but students will lose access.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </PageContainer>
  );
}
