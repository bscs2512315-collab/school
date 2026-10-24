"use client";

import React, { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import SearchSVG from "@/public/svgs/SearchSVG";
import apiInstance from "@/lib/api-instance";
import ClassroomCard from "@/components/ClassroomCard";
import AppLoader from "@/components/AppLoader";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import { cn } from "@/lib/utils";

interface Classroom {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherImage: string | null;
  subject: string;
  classLevel: string;
  schoolName: string;
}

const CLASS_LEVELS = ["All", "IX", "X", "XI", "XII"];

export default function SchoolClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await (apiInstance.get("/classrooms") as any);
        if (res?.success) setClassrooms(res.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = classrooms.filter(c => {
    const matchClass = filterClass === "All" || c.classLevel === filterClass;
    const matchSearch = !search ||
      c.subject.toLowerCase().includes(search.toLowerCase()) ||
      c.teacherName.toLowerCase().includes(search.toLowerCase());
    return matchClass && matchSearch;
  });

  return (
    <PageContainer>
      <PageHeader
        title="All Classrooms"
        description="Overview of all subject classrooms across your institution."
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <SearchSVG className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search subject or teacher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 bg-muted/30 border border-border/30 rounded-2xl pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-primary transition-all"
          />
        </div>

        {/* Class filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CLASS_LEVELS.map(cls => (
            <button
              key={cls}
              onClick={() => setFilterClass(cls)}
              className={cn(
                "px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all",
                filterClass === cls
                  ? "bg-primary text-background shadow-lg shadow-primary/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {cls === "All" ? "All Classes" : `Class ${cls}`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] flex-1 items-center justify-center py-12">
          <AppLoader className="min-h-0" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/80 bg-card/60 p-8 text-center sm:p-14 backdrop-blur-md">
          <div className="mb-4 flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
            <ClassroomSVG className="size-8 sm:size-9" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-foreground">
            {classrooms.length === 0 ? "No classrooms yet" : "No results found"}
          </h3>
          <p className="mt-1.5 max-w-xs text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {classrooms.length === 0
              ? "Add teachers with subjects and classes to see classrooms here."
              : "Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs font-bold text-muted-foreground mb-4">
            {filtered.length} classroom{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((c) => (
              <ClassroomCard
                key={c.id}
                id={c.id}
                teacherName={c.teacherName}
                teacherImage={c.teacherImage}
                subject={c.subject}
                classLevel={c.classLevel}
                schoolName={c.schoolName}
                href={`/school/classrooms/${encodeURIComponent(c.id)}`}
              />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
