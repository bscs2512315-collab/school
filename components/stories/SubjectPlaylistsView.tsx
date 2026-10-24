"use client";

import React, { useState } from "react";
import {
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  Flame,
  Info
} from "lucide-react";
import { getSubjectIcon } from "@/lib/generate/subject-icons";
import { cn } from "@/lib/utils";
import AppSearch from "@/components/AppSearch";
import PageHeader from "@/components/PageHeader";
import AppState from "@/components/AppState";
import SearchSVG from "@/public/svgs/SearchSVG";
import PlaySVG from "@/public/svgs/PlaySVG";
import LockSVG from "@/public/svgs/LockSVG";
import { Typography } from "@/components/ui/Typography";

export interface SubjectPlaylist {
  id: string;
  name: string;
  code: string;
  unlocked: boolean;
  videoCount?: number;
  totalDurationMin?: number;
  thumbnailUrl: string;
  chapterCount?: number;
  sloCount?: number;
  description: string;
  gradient: string;
  featuredCharUrl?: string;
  featuredCharName?: string;
}

const DEFAULT_PLAYLISTS: SubjectPlaylist[] = [
  {
    id: "pakistan-studies",
    name: "Pakistan Studies",
    code: "PST-01",
    unlocked: true,
    videoCount: 4,
    totalDurationMin: 10,
    thumbnailUrl: "/stories/bg_minto_park_1940.jpg",
    chapterCount: 4,
    sloCount: 16,
    description: "Interactive 3D animated historical journeys covering FBISE & AKUEB board SLOs from the 1857 War to the 1940 Lahore Resolution.",
    gradient: "from-emerald-600/90 via-teal-700/80 to-slate-900/95",
    featuredCharUrl: "/stories/quaid_jinnah.jpg",
    featuredCharName: "Quaid-e-Azam Jinnah",
  },
  {
    id: "english",
    name: "English Compulsory",
    code: "ENG-01",
    unlocked: false,
    thumbnailUrl: "/stories/bg_mao_college.jpg",
    description: "Animated narrative comprehension, essay structures, grammar drills, and active vocabulary for board exams.",
    gradient: "from-blue-600/90 via-indigo-700/80 to-slate-900/95",
  },
  {
    id: "mathematics",
    name: "Mathematics",
    code: "MTH-01",
    unlocked: false,
    thumbnailUrl: "/stories/bg_mao_college.jpg",
    description: "Visual proofs, algebra tricks, matrices, quadratic equations, and coordinate geometry step-by-step.",
    gradient: "from-amber-600/90 via-orange-700/80 to-slate-900/95",
  },
  {
    id: "physics",
    name: "Physics",
    code: "PHY-01",
    unlocked: false,
    thumbnailUrl: "/stories/bg_minto_park_1940.jpg",
    description: "Visual physics simulations: kinematics, Newton's laws, optics, circuits, and electromagnetism.",
    gradient: "from-purple-600/90 via-indigo-800/80 to-slate-900/95",
  },
  {
    id: "chemistry",
    name: "Chemistry",
    code: "CHM-01",
    unlocked: false,
    thumbnailUrl: "/stories/bg_mao_college.jpg",
    description: "3D molecular dynamics, periodic table trends, stoichiometry, chemical bonding, and acid-base reactions.",
    gradient: "from-cyan-600/90 via-blue-800/80 to-slate-900/95",
  },
  {
    id: "biology",
    name: "Biology",
    code: "BIO-01",
    unlocked: false,
    thumbnailUrl: "/stories/bg_minto_park_1940.jpg",
    description: "Cellular biology, human anatomy, genetics, and ecology animated with 3D organ models.",
    gradient: "from-lime-600/90 via-emerald-800/80 to-slate-900/95",
  },
  {
    id: "computer-science",
    name: "Computer Science",
    code: "CS-01",
    unlocked: false,
    thumbnailUrl: "/stories/bg_mao_college.jpg",
    description: "Algorithms, flowchart animations, C++/Python fundamentals, database concepts, and networking.",
    gradient: "from-sky-600/90 via-cyan-800/80 to-slate-900/95",
  },
  {
    id: "islamiat",
    name: "Islamiat",
    code: "ISL-01",
    unlocked: false,
    thumbnailUrl: "/stories/bg_minto_park_1940.jpg",
    description: "Surah translations, Hadith analysis, Seerat-un-Nabi (PBUH), and ethics for board exam preparation.",
    gradient: "from-teal-600/90 via-emerald-800/80 to-slate-900/95",
  },
];

interface SubjectPlaylistsViewProps {
  currentClass: string;
  onSelectPlaylist: (playlist: SubjectPlaylist) => void;
}

export function SubjectPlaylistsView({
  currentClass,
  onSelectPlaylist,
}: SubjectPlaylistsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [lockedNoticeSubject, setLockedNoticeSubject] = useState<string | null>(null);

  const filteredPlaylists = DEFAULT_PLAYLISTS.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCardClick = (playlist: SubjectPlaylist) => {
    if (playlist.unlocked) {
      onSelectPlaylist(playlist);
    } else {
      setLockedNoticeSubject(playlist.name);
      setTimeout(() => setLockedNoticeSubject(null), 3500);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <PageHeader
        title="Video Lectures"
        showLine={true}
      />

      <AppSearch
        searchLabel="Find your subject"
        placeholder="Search subjects or topics..."
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        resultsCount={filteredPlaylists.length > 0 ? filteredPlaylists.length : undefined}
        resultsLabel={filteredPlaylists.length === 1 ? "subject playlist" : "subject playlists"}
      />

      {/* Locked Toast / Notice */}
      {lockedNoticeSubject && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-bold text-amber-600 dark:text-amber-400 animate-in fade-in slide-in-from-top-2 duration-200">
          <Info className="size-4 shrink-0" />
          <span>
            <strong>{lockedNoticeSubject}</strong> animated lectures are currently under development. Pakistan Studies is fully unlocked for you to explore!
          </span>
        </div>
      )}

      {filteredPlaylists.length === 0 && (
        <AppState
          variant="empty"
          icon={SearchSVG}
          title="No Subjects Found"
          description={`No subjects match "${searchQuery}". Try a different keyword.`}
          fullScreen={false}
        />
      )}

      {/* Playlists Grid (YouTube Playlist Stacks) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredPlaylists.map((playlist) => {
          const IconComp = getSubjectIcon(playlist.name);
          const isUnlocked = playlist.unlocked;

          return (
            <div
              key={playlist.id}
              onClick={() => handleCardClick(playlist)}
              className={cn(
                "group relative flex flex-col rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden",
                isUnlocked
                  ? "border-primary/40 bg-card hover:border-primary hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
                  : "border-border/60 bg-card/60 opacity-85 hover:border-border hover:opacity-100"
              )}
            >
              {/* YouTube-style Stack Layer Behind Thumbnail */}
              <div className="relative pt-3 px-3">
                <div
                  className={cn(
                    "absolute top-1 left-6 right-6 h-3 rounded-t-xl opacity-60 transition-transform duration-300",
                    isUnlocked ? "bg-primary/30 group-hover:-translate-y-1" : "bg-muted"
                  )}
                />
                <div
                  className={cn(
                    "absolute top-2 left-4.5 right-4.5 h-3 rounded-t-xl opacity-80 transition-transform duration-300",
                    isUnlocked ? "bg-primary/50 group-hover:-translate-y-0.5" : "bg-muted/80"
                  )}
                />

                {/* Main Thumbnail Box */}
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900 border border-border/80 shadow-sm">
                  <img
                    src={playlist.thumbnailUrl}
                    alt={playlist.name}
                    className={cn(
                      "size-full object-cover transition-transform duration-500",
                      isUnlocked ? "group-hover:scale-105" : "grayscale-30"
                    )}
                  />

                  {/* Gradient Overlay */}
                  <div className={cn("absolute inset-0 bg-linear-to-t", playlist.gradient)} />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-white">
                      <IconComp className="size-4" />
                    </div>

                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                        <Flame className="size-3" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-md border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 shadow-sm">
                        <LockSVG className="size-3" />
                        Coming Soon
                      </span>
                    )}
                  </div>

                  {/* Center Play / Lock Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isUnlocked ? (
                      <div className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:scale-115">
                        <PlaySVG className="size-5" />
                      </div>
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-full bg-black/60 text-muted-foreground backdrop-blur-xs border border-white/10">
                        <LockSVG className="size-4 text-amber-400" />
                      </div>
                    )}
                  </div>

                  {/* Bottom YouTube Playlist Overlay Bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-black/85 backdrop-blur-sm px-3 py-2 flex items-center justify-between text-white border-t border-white/10">
                    {isUnlocked ? (
                      <>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold">
                          <Layers className="size-3.5 text-primary" />
                          <span>{playlist.videoCount} Episodes</span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-white/70 font-mono">
                          <Clock className="size-3" />
                          <span>~{playlist.totalDurationMin}m</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between w-full text-[10px] font-bold text-amber-300/90">
                        <div className="flex items-center gap-1.5">
                          <LockSVG className="size-3" />
                          <span>In Production</span>
                        </div>
                        <span className="text-white/60 font-medium">Coming Soon</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-primary">
                      {playlist.code}
                    </span>
                    <span className="text-muted-foreground font-medium">
                      {isUnlocked && playlist.sloCount ? `${playlist.sloCount} SLOs` : `Class ${currentClass}`}
                    </span>
                  </div>

                  <h3 className={cn(
                    "text-sm font-black transition-colors leading-snug",
                    isUnlocked ? "text-foreground group-hover:text-primary" : "text-foreground/80"
                  )}>
                    {playlist.name}
                  </h3>

                  <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                    {playlist.description}
                  </p>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-2.5 border-t border-border/40 flex items-center justify-between">
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-xs font-black text-primary group-hover:translate-x-1 transition-transform">
                      <span>Watch Full Playlist</span>
                      <ArrowRight className="size-3.5" />
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-muted-foreground inline-flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>Curriculum Preview</span>
                    </span>
                  )}

                  <span className="text-[10px] font-bold text-muted-foreground">
                    {isUnlocked && playlist.chapterCount ? `${playlist.chapterCount} Chapters` : "AKUEB & FBISE"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
