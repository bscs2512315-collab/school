"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Check, X, Circle } from "lucide-react";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import EditSVG from "@/public/svgs/EditSVG";
import SubjectsSVG from "@/public/svgs/SubjectsSVG";
import AddSVG from "@/public/svgs/AddSVG";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import AppState from "@/components/AppState";
import AppLoader from "@/components/AppLoader";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Typography } from "@/components/ui/Typography";
import { SUBJECT_CATEGORIES } from "@/constants";
import { cn } from "@/lib/utils";
import {
  useAdminSubjects,
  useCreateAdminSubject,
  useUpdateAdminSubject,
  useDeleteAdminSubject,
  type AdminSubject,
} from "@/hooks/subjects/useSubjects";

const UNCATEGORIZED = "Uncategorized";

const selectClassName =
  "flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary";

export default function AdminSubjectsPage() {
  const subjectsQuery = useAdminSubjects();
  const createMutation = useCreateAdminSubject();
  const updateMutation = useUpdateAdminSubject();
  const deleteMutation = useDeleteAdminSubject();

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>(SUBJECT_CATEGORIES[0]);
  const [newComingSoon, setNewComingSoon] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string>("");
  const [subjectToDelete, setSubjectToDelete] = useState<AdminSubject | null>(null);

  const subjects = subjectsQuery.data ?? [];

  // Group subjects by their parent category for display.
  const groupedSubjects = useMemo(() => {
    const groups = new Map<string, AdminSubject[]>();
    for (const subject of subjects) {
      const key = subject.category?.trim() || UNCATEGORIZED;
      const list = groups.get(key) ?? [];
      list.push(subject);
      groups.set(key, list);
    }
    // Order: known categories first (as configured), then Uncategorized last.
    const order = [...SUBJECT_CATEGORIES, UNCATEGORIZED];
    return Array.from(groups.entries()).sort(
      (a, b) => order.indexOf(a[0]) - order.indexOf(b[0]),
    );
  }, [subjects]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Please enter a subject name");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name,
        category: newCategory,
        comingSoon: newComingSoon,
      });
      setNewName("");
      setNewComingSoon(false);
      toast.success("Subject added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add subject");
    }
  };

  const startEdit = (subject: AdminSubject) => {
    setEditingId(subject.id);
    setEditingName(subject.name);
    setEditingCategory(subject.category?.trim() || SUBJECT_CATEGORIES[0]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingCategory("");
  };

  const handleUpdate = async (
    subject: AdminSubject,
    overrides?: { isActive?: boolean; comingSoon?: boolean },
  ) => {
    const isEditing = editingId === subject.id;
    const name = (isEditing ? editingName : subject.name).trim();
    if (!name) {
      toast.error("Subject name cannot be empty");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: subject.id,
        name,
        category: isEditing ? editingCategory : subject.category ?? null,
        isActive: overrides?.isActive ?? subject.is_active,
        comingSoon: overrides?.comingSoon ?? subject.coming_soon,
      });
      if (isEditing) cancelEdit();
      toast.success("Subject updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update subject");
    }
  };

  const handleDelete = async () => {
    if (!subjectToDelete) return;
    try {
      await deleteMutation.mutateAsync(subjectToDelete.id);
      setSubjectToDelete(null);
      toast.success("Subject deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete subject");
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Subjects" showLine />

      <div className="space-y-8">
        <Typography variant="muted" className="text-sm font-medium">
          Manage the global list of subjects and their parent category (stream) used across
          syllabus, past papers, and filters.
        </Typography>

        {/* Add new subject */}
        <div className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
              <AddSVG className="size-5" />
            </div>
            <Typography variant="h3" className="text-lg font-black tracking-tight">
              Add Subject
            </Typography>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <AppInput
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              placeholder="e.g. Computer Science"
              className="flex-1"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className={cn(selectClassName, "sm:w-56")}
              aria-label="Subject category"
            >
              {SUBJECT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <AppButton
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="rounded-xl px-6 font-bold"
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <AddSVG className="mr-2 size-4" />
              )}
              Add
            </AppButton>
          </div>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-muted-foreground">
            <input
              type="checkbox"
              checked={newComingSoon}
              onChange={(e) => setNewComingSoon(e.target.checked)}
              className="size-4 accent-amber-500"
            />
            Mark as “Coming Soon” (hidden from students)
          </label>
        </div>

        {/* Subjects list, grouped by category */}
        {subjectsQuery.isLoading ? (
          <AppLoader />
        ) : subjectsQuery.isError ? (
          <AppState
            variant="error"
            description="Failed to load subjects. Please try again."
            action={{ label: "Retry", onClick: () => subjectsQuery.refetch() }}
            fullScreen={false}
          />
        ) : subjects.length === 0 ? (
          <AppState
            isEmpty
            title="No Subjects Yet"
            description="Add your first subject to get started."
            icon={SubjectsSVG}
            fullScreen={false}
          />
        ) : (
          <div className="space-y-6">
            {groupedSubjects.map(([category, items]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <Typography
                    variant="small"
                    className="text-[11px] font-black uppercase tracking-widest text-primary"
                  >
                    {category}
                  </Typography>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {items.length}
                  </span>
                  {items.every((s) => s.coming_soon) ? (
                    <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                      Coming Soon
                    </span>
                  ) : null}
                  <div className="h-px flex-1 bg-border/60" />
                </div>

                <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm">
                  <ul className="divide-y divide-border/60">
                    {items.map((subject) => {
                      const isEditing = editingId === subject.id;
                      const isBusy = updateMutation.isPending || deleteMutation.isPending;
                      return (
                        <li
                          key={subject.id}
                          className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <SubjectsSVG className="size-4.5" />
                            </div>
                            {isEditing ? (
                              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                                <AppInput
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleUpdate(subject);
                                    if (e.key === "Escape") cancelEdit();
                                  }}
                                  autoFocus
                                  className="max-w-xs"
                                />
                                <select
                                  value={editingCategory}
                                  onChange={(e) => setEditingCategory(e.target.value)}
                                  className={cn(selectClassName, "sm:w-52")}
                                  aria-label="Subject category"
                                >
                                  {SUBJECT_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                      {cat}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-bold text-foreground">
                                    {subject.name}
                                  </p>
                                  {subject.coming_soon ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                                      Coming Soon
                                    </span>
                                  ) : null}
                                </div>
                                <span
                                  className={cn(
                                    "mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest",
                                    subject.coming_soon
                                      ? "text-amber-600 dark:text-amber-400"
                                      : subject.is_active
                                        ? "text-primary"
                                        : "text-muted-foreground",
                                  )}
                                >
                                  <Circle
                                    className={cn(
                                      "size-2 fill-current",
                                      subject.coming_soon
                                        ? "text-amber-500"
                                        : subject.is_active
                                          ? "text-primary"
                                          : "text-muted-foreground",
                                    )}
                                  />
                                  {subject.coming_soon
                                    ? "Hidden from students"
                                    : subject.is_active
                                      ? "Live"
                                      : "Hidden"}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {isEditing ? (
                              <>
                                <AppButton
                                  size="sm"
                                  onClick={() => handleUpdate(subject)}
                                  disabled={updateMutation.isPending}
                                  className="rounded-xl font-bold"
                                >
                                  {updateMutation.isPending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <Check className="size-4" />
                                  )}
                                </AppButton>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted"
                                >
                                  <X className="size-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdate(subject, {
                                      comingSoon: !subject.coming_soon,
                                    })
                                  }
                                  disabled={isBusy}
                                  className={cn(
                                    "rounded-xl border px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50",
                                    subject.coming_soon
                                      ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                                      : "border-amber-500/30 bg-amber-500/5 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400",
                                  )}
                                >
                                  {subject.coming_soon ? "Go Live" : "Coming Soon"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startEdit(subject)}
                                  className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                                  aria-label="Edit subject"
                                >
                                  <EditSVG className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSubjectToDelete(subject)}
                                  className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-card text-error transition-colors hover:border-error/40 hover:bg-error/5"
                                  aria-label="Delete subject"
                                >
                                  <DeleteSVG className="size-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={Boolean(subjectToDelete)}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title="Delete Subject"
        message={`Are you sure you want to delete "${subjectToDelete?.name ?? ""}"? This won't remove existing papers, but the subject will no longer appear in lists.`}
      />
    </PageContainer>
  );
}
