"use client";

import AddSVG from "@/public/svgs/AddSVG";
import MilestonesSVG from "@/public/svgs/MilestonesSVG";

import { useState } from "react";
import toast from "react-hot-toast";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import AppQueryState from "@/components/AppQueryState";
import AppState from "@/components/AppState";
import ConfirmationModal from "@/components/ConfirmationModal";
import AdminMilestoneCard from "@/components/admin/milestones/AdminMilestoneCard";
import AdminMilestoneForm, {
  createEmptyMilestoneFormValues,
  type MilestoneFormValues,
} from "@/components/admin/milestones/AdminMilestoneForm";
import {
  useAdminMilestones,
  useCreateAdminMilestone,
  useDeleteAdminMilestone,
  useUpdateAdminMilestone,
} from "@/hooks/admin/useAdminPastPaperDetail";
import type { AdminMilestone } from "@/types/past-paper";

export default function AdminMilestonesPage() {
  const milestonesQuery = useAdminMilestones();
  const createMilestoneMutation = useCreateAdminMilestone();
  const updateMilestoneMutation = useUpdateAdminMilestone();
  const deleteMilestoneMutation = useDeleteAdminMilestone();

  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<MilestoneFormValues>(createEmptyMilestoneFormValues());
  const [deleteTarget, setDeleteTarget] = useState<AdminMilestone | null>(null);

  const resetForm = () => {
    setFormValues(createEmptyMilestoneFormValues());
    setIsEditing(null);
  };

  const openCreateForm = () => {
    setFormValues(createEmptyMilestoneFormValues());
    setIsEditing(-1);
  };

  const editMilestone = (milestone: AdminMilestone) => {
    setFormValues({
      level: milestone.level || 1,
      name: milestone.name,
      points: milestone.points_required,
      icon: milestone.icon,
      color: milestone.color,
      bgColor: milestone.bg_color,
    });
    setIsEditing(milestone.id);
  };

  const handleFormChange = (updates: Partial<MilestoneFormValues>) => {
    setFormValues((current) => ({ ...current, ...updates }));
  };

  const handleSave = async () => {
    if (!formValues.name.trim()) {
      toast.error("Please enter a milestone name.");
      return;
    }

    if (Number.isNaN(formValues.points) || Number.isNaN(formValues.level)) {
      toast.error("Please enter valid level and points.");
      return;
    }

    const payload = {
      level: formValues.level,
      name: formValues.name.trim(),
      points_required: formValues.points,
      icon: formValues.icon,
      color: formValues.color,
      bg_color: formValues.bgColor,
    };

    try {
      if (isEditing && isEditing !== -1) {
        await updateMilestoneMutation.mutateAsync({ id: isEditing, payload });
        toast.success("Milestone updated successfully.");
      } else {
        await createMilestoneMutation.mutateAsync(payload);
        toast.success("Milestone created successfully.");
      }
      resetForm();
    } catch {
      toast.error("Failed to save milestone.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMilestoneMutation.mutateAsync(deleteTarget.id);
      toast.success("Milestone deleted successfully.");
      setDeleteTarget(null);
      if (isEditing === deleteTarget.id) {
        resetForm();
      }
    } catch {
      toast.error("Failed to delete milestone.");
    }
  };

  const isSaving = createMilestoneMutation.isPending || updateMilestoneMutation.isPending;

  return (
    <PageContainer>
      <PageHeader
        title="Manage Milestones"
        showLine={true}
        actions={
          <AppButton
            onClick={openCreateForm}
            className="h-12 rounded-xl px-6 font-bold shadow-lg shadow-primary/20"
          >
            <AddSVG className="mr-2 size-5" />
            New Milestone
          </AppButton>
        }
      />

      {isEditing !== null ? (
        <AdminMilestoneForm
          mode={isEditing === -1 ? "create" : "edit"}
          values={formValues}
          isSaving={isSaving}
          onChange={handleFormChange}
          onSave={() => void handleSave()}
          onCancel={resetForm}
        />
      ) : null}

      <AppQueryState
        query={milestonesQuery}
        loadingMessage="Loading milestones..."
        errorMessage="Failed to load milestones."
        onRetry={() => milestonesQuery.refetch()}
        fullScreen={false}
      >
        {(milestones) => (
          <>
            <div className="mb-6 flex items-center gap-2">
              <MilestonesSVG className="size-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Rank Levels</h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                {milestones.length}
              </span>
            </div>

            {milestones.length === 0 ? (
              <AppState
                isEmpty={true}
                title="No Milestones Found"
                description="Create milestones to reward your students as they earn points."
                icon={MilestonesSVG}
                fullScreen={false}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {milestones.map((milestone) => (
                  <AdminMilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    onEdit={editMilestone}
                    onDelete={(id) => {
                      const target = milestones.find((item) => item.id === id) ?? null;
                      setDeleteTarget(target);
                    }}
                    isDeleting={deleteMilestoneMutation.isPending}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </AppQueryState>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
        title="Delete Milestone?"
        message={
          deleteTarget
            ? `Are you sure you want to delete Level ${deleteTarget.level}: ${deleteTarget.name}?`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMilestoneMutation.isPending}
      />

      <div className="pb-12" />
    </PageContainer>
  );
}
