"use client";

import { useState, useEffect } from "react";
import { MapPin, Star } from "lucide-react";
import SearchSVG from "@/public/svgs/SearchSVG";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppState from "@/components/AppState";
import AppLoader from "@/components/AppLoader";
import AppSearch from "@/components/AppSearch";
import { Typography } from "@/components/ui/Typography";
import { useRouter } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { useUserSearch } from "@/hooks/user/useUserSearch";
import type { SearchUser } from "@/types/user";
import UserAvatar from "@/components/UserAvatar";

export default function SearchFriendsPage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const searchQuery = useUserSearch(debouncedQuery);

  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery("");
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const users = searchQuery.data?.users ?? [];
  const total = searchQuery.data?.total ?? 0;
  const hasSearched = Boolean(debouncedQuery) && !searchQuery.isLoading;
  const isSearching = searchQuery.isFetching && Boolean(debouncedQuery);

  const handleViewProfile = (userId: string) => {
    router.push(FRONTEND_ROUTES.STUDENT_FRIEND_DETAIL(userId));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Search Friends"
        showLine={true}
      />

      <AppSearch
        placeholder="Search by username or name..."
        searchTerm={query}
        onSearchChange={setQuery}
        isLoading={isSearching}
        resultsCount={total > 0 ? total : undefined}
        resultsLabel={total === 1 ? "user found" : "users found"}
      />

      {!query.trim() ? (
        <AppState
          variant="empty"
          icon={SearchSVG}
          title="Find Your Friends"
          description="Start typing a username or name to search for students and schools."
          fullScreen={false}
        />
      ) : isSearching && users.length === 0 ? (
        <AppLoader />
      ) : hasSearched && users.length === 0 ? (
        <AppState
          variant="empty"
          icon={SearchSVG}
          title="No Users Found"
          description={`No users match "${query}". Try a different search.`}
          fullScreen={false}
        />
      ) : (
        <div className="grid animate-in grid-cols-1 gap-5 fade-in slide-in-from-bottom-4 duration-500 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user: SearchUser) => (
            <div
              key={user.id}
              className="group relative cursor-pointer overflow-hidden rounded-3xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl sm:p-6"
              onClick={() => handleViewProfile(user.id)}
            >
              <div className="absolute -mr-16 -mt-16 right-0 top-0 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-transform duration-700 group-hover:scale-150" />

              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-4">
                  <UserAvatar
                    src={user.profileImage}
                    name={user.name}
                    username={user.username}
                    id={user.id}
                    size={56}
                    showRing
                    ringClassName="ring-2 ring-primary/30 shadow-sm"
                    className="size-14 shrink-0 transition-transform group-hover:scale-105"
                  />

                  <div className="min-w-0 flex-1">
                    <Typography
                      variant="h4"
                      className="truncate text-sm font-black transition-colors group-hover:text-primary"
                    >
                      {user.name}
                    </Typography>
                    {user.username ? (
                      <Typography variant="muted" className="truncate text-xs">
                        @{user.username}
                      </Typography>
                    ) : null}
                  </div>
                </div>

                <div className="mb-5 flex flex-wrap items-center gap-2">
                  {user.city ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {user.city}
                    </span>
                  ) : null}
                  {user.class ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                      Class {user.class}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-600">
                    <Star className="h-3 w-3" />
                    {user.points}
                  </span>
                </div>

                <div
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/70 bg-muted/60 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-foreground transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/20"
                >
                  View Profile
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
