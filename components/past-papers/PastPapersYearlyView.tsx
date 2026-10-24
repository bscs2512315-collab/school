"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import AppSearch from "@/components/AppSearch";
import AppState from "@/components/AppState";
import PastPaperCard from "@/components/PastPaperCard";
import QuestionBankBrowseCard from "@/components/admin/question-bank/QuestionBankBrowseCard";
import QuestionBankBreadcrumb from "@/components/admin/question-bank/QuestionBankBreadcrumb";
import { getPastPaperYearRange } from "@/types/past-paper-browse";
import type { PastPaperSummary } from "@/types/past-paper";
import { Board, Class } from "@/types/enums";
import P1SVG from "@/public/svgs/P1SVG";
import P2SVG from "@/public/svgs/P2SCG";

type YearlyStep = "years" | "subjects" | "papers";

interface PastPapersYearlyViewProps {
  papers: PastPaperSummary[];
  paperNumber: number;
  onAttempt: (paperId: string) => void;
  studentClass?: string | null;
  studentBoard?: string | null;
  /** Rendered directly under the filter/search bar (keeps Classic/Yearly tabs stable). */
  afterSearch?: ReactNode;
}

export default function PastPapersYearlyView({
  papers,
  paperNumber,
  onAttempt,
  studentClass,
  studentBoard,
  afterSearch,
}: PastPapersYearlyViewProps) {
  const EmptyIcon = paperNumber === 2 ? P2SVG : P1SVG;
  const [step, setStep] = useState<YearlyStep>("years");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string>(studentClass ?? "all");
  const [searchTerm, setSearchTerm] = useState("");
  const [boardFilter, setBoardFilter] = useState<string>(studentBoard ?? "all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  const years = useMemo(() => getPastPaperYearRange(), []);

  // Keep default class and board filter in sync with the logged-in student.
  useEffect(() => {
    setClassFilter(studentClass ?? "all");
    setBoardFilter(studentBoard ?? "all");
    setSubjectFilter("all");
    setYearFilter("all");
    setSearchTerm("");
    setSelectedYear(null);
    setSelectedSubject(null);
    setStep("years");
  }, [studentClass, studentBoard]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(papers.map((paper) => paper.year))).sort((a, b) => b - a);
  }, [papers]);

  // Only surface subjects that actually have papers so the filter never lists
  // subjects with zero content.
  const availableSubjects = useMemo(() => {
    return Array.from(new Set(papers.map((paper) => paper.subject))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [papers]);

  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      const matchesSearch =
        !searchTerm ||
        paper.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.year.toString().includes(searchTerm) ||
        paper.board.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (paper.session?.toLowerCase() ?? "").includes(searchTerm.toLowerCase());

      const matchesClass = classFilter === "all" || paper.class === classFilter;
      const matchesBoard = boardFilter === "all" || paper.board === boardFilter;
      const matchesSubject = subjectFilter === "all" || paper.subject === subjectFilter;
      const matchesYear = yearFilter === "all" || paper.year.toString() === yearFilter;

      return matchesSearch && matchesClass && matchesBoard && matchesSubject && matchesYear;
    });
  }, [papers, searchTerm, classFilter, boardFilter, subjectFilter, yearFilter]);

  const yearsWithPapers = useMemo(() => {
    const yearsSet = new Set(filteredPapers.map((p) => p.year));
    return years.filter((year) => yearsSet.has(year));
  }, [filteredPapers, years]);

  const papersForYear = useMemo(() => {
    if (selectedYear === null) return [];
    return filteredPapers.filter((paper) => paper.year === selectedYear);
  }, [filteredPapers, selectedYear]);

  const papersForSelection = useMemo(() => {
    if (selectedYear === null || !selectedSubject) return [];
    return papersForYear.filter((paper) => paper.subject === selectedSubject);
  }, [papersForYear, selectedSubject, selectedYear]);

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    setSelectedSubject(null);
    setStep("subjects");
  };

  const handleBack = () => {
    if (step === "papers") {
      setSelectedSubject(null);
      setStep("subjects");
      return;
    }
    if (step === "subjects") {
      setSelectedYear(null);
      setStep("years");
    }
  };

  useEffect(() => {
    if (yearFilter === "all") {
      setSelectedYear(null);
      setSelectedSubject(null);
      setStep("years");
      return;
    }

    const yearNum = Number(yearFilter);
    if (Number.isNaN(yearNum)) return;

    setSelectedYear(yearNum);
    setSelectedSubject(null);
    setStep("subjects");
  }, [yearFilter]);

  useEffect(() => {
    if (subjectFilter === "all") {
      if (step === "papers") {
        setSelectedSubject(null);
        setStep("subjects");
      }
      return;
    }

    // Only move to papers step when a year is already selected.
    if (selectedYear !== null) {
      setSelectedSubject(subjectFilter);
      setStep("papers");
    }
  }, [subjectFilter, selectedYear, step]);

  if (papers.length === 0) {
    return (
      <div className="space-y-6">
        {afterSearch ? <div className="w-full shrink-0">{afterSearch}</div> : null}
        <AppState
          isEmpty={true}
          title="No Papers Available"
          description="No past papers have been published yet for this paper type."
          icon={EmptyIcon}
          fullScreen={false}
        />
      </div>
    );
  }

  const breadcrumbItems = useMemo(() => {
    const items: string[] = [];
    if (selectedYear !== null) items.push(selectedYear.toString());
    if (selectedSubject) items.push(selectedSubject);
    return items;
  }, [selectedYear, selectedSubject]);

  const hasActiveFilters = Boolean(
    searchTerm ||
      classFilter !== "all" ||
      boardFilter !== "all" ||
      subjectFilter !== "all" ||
      yearFilter !== "all",
  );

  const clearFilters = () => {
    setSearchTerm("");
    setClassFilter(studentClass ?? "all");
    setBoardFilter(studentBoard ?? "all");
    setSubjectFilter("all");
    setYearFilter("all");
    setSelectedYear(null);
    setSelectedSubject(null);
    setStep("years");
  };

  return (
    <div className="space-y-6">
      {breadcrumbItems.length > 0 ? (
        <QuestionBankBreadcrumb
          items={breadcrumbItems}
          onBack={step !== "years" ? handleBack : undefined}
        />
      ) : null}

      <AppSearch
        searchLabel="Global Search"
        placeholder="Search subject, board, or year..."
        searchTerm={searchTerm}
        onSearchChange={(value) => setSearchTerm(value)}
        dropdowns={[
          {
            id: "class-filter",
            label: "Level",
            value: classFilter,
            onChange: (e) => {
              setClassFilter(e.target.value);
              setSelectedYear(null);
              setSelectedSubject(null);
              setStep("years");
            },
            options: [
              { value: "all", label: "Classes" },
              ...Object.values(Class).map((cls) => ({ value: cls, label: cls })),
            ],
          },
          {
            id: "board-filter",
            label: "Board",
            value: boardFilter,
            onChange: (e) => setBoardFilter(e.target.value),
            options: [
              { value: "all", label: "Boards" },
              ...Object.values(Board).map((b) => ({ value: b, label: b })),
            ],
          },
          {
            id: "subject-filter",
            label: "Subject",
            value: subjectFilter,
            onChange: (e) => setSubjectFilter(e.target.value),
            options: [
              { value: "all", label: "Subjects" },
              ...availableSubjects.map((s) => ({ value: s, label: s })),
            ],
          },
          {
            id: "year-filter",
            label: "Year",
            value: yearFilter,
            onChange: (e) => setYearFilter(e.target.value),
            options: [
              { value: "all", label: "All Years" },
              ...availableYears.map((year) => ({
                value: year.toString(),
                label: year.toString(),
              })),
            ],
          },
        ]}
        resultsCount={filteredPapers.length}
        resultsLabel={`paper${filteredPapers.length !== 1 ? "s" : ""} found`}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {afterSearch ? <div className="w-full shrink-0">{afterSearch}</div> : null}

      {step === "years" ? (
        <section className="space-y-4">
          {yearsWithPapers.length === 0 ? (
            <AppState
              isEmpty={true}
              title="No Papers Found"
              description="No past papers are available for your selected class."
              icon={EmptyIcon}
              fullScreen={false}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {yearsWithPapers.map((year) => {
                const yearPapers = filteredPapers.filter((paper) => paper.year === year);
                const count = yearPapers.length;
                const yearBoards = Array.from(
                  new Set(yearPapers.map((p) => p.board).filter(Boolean)),
                );
                const yearBoardLabel =
                  boardFilter !== "all"
                    ? boardFilter
                    : yearBoards.length === 1
                      ? yearBoards[0]
                      : studentBoard || undefined;
                return (
                  <QuestionBankBrowseCard
                    key={year}
                    title={year.toString()}
                    board={yearBoardLabel}
                    subtitle={`${count} paper${count !== 1 ? "s" : ""}`}
                    watermark={year.toString().slice(-2)}
                    onClick={() => handleSelectYear(year)}
                    dark
                  />
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {step === "subjects" && selectedYear !== null ? (
        <section className="space-y-4">
          {papersForYear.length === 0 ? (
            <AppState
              isEmpty={true}
              title="No Papers Found"
              description={`No Paper ${paperNumber} exams are available for ${selectedYear}.`}
              icon={EmptyIcon}
              fullScreen={false}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {papersForYear.map((paper) => (
                <PastPaperCard
                  key={paper.id}
                  paper={paper}
                  variant="student"
                  onAttempt={onAttempt}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {step === "papers" && selectedYear !== null && selectedSubject ? (
        <section className="space-y-4">
          {papersForSelection.length === 0 ? (
            <AppState
              isEmpty={true}
              title="No Papers Found"
              description="Try another subject or year."
              icon={EmptyIcon}
              fullScreen={false}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {papersForSelection.map((paper) => (
                <PastPaperCard
                  key={paper.id}
                  paper={paper}
                  variant="student"
                  onAttempt={onAttempt}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
