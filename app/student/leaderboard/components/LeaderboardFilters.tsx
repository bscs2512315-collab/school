"use client";

import { useEffect, useState } from "react";
import { Class } from "@/types/enums";
import FilterDrawer from "@/components/FilterDrawer";
import { cn } from "@/lib/utils";

interface LeaderboardFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  userClass: string;
  setUserClass: (cls: string) => void;
  userBoard: string;
  setUserBoard: (board: string) => void;
  userCity: string;
  setUserCity: (city: string) => void;
}

export default function LeaderboardFilters({
  isOpen,
  onClose,
  userClass,
  setUserClass,
  userBoard,
  setUserBoard,
  userCity,
  setUserCity,
}: LeaderboardFiltersProps) {
  const [draftClass, setDraftClass] = useState(userClass);
  const [draftBoard, setDraftBoard] = useState(userBoard);
  const [draftCity, setDraftCity] = useState(userCity);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftClass(userClass);
    setDraftBoard(userBoard);
    setDraftCity(userCity);
  }, [isOpen, userBoard, userCity, userClass]);

  const handleApply = () => {
    setUserClass(draftClass);
    setUserBoard(draftBoard);
    setUserCity(draftCity);
    onClose();
  };

  return (
    <FilterDrawer isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Result View
          </h3>
          <div className="cursor-pointer rounded-xl bg-primary px-4 py-3 text-center font-bold text-primary-foreground transition-colors hover:bg-primary/90">
            Class {draftClass} Only
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Filter by Board
          </h3>
          <select
            value={draftBoard}
            onChange={(e) => setDraftBoard(e.target.value)}
            className="w-full appearance-none rounded-xl border border-border/50 bg-card px-4 py-3 font-medium focus:outline-hidden focus:ring-2 focus:ring-primary/50"
          >
            <option>Federal Board</option>
            <option>AKUEB</option>
            <option>Sindh Board</option>
          </select>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Filter by City
          </h3>
          <select
            value={draftCity}
            onChange={(e) => setDraftCity(e.target.value)}
            className="w-full appearance-none rounded-xl border border-border/50 bg-card px-4 py-3 font-medium focus:outline-hidden focus:ring-2 focus:ring-primary/50"
          >
            <option>All Cities</option>
            <option>Karachi</option>
            <option>Lahore</option>
            <option>Islamabad</option>
          </select>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Filter by Class
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(Class).map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setDraftClass(cls)}
                className={cn(
                  "rounded-xl border border-border/50 py-2 font-bold transition-colors hover:bg-muted",
                  { "border-primary bg-primary/10 text-primary": draftClass === cls },
                )}
              >
                Class {cls}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={handleApply}
          className="mt-4 w-full rounded-2xl bg-primary py-3 font-black text-primary-foreground transition-all hover:shadow-lg"
        >
          Apply Filters
        </button>
      </div>
    </FilterDrawer>
  );
}
