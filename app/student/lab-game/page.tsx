"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { ComponentType, SVGProps } from "react";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppSearch from "@/components/AppSearch";
import AppState from "@/components/AppState";
import { AppPagination } from "@/components/AppPagination";
import LabSubjectCard from "@/components/lab-game/LabSubjectCard";
import LabPracticalCard from "@/components/lab-game/LabPracticalCard";
import LabExploreBanner from "@/components/lab-game/LabExploreBanner";
import { Typography } from "@/components/ui/Typography";
import { FlaskConical } from "lucide-react";
import PhysicsSVG from "@/public/svgs/PhysicsSVG";
import ChemistrySVG from "@/public/svgs/ChemistrySVG";
import BiologySVG from "@/public/svgs/BiologySVG";
import LabGameSVG from "@/public/svgs/LabGameSVG";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import {
  getPracticals,
  getAllLabPracticals,
  type LabSubject,
} from "@/constants/labPracticals";
import { useStoredUser } from "@/hooks/useStoredUser";
import { normalizeClassLevel } from "@/lib/teacher/class-level";
import { Board } from "@/types/enums";
import { GROUP_SUBJECTS } from "@/constants";

const PAGE_LIMIT = 9;

const LAB_CONFIG: {
  key: LabSubject;
  title: string;
  desc: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
  ready: boolean;
}[] = [
  {
    key: "chemistry",
    title: "Chemistry Lab",
    desc: "Salt analysis, functional groups & reducing-sugar tests in a 3D lab.",
    icon: LabGameSVG,
    href: `${FRONTEND_ROUTES.STUDENT_LAB_GAME}/chemistry`,
    ready: true,
  },
  {
    key: "physics",
    title: "Physics Lab",
    desc: "Heat, calorimetry & electricity experiments with live meters and graphs.",
    icon: PhysicsSVG,
    href: `${FRONTEND_ROUTES.STUDENT_LAB_GAME}/physics`,
    ready: true,
  },
  {
    key: "biology",
    title: "Biology Lab",
    desc: "Genetics, data tools, annual rings & more interactive practicals.",
    icon: BiologySVG,
    href: `${FRONTEND_ROUTES.STUDENT_LAB_GAME}/biology`,
    ready: true,
  },
];

const SUBJECT_ICONS: Record<LabSubject, React.ComponentType<{ className?: string }>> = {
  chemistry: ChemistrySVG,
  physics: PhysicsSVG,
  biology: BiologySVG,
};

function sanitizeClassLevel(raw?: string | null): string {
  const norm = normalizeClassLevel(raw);
  if (norm === "IX" || norm === "X" || norm === "XI" || norm === "XII") {
    return norm;
  }
  return "XII";
}

export default function LabGamePage() {
  const { user, isReady: isUserReady } = useStoredUser();

  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>("XII");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasInitializedUserClass, setHasInitializedUserClass] = useState(false);

  // Sync default class to user's class on initial load
  useEffect(() => {
    if (isUserReady && user?.class && !hasInitializedUserClass) {
      const userGrade = sanitizeClassLevel(user.class);
      setClassFilter(userGrade);
      setHasInitializedUserClass(true);
    }
  }, [isUserReady, user?.class, hasInitializedUserClass]);

  const userGrade = sanitizeClassLevel(user?.class);

  // Retrieve subject experiment counts for the active class
  const counts = useMemo(() => {
    const total: Record<LabSubject, number> = { chemistry: 0, physics: 0, biology: 0 };
    for (const item of LAB_CONFIG) {
      total[item.key] = getPracticals(item.key, classFilter).length;
    }
    return total;
  }, [classFilter]);

  // Retrieve all 3D lab practicals matching search and active filters
  const filteredPracticals = useMemo(() => {
    const all = getAllLabPracticals("all");
    const q = searchTerm.trim().toLowerCase();

    return all.filter((p) => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.objective.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);

      const matchesClass = classFilter === "all" || p.classLevel === classFilter;
      const matchesSubject = subjectFilter === "all" || p.subject === subjectFilter;

      return matchesSearch && matchesClass && matchesSubject;
    });
  }, [searchTerm, classFilter, subjectFilter]);

  const isSearchOrSubjectActive = Boolean(searchTerm.trim() || subjectFilter !== "all");

  const totalItems = filteredPracticals.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_LIMIT));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_LIMIT;
  const endIndex = Math.min(startIndex + PAGE_LIMIT, totalItems);
  const paginatedPracticals = filteredPracticals.slice(startIndex, endIndex);

  const hasActiveFilters = Boolean(
    searchTerm ||
    classFilter !== userGrade ||
    boardFilter !== "all" ||
    subjectFilter !== "all"
  );

  const handleClearFilters = () => {
    setSearchTerm("");
    setClassFilter(userGrade);
    setBoardFilter("all");
    setSubjectFilter("all");
    setCurrentPage(1);
  };

  return (
    <PageContainer>
      <PageHeader title="Lab Game" showLine />

      <div className="space-y-6">
        {/* Global Search & Filters Bar */}
        <AppSearch
          searchLabel="Global Search"
          placeholder="Search 3D lab games, experiments..."
          searchTerm={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          dropdowns={[
            {
              id: "class-filter",
              label: "Level",
              value: classFilter,
              onChange: (e) => {
                setClassFilter(e.target.value);
                setCurrentPage(1);
              },
              options: [
                { value: "all", label: "All Classes" },
                { value: "IX", label: "Class IX (SSC-I)" },
                { value: "X", label: "Class X (SSC-II)" },
                { value: "XI", label: "Class XI (HSSC-I)" },
                { value: "XII", label: "Class XII (HSSC-II)" },
              ],
            },
            {
              id: "board-filter",
              label: "Board",
              value: boardFilter,
              onChange: (e) => {
                setBoardFilter(e.target.value);
                setCurrentPage(1);
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
                setCurrentPage(1);
              },
              options: [
                { value: "all", label: "All Subjects" },
                ...LAB_CONFIG.map((sub) => ({ value: sub.key, label: sub.title })),
              ],
            },
          ]}
          resultsCount={filteredPracticals.length}
          resultsLabel={`experiment${filteredPracticals.length !== 1 ? "s" : ""} found${classFilter !== "all" ? ` · Class ${classFilter}` : ""}${boardFilter !== "all" ? ` · ${boardFilter}` : ""}`}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Explore Chemistry Lab Free Walkthrough Banner */}
        {!isSearchOrSubjectActive && <LabExploreBanner />}

        {/* Main Content View */}
        {!isSearchOrSubjectActive ? (
          /* Default Subject Overview Grid (Using Previous LabSubjectCard UI) */
          (() => {
            const groupSubjects = user?.stream ? GROUP_SUBJECTS[user.stream] ?? [] : [];
            const groupScopedLabs =
              groupSubjects.length > 0 && !showAllSubjects
                ? LAB_CONFIG.filter((s) =>
                    groupSubjects.some(
                      (gs) =>
                        gs.toLowerCase() === s.title.toLowerCase() ||
                        s.title.toLowerCase().includes(gs.toLowerCase()) ||
                        gs.toLowerCase().includes(s.key.toLowerCase()),
                    ),
                  )
                : LAB_CONFIG;
            const labsInView = groupScopedLabs.length > 0 ? groupScopedLabs : LAB_CONFIG;
            const isGroupScoped =
              groupSubjects.length > 0 &&
              !showAllSubjects &&
              groupScopedLabs.length > 0 &&
              groupScopedLabs.length < LAB_CONFIG.length;

            return (
              <div className="space-y-4">
                {groupSubjects.length > 0 ? (
                  <div className="flex items-center justify-between gap-3">
                    <Typography variant="small" className="font-medium text-muted-foreground">
                      {isGroupScoped
                        ? `Showing your group's subjects${user?.stream ? ` · ${user.stream}` : ""}`
                        : "Showing all subjects"}
                    </Typography>
                    <button
                      type="button"
                      onClick={() => setShowAllSubjects((v) => !v)}
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      {showAllSubjects ? "Show my group" : "Show all subjects"}
                    </button>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {labsInView.map((lab) => (
                    <LabSubjectCard
                      key={lab.key}
                      title={lab.title}
                      description={lab.desc}
                      href={classFilter !== "all" ? `${lab.href}?grade=${classFilter}` : lab.href}
                      icon={lab.icon}
                      practicalCount={counts[lab.key] || 0}
                      ready={lab.ready}
                      actionLabel="Explore"
                    />
                  ))}
                </div>
              </div>
            );
          })()
        ) : (
          /* Search Results & Filtered Practicals View */
          <AppState
            isEmpty={filteredPracticals.length === 0}
            emptyMessage="No 3D lab simulations found matching your search. Try adjusting your filters."
            title="No Experiments Found"
            icon={FlaskConical}
            fullScreen={false}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedPracticals.map((practical) => {
                  const Icon = SUBJECT_ICONS[practical.subject] || PhysicsSVG;
                  return (
                    <LabPracticalCard
                      key={practical.id}
                      index={practical.expNo}
                      title={practical.title}
                      objective={practical.objective}
                      route={practical.route}
                      icon={Icon}
                    />
                  );
                })}
              </div>

              {totalPages > 1 ? (
                <AppPagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={PAGE_LIMIT}
                  itemLabel="experiments"
                  onPageChange={setCurrentPage}
                  className="pt-2"
                />
              ) : null}
            </div>
          </AppState>
        )}
      </div>
    </PageContainer>
  );
}
