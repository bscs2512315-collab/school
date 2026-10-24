"use client";

import AddSVG from "@/public/svgs/AddSVG";

import { Typography } from "@/components/ui/Typography";
import { useRouter } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import AppButton from "@/components/AppButton";
import { AppPagination } from "@/components/AppPagination";
import AppSearch from "@/components/AppSearch";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { BookOpen, BookPlus, UploadCloud, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import CurriculumCard from "@/components/CurriculumCard";
import AppState from "@/components/AppState";
import AppQueryState from "@/components/AppQueryState";
import { Class, Board } from "@/types/enums";
import { cn } from "@/lib/utils";
import {
  useAdminCurriculums,
  useDeleteAdminCurriculum,
} from "@/hooks/admin/useAdminCurriculums";
import type { AdminCurriculumSummary } from "@/types/admin";

const PAGE_LIMIT = 12;

export default function CurriculumsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [curriculumToDelete, setCurriculumToDelete] = useState<AdminCurriculumSummary | null>(null);

  const curriculumsQuery = useAdminCurriculums({
    page: currentPage,
    limit: PAGE_LIMIT,
    class: classFilter,
    board: boardFilter,
    search: searchTerm || undefined,
  });
  const deleteCurriculumMutation = useDeleteAdminCurriculum();

  const pagination = curriculumsQuery.data?.pagination ?? null;

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleClassFilterChange = (value: string) => {
    setClassFilter(value);
    setCurrentPage(1);
  };

  const handleBoardFilterChange = (value: string) => {
    setBoardFilter(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setClassFilter("all");
    setBoardFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm !== "" || classFilter !== "all" || boardFilter !== "all";

  const openDeleteModal = (curriculum: AdminCurriculumSummary) => {
    setCurriculumToDelete(curriculum);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (!deleteCurriculumMutation.isPending) {
      setDeleteModalOpen(false);
      setCurriculumToDelete(null);
    }
  };

  const handleDelete = async () => {
    if (!curriculumToDelete) return;

    try {
      await deleteCurriculumMutation.mutateAsync(curriculumToDelete.id);
      toast.success("Curriculum deleted successfully");
      setDeleteModalOpen(false);
      setCurriculumToDelete(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete curriculum";
      toast.error(message);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Curriculum Repository"
        actions={
          <div className="relative z-30">
            <AppButton
              onClick={() => setShowAddMenu(!showAddMenu)}
              variant="default"
              className="rounded-xl h-12 px-6 font-bold shadow-lg shadow-primary/20"
            >
              <AddSVG className="mr-2 h-5 w-5" />
              Add New Curriculum
              <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", { "rotate-180": showAddMenu })} />
            </AppButton>

            {showAddMenu ? (
              <>
                <button
                  type="button"
                  aria-label="Close add menu"
                  className="fixed inset-0 z-10"
                  onClick={() => setShowAddMenu(false)}
                />
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-border bg-card py-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  <button
                    type="button"
                    onClick={() => {
                      router.push(FRONTEND_ROUTES.ADMIN_CREATE_CURRICULUM);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left transition-colors group"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20">
                      <BookPlus className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">Manual Architect</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-black">Step-by-step</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(FRONTEND_ROUTES.ADMIN_ADD_SYLLABUS);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left transition-colors group"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">Syllabus (SLOs)</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-black">AI Orchestrated</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(FRONTEND_ROUTES.ADMIN_UPLOAD_CURRICULUM);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left transition-colors group"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20">
                      <UploadCloud className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">Document Upload</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-black">AI Auto-Extract</span>
                    </div>
                  </button>
                </div>
              </>
            ) : null}
          </div>
        }
      />

      <AppSearch
        className="relative z-20 mb-10"
        searchLabel="Global Search"
        placeholder="Search by subject, class, or board..."
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        isLoading={curriculumsQuery.isFetching}
        dropdowns={[
          {
            id: "class-filter",
            label: "Class Level",
            value: classFilter,
            onChange: (e) => handleClassFilterChange(e.target.value),
            options: [
              { value: "all", label: "All Classes" },
              ...Object.values(Class).map((cls) => ({ value: cls, label: cls })),
            ],
          },
          {
            id: "board-filter",
            label: "Exam Board",
            value: boardFilter,
            onChange: (e) => handleBoardFilterChange(e.target.value),
            options: [
              { value: "all", label: "All Boards" },
              ...Object.values(Board).map((board) => ({ value: board, label: board })),
            ],
          },
        ]}
        resultsCount={pagination?.total}
        resultsLabel="curriculums found"
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      <AppQueryState
        query={curriculumsQuery}
        loadingMessage="Loading curriculums..."
        errorMessage="Failed to fetch curriculums."
        onRetry={() => curriculumsQuery.refetch()}
        fullScreen={false}
      >
        {(data) => {
          const curriculums = data.curriculums;

          return (
            <AppState
              isEmpty={curriculums.length === 0}
              emptyMessage={
                searchTerm
                  ? `No curriculums found matching "${searchTerm}"`
                  : "Initialize your academic repository by adding your first curriculum."
              }
              title={searchTerm ? "No Search Matches" : "Empty Repository"}
              icon={BookOpen}
              action={
                searchTerm
                  ? undefined
                  : {
                      label: "Build New Curriculum",
                      onClick: () => setShowAddMenu(true),
                    }
              }
              fullScreen={false}
            >
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {curriculums.map((curriculum) => (
                  <CurriculumCard
                    key={curriculum.id}
                    curriculum={curriculum}
                    onView={(id) => router.push(FRONTEND_ROUTES.ADMIN_CURRICULUM_DETAIL(id))}
                    onManageChapters={(id) => router.push(FRONTEND_ROUTES.ADMIN_CURRICULUM_ADD_CHAPTERS(id))}
                    onDelete={openDeleteModal}
                    formatDate={(date) => new Date(date).toLocaleDateString()}
                  />
                ))}
              </div>

              <AppPagination
                currentPage={currentPage}
                totalPages={pagination?.totalPages ?? 1}
                totalItems={pagination?.total ?? 0}
                pageSize={PAGE_LIMIT}
                itemLabel="curriculums"
                onPageChange={setCurrentPage}
              />
            </AppState>
          );
        }}
      </AppQueryState>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Delete Curriculum"
        message="Are you sure you want to delete this curriculum?"
        itemName={
          curriculumToDelete?.fileName ||
          `${curriculumToDelete?.class} - ${curriculumToDelete?.board} - ${curriculumToDelete?.subject}`
        }
        isLoading={deleteCurriculumMutation.isPending}
      />
    </PageContainer>
  );
}
