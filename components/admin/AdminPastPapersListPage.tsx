"use client";

import AddSVG from "@/public/svgs/AddSVG";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import { AppPagination } from "@/components/AppPagination";
import AppState from "@/components/AppState";
import AppQueryState from "@/components/AppQueryState";
import { FileText } from "lucide-react";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import toast from "react-hot-toast";
import AppSearch from "@/components/AppSearch";
import PastPaperCard from "@/components/PastPaperCard";
import { Class, Board, Subject } from "@/types/enums";
import { useAdminSubjectOptions } from "@/hooks/subjects/useSubjects";
import {
  useAdminPastPapers,
  useDeleteAdminPastPaper,
} from "@/hooks/admin/useAdminPastPapers";
import type { PastPaperSummary } from "@/types/past-paper";

const PAGE_LIMIT = 12;

interface AdminPastPapersListPageProps {
  paperNumber: 1 | 2;
  title: string;
}

export default function AdminPastPapersListPage({
  paperNumber,
  title,
}: AdminPastPapersListPageProps) {
  const router = useRouter();
  const deletePastPaperMutation = useDeleteAdminPastPaper();
  const subjectOptions = useAdminSubjectOptions(Object.values(Subject));

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState<PastPaperSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [boardFilter, setBoardFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const pastPapersQuery = useAdminPastPapers({
    paperNumber,
    page: currentPage,
    limit: PAGE_LIMIT,
    class: classFilter,
    board: boardFilter,
    subject: subjectFilter,
    year: yearFilter,
    search: searchTerm || undefined,
  });

  const pagination = pastPapersQuery.data?.pagination ?? null;
  const availableYears = pastPapersQuery.data?.availableYears ?? [];

  const hasActiveFilters =
    searchTerm !== "" ||
    classFilter !== "all" ||
    boardFilter !== "all" ||
    subjectFilter !== "all" ||
    yearFilter !== "all";

  const resetPage = () => setCurrentPage(1);

  const openDeleteModal = (paper: PastPaperSummary) => {
    setPaperToDelete(paper);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (!deletePastPaperMutation.isPending) {
      setDeleteModalOpen(false);
      setPaperToDelete(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!paperToDelete) return;

    try {
      await deletePastPaperMutation.mutateAsync(paperToDelete.id);
      toast.success("Past paper deleted successfully");
      setDeleteModalOpen(false);
      setPaperToDelete(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete past paper";
      toast.error(message);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={title}
        actions={
          <AppButton
            onClick={() => router.push(FRONTEND_ROUTES.ADMIN_UPLOAD_PAST_PAPER)}
            variant="default"
            className="h-12 rounded-xl px-6 font-bold shadow-lg shadow-primary/20"
          >
            <AddSVG className="mr-2 size-5" />
            Add New Paper
          </AppButton>
        }
      />

      <AppSearch
        className="mb-10"
        searchLabel="Global Search"
        placeholder="Search by subject, year, or exam session..."
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          resetPage();
        }}
        isLoading={pastPapersQuery.isFetching}
        dropdowns={[
          {
            id: "class-filter",
            label: "Class Level",
            value: classFilter,
            onChange: (e) => {
              setClassFilter(e.target.value);
              resetPage();
            },
            options: [
              { value: "all", label: "All Classes" },
              ...Object.values(Class).map((cls) => ({ value: cls, label: cls })),
            ],
          },
          {
            id: "board-filter",
            label: "Exam Board",
            value: boardFilter,
            onChange: (e) => {
              setBoardFilter(e.target.value);
              resetPage();
            },
            options: [
              { value: "all", label: "All Boards" },
              ...Object.values(Board).map((board) => ({ value: board, label: board })),
            ],
          },
          {
            id: "subject-filter",
            label: "Subject",
            value: subjectFilter,
            onChange: (e) => {
              setSubjectFilter(e.target.value);
              resetPage();
            },
            options: [
              { value: "all", label: "All Subjects" },
              ...subjectOptions,
            ],
          },
          {
            id: "year-filter",
            label: "Year",
            value: yearFilter,
            onChange: (e) => {
              setYearFilter(e.target.value);
              resetPage();
            },
            options: [
              { value: "all", label: "All Years" },
              ...availableYears.map((year) => ({
                value: year.toString(),
                label: year.toString(),
              })),
            ],
          },
        ]}
        resultsCount={pagination?.total}
        resultsLabel={`paper${pagination?.total === 1 ? "" : "s"} found`}
        onClearFilters={() => {
          setSearchTerm("");
          setClassFilter("all");
          setBoardFilter("all");
          setSubjectFilter("all");
          setYearFilter("all");
          resetPage();
        }}
        hasActiveFilters={hasActiveFilters}
      />

      <AppQueryState
        query={pastPapersQuery}
        loadingMessage="Loading past papers..."
        errorMessage="Failed to load past papers."
        onRetry={() => pastPapersQuery.refetch()}
        fullScreen={false}
      >
        {(data) => {
          const pastPapers = data.pastPapers;

          return (
            <AppState
              isEmpty={pastPapers.length === 0}
              emptyMessage={
                searchTerm
                  ? `No examination papers found matching "${searchTerm}"`
                  : "Start building your digital archive by uploading your first past paper."
              }
              title={searchTerm ? "No Match Found" : "Library Empty"}
              icon={FileText}
              action={
                searchTerm
                  ? undefined
                  : {
                      label: "Add Initial Paper",
                      onClick: () => router.push(FRONTEND_ROUTES.ADMIN_UPLOAD_PAST_PAPER),
                    }
              }
              fullScreen={false}
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {pastPapers.map((paper) => (
                  <PastPaperCard
                    key={paper.id}
                    paper={paper}
                    variant="admin"
                    onView={(id) => router.push(FRONTEND_ROUTES.ADMIN_PAST_PAPER_VIEW(id))}
                    onEdit={(id) => router.push(FRONTEND_ROUTES.ADMIN_PAST_PAPER_EDIT(id))}
                    onDelete={() => openDeleteModal(paper)}
                  />
                ))}
              </div>

              <AppPagination
                currentPage={currentPage}
                totalPages={pagination?.totalPages ?? 1}
                totalItems={pagination?.total ?? 0}
                pageSize={PAGE_LIMIT}
                itemLabel="papers"
                onPageChange={setCurrentPage}
              />
            </AppState>
          );
        }}
      </AppQueryState>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Past Paper"
        message={`Are you sure you want to delete ${paperToDelete?.subject} (${paperToDelete?.year})? This action cannot be undone.`}
        isLoading={deletePastPaperMutation.isPending}
      />
    </PageContainer>
  );
}
