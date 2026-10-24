"use client";

import { useMemo, useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import AppSearch from "@/components/AppSearch";
import AppState from "@/components/AppState";
import LeaderboardTopCards from "@/components/leaderboard/LeaderboardTopCards";
import LeaderboardListEntry from "@/components/leaderboard/LeaderboardListEntry";

export interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  rank?: number;
  username?: string;
  schoolName?: string | null;
  schoolLogo?: string | null;
  classLevel?: string | null;
  trend?: "up" | "down" | "stable";
  profilePic?: string;
}

interface LeaderboardFilterDropdown {
  id: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}

interface LeaderboardViewProps {
  users: LeaderboardEntry[];
  emptyTitle?: string;
  emptyDescription?: string;
  currentUserId?: string;
  hideTopCards?: boolean;
  showFullRankings?: boolean;
  rankOffset?: number;
  filterDropdowns?: LeaderboardFilterDropdown[];
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

const TOP_PODIUM_COUNT = 5;
const PAGE_SIZE = 20;

function matchesSearch(user: LeaderboardEntry, term: string): boolean {
  const query = term.trim().toLowerCase();
  if (!query) return true;

  const haystack = [
    user.name,
    user.username,
    user.schoolName,
    user.classLevel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export default function LeaderboardView({
  users,
  emptyTitle = "Competition Initializing",
  emptyDescription = "The leaderboard is being refreshed with latest performance data.",
  currentUserId,
  hideTopCards = false,
  showFullRankings = false,
  rankOffset = 0,
  filterDropdowns = [],
  hasActiveFilters = false,
  onClearFilters,
}: LeaderboardViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, users]);

  const podiumUsers = useMemo(() => {
    if (hideTopCards || searchTerm.trim()) return [];
    return users.slice(0, TOP_PODIUM_COUNT).map((user, index) => ({
      user,
      rank: user.rank ?? (index + 1 + rankOffset),
    }));
  }, [hideTopCards, searchTerm, users, rankOffset]);

  const listUsers = useMemo(() => {
    if (hideTopCards || showFullRankings) return users;
    return users.slice(TOP_PODIUM_COUNT);
  }, [hideTopCards, showFullRankings, users]);

  // When searching, search across ALL users (podium + remaining) so no user is missed
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return users.filter((user) => matchesSearch(user, searchTerm));
  }, [users, searchTerm]);

  const isSearching = Boolean(searchTerm.trim());
  const activeList = isSearching ? searchResults : listUsers;

  const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return activeList.slice(start, start + PAGE_SIZE);
  }, [activeList, currentPage]);

  if (users.length === 0) {
    return (
      <AppState
        isEmpty={true}
        title={emptyTitle}
        description={emptyDescription}
        icon={Star}
        fullScreen={false}
      />
    );
  }

  const showListSection = listUsers.length > 0 || filterDropdowns.length > 0 || isSearching;

  return (
    <div className="flex min-w-0 w-full flex-col gap-4 pb-28 sm:pb-32 lg:pb-8">
      {podiumUsers.length > 0 ? (
        <LeaderboardTopCards podiumUsers={podiumUsers} currentUserId={currentUserId} />
      ) : null}

      {showListSection ? (
        <div className="flex flex-col gap-5">
          <AppSearch
            searchLabel="Global Search"
             placeholder="Search student by name, school..."
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            dropdowns={filterDropdowns}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={onClearFilters}
            resultsCount={isSearching ? searchResults.length : undefined}
            resultsLabel="students found"
          />

          {paginatedUsers.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-4 sm:px-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {isSearching ? `Search Results (${searchResults.length})` : "All Rankings"}
                </p>
                {activeList.length > PAGE_SIZE && (
                  <p className="text-xs text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                )}
              </div>

               <div className="hidden grid-cols-[3rem_1fr_auto] gap-3 border-b border-border/40 px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:grid sm:px-6">
                 <span>Rank</span>
                 <span>Student</span>
                 <span className="text-right">Points</span>
               </div>

              <div>
                {paginatedUsers.map((user) => {
                  const globalRank =
                    user.rank ??
                    (users.findIndex((entry) => entry.id === user.id) + 1 + rankOffset);

                  return (
                    <LeaderboardListEntry
                      key={user.id}
                      user={user}
                      rank={globalRank}
                      currentUserId={currentUserId}
                    />
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/40 px-4 py-3.5 sm:px-6 bg-muted/15">
                  <p className="text-xs text-muted-foreground">
                    Showing <span className="font-bold text-foreground">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
                    <span className="font-bold text-foreground">{Math.min(currentPage * PAGE_SIZE, activeList.length)}</span> of{" "}
                    <span className="font-bold text-foreground">{activeList.length}</span> students
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-border/60 bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="size-4" />
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5 && currentPage > 3) {
                          pageNum = Math.min(currentPage - 2 + i, totalPages - 4 + i);
                        }
                        const isActive = pageNum === currentPage;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`size-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              isActive
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
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
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
              title="No Students Found"
              description={`No student matching "${searchTerm}" was found.`}
              icon={Star}
              fullScreen={false}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
