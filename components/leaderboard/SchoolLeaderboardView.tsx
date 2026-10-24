"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MedalSVG from "@/public/svgs/MedalSVG";
import CrownSVG from "@/public/svgs/CrownSVG";
import StarSVG from "@/public/svgs/StarSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import AppSearch from "@/components/AppSearch";
import AppState from "@/components/AppState";
import { Typography } from "@/components/ui/Typography";
import { cn, formatSchoolName } from "@/lib/utils";
import type { LeaderboardSchool } from "@/types/leaderboard";

interface SchoolLeaderboardFilterDropdown {
  id: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}

interface SchoolLeaderboardViewProps {
  schools: LeaderboardSchool[];
  emptyTitle?: string;
  emptyDescription?: string;
  hideTopCards?: boolean;
  showFullRankings?: boolean;
  rankOffset?: number;
  filterDropdowns?: SchoolLeaderboardFilterDropdown[];
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

const TOP_PODIUM_COUNT = 5;
const PAGE_SIZE = 20;

function matchesSearch(school: LeaderboardSchool, term: string): boolean {
  const query = term.trim().toLowerCase();
  if (!query) return true;

  const haystack = [school.name, school.city]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function getRankGradient(rank: number) {
  if (rank === 1) return "from-[#f59e0b] via-[#d97706] to-[#b45309]"; // Gold
  if (rank === 2) return "from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]"; // Blue
  if (rank === 3) return "from-[#a855f7] via-[#9333ea] to-[#7e22ce]"; // Purple
  if (rank === 4) return "from-[#10b981] via-[#059669] to-[#047857]"; // Emerald
  if (rank === 5) return "from-[#f43f5e] via-[#e11d48] to-[#9f1239]"; // Rose / Ruby
  return "from-slate-600 via-slate-700 to-slate-800";
}

function getRankBadgeInfo(rank: number) {
  if (rank === 1) return { Icon: CrownSVG, label: "Champion" };
  if (rank === 2) return { Icon: TrophySVG, label: "Rank 2" };
  if (rank === 3) return { Icon: MedalSVG, label: "Rank 3" };
  if (rank === 4) return { Icon: StarSVG, label: "Rank 4" };
  return { Icon: StarSVG, label: "Rank 5" };
}

function RankWatermark({ rank }: { rank: number }) {
  const positions = [
    "top-2 right-2",
    "bottom-14 left-2",
    "top-1/3 right-3",
  ];

  const Icon =
    rank === 1 ? MedalSVG : rank <= 3 ? TrophySVG : rank === 4 ? CrownSVG : StarSVG;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {positions.map((position, index) => (
        <Icon
          key={index}
          className={cn(
            "absolute size-8 text-white/15 sm:size-10",
            {
              "rotate-12": index % 2 === 0,
              "-rotate-12": index % 2 === 1,
              [position]: true,
            },
          )}
        />
      ))}
      <span className="absolute top-2.5 left-3 select-none text-4xl font-black text-white/20 drop-shadow-xs sm:text-5xl">
        #{rank}
      </span>
    </div>
  );
}

function GradientCardBackground({ rank }: { rank: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <div className={cn("absolute inset-0 bg-linear-to-br", getRankGradient(rank))} />
      <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[50px]" />
      <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[45px]" />
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />
    </div>
  );
}

export default function SchoolLeaderboardView({
  schools,
  emptyTitle = "Competition Initializing",
  emptyDescription = "The school leaderboard is being refreshed with latest performance data.",
  hideTopCards = false,
  showFullRankings = false,
  rankOffset = 0,
  filterDropdowns = [],
  hasActiveFilters = false,
  onClearFilters,
}: SchoolLeaderboardViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const isSearching = Boolean(searchTerm.trim());

  // Hide top cards when searching, identical to student leaderboard
  const topSchools = useMemo(() => {
    if (hideTopCards || isSearching) return [];
    return schools.slice(0, TOP_PODIUM_COUNT);
  }, [hideTopCards, isSearching, schools]);

  const listSchools = useMemo(() => {
    if (hideTopCards || showFullRankings) return schools;
    return schools.slice(TOP_PODIUM_COUNT);
  }, [hideTopCards, showFullRankings, schools]);

  // When searching, search across ALL schools in the dataset
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return schools.filter((school) => matchesSearch(school, searchTerm));
  }, [schools, searchTerm]);

  const activeList = isSearching ? searchResults : listSchools;

  const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE));
  const visiblePage = Math.min(currentPage, totalPages);
  const paginatedSchools = useMemo(() => {
    const start = (visiblePage - 1) * PAGE_SIZE;
    return activeList.slice(start, start + PAGE_SIZE);
  }, [activeList, visiblePage]);

  if (schools.length === 0) {
    return (
      <AppState
        isEmpty={true}
        title={emptyTitle}
        description={emptyDescription}
        icon={StarSVG}
        fullScreen={false}
      />
    );
  }

  const showListSection = listSchools.length > 0 || filterDropdowns.length > 0 || isSearching;

  return (
    <div className="flex min-w-0 w-full flex-col gap-4 pb-28 sm:pb-32 lg:pb-8">
      {topSchools.length > 0 ? (
        <div className="w-full min-w-0">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground sm:text-sm">
            Top Schools
          </p>
          <div className="w-full min-w-0 max-w-full">
            <div className="flex w-full min-w-0 gap-3.5 overflow-x-auto overscroll-x-contain px-1 pb-3 pt-1 snap-x snap-mandatory scrollbar-hide">
              {topSchools.map((school, index) => {
                const rank = index + 1;
                const badgeInfo = getRankBadgeInfo(rank);
                const BadgeIcon = badgeInfo.Icon;

                return (
                  <div
                    key={school.id}
                    className="group relative flex min-h-[310px] w-[80%] min-w-[80%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl border border-white/20 p-3.5 sm:p-4 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:shadow-2xl sm:w-60 sm:min-w-60 md:w-64 md:min-w-64"
                  >
                    <GradientCardBackground rank={rank} />
                    <RankWatermark rank={rank} />

                    {/* Top Header Badge */}
                    <div className="relative z-10 flex items-center justify-end">
                      <div
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-0.5 shadow-sm backdrop-blur-md",
                          rank === 1
                            ? "bg-amber-300 text-amber-950 font-black"
                            : "bg-white/25 text-white font-bold text-[10px]",
                        )}
                      >
                        <BadgeIcon className="size-3.5 shrink-0" />
                        <span className="text-[10px] uppercase tracking-wider">#{rank}</span>
                      </div>
                    </div>

                    {/* School Profile in Square-Rounded Container & Info */}
                    <div className="relative z-10 my-auto flex flex-col items-center text-center">
                      <div className="relative flex size-22 sm:size-26 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/40 bg-white p-2.5 shadow-xl transition-transform duration-300 group-hover:scale-105">
                        {school.logoUrl ? (
                          <img
                            src={school.logoUrl}
                            alt={school.name}
                            className="size-full object-contain"
                          />
                        ) : (
                          <BuildingSVG className="size-11 sm:size-12 text-slate-700" />
                        )}
                      </div>

                      {/* School Name */}
                      <p className="mt-2 break-words text-xs sm:text-[13px] font-bold tracking-tight text-white leading-snug drop-shadow-xs group-hover:text-white/95">
                        {formatSchoolName(school.name)}
                      </p>
                    </div>

                    {/* Bottom Section: City at top of points box, and Points + LV inside */}
                    <div className="relative z-10 mt-auto flex w-full flex-col items-center">
                      <span className="mb-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                        {school.city || "Karachi"}
                      </span>

                      <div className="grid w-full grid-cols-2 divide-x divide-white/20 rounded-2xl border border-white/20 bg-white/15 p-2 backdrop-blur-md text-center shadow-xs">
                        <div className="px-1 text-center">
                          <p className="text-sm font-black leading-none text-white sm:text-base">
                            {school.points.toLocaleString()}
                          </p>
                          <p className="mt-1 text-[7.5px] font-bold uppercase tracking-wider text-white/70">
                            points
                          </p>
                        </div>
                        <div className="px-1 text-center">
                          <p className="text-sm font-black leading-none text-white sm:text-base">
                            {school.studentCount}
                          </p>
                          <p className="mt-1 text-[7.5px] font-bold uppercase tracking-wider text-white/70">
                            Students
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {showListSection ? (
        <div className="flex flex-col gap-5">
          <AppSearch
            searchLabel="Global Search"
            placeholder="Search school by name, city..."
            searchTerm={searchTerm}
            onSearchChange={(term) => { setSearchTerm(term); setCurrentPage(1); }}
            dropdowns={filterDropdowns}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={onClearFilters}
            resultsCount={isSearching ? searchResults.length : undefined}
            resultsLabel="schools found"
          />

          {paginatedSchools.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-4 sm:px-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {isSearching ? `Search Results (${searchResults.length})` : "All School Rankings"}
                </p>
                {activeList.length > PAGE_SIZE && (
                  <p className="text-xs text-muted-foreground">
                    Page {visiblePage} of {totalPages}
                  </p>
                )}
              </div>

              <div className="hidden grid-cols-[3rem_1fr_auto] gap-3 border-b border-border/40 px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:grid sm:px-6">
                <span>Rank</span>
                <span>School</span>
                <span className="text-right">Avg Points / Student</span>
              </div>

              <div>
                {paginatedSchools.map((school) => {
                  const globalRank =
                    (school as unknown as { rank?: number }).rank ??
                    schools.findIndex((entry) => entry.id === school.id) + 1 + rankOffset;

                  return (
                    <div
                      key={school.id}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-border/40 px-4 py-4 last:border-b-0 sm:grid-cols-[3rem_1fr_auto]"
                    >
                      <span className="text-sm font-bold text-muted-foreground">#{globalRank}</span>

                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-13 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-1.5 shadow-xs">
                          {school.logoUrl ? (
                            <img
                              src={school.logoUrl}
                              alt={school.name}
                              className="size-full object-contain"
                            />
                          ) : (
                            <BuildingSVG className="size-6 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <Typography className="break-words text-xs font-bold leading-snug text-foreground sm:text-sm">
                            {formatSchoolName(school.name)}
                          </Typography>
                          {school.city && (
                            <p className="text-[11px] text-muted-foreground font-medium sm:hidden">
                              {school.city}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-black text-primary dark:text-white">
                          {school.points.toLocaleString()}
                        </p>
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                          points
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/40 px-4 py-3.5 sm:px-6 bg-muted/15">
                  <p className="text-xs text-muted-foreground">
                    Showing <span className="font-bold text-foreground">{(visiblePage - 1) * PAGE_SIZE + 1}</span> to{" "}
                    <span className="font-bold text-foreground">{Math.min(visiblePage * PAGE_SIZE, activeList.length)}</span> of{" "}
                    <span className="font-bold text-foreground">{activeList.length}</span> schools
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(Math.max(1, visiblePage - 1))}
                      disabled={visiblePage <= 1}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-border/60 bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="size-4" />
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5 && visiblePage > 3) {
                          pageNum = Math.min(visiblePage - 2 + i, totalPages - 4 + i);
                        }
                        const isActive = pageNum === visiblePage;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`size-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${isActive
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentPage(Math.min(totalPages, visiblePage + 1))}
                      disabled={visiblePage >= totalPages}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-border/60 bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                      aria-label="Next page"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : isSearching ? (
            <AppState
              isEmpty={true}
              title="No Schools Found"
              description={`No school matching "${searchTerm}" was found.`}
              icon={StarSVG}
              fullScreen={false}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
