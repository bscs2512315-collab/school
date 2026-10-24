"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import SearchSVG from "@/public/svgs/SearchSVG";
import FilterSVG from "@/public/svgs/FilterSVG";
import AppLabel from "./AppLabel";
import AppDropdown from "./AppDropdown";
import FilterDrawer from "./FilterDrawer";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

interface FilterDropdown {
    id: string;
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
    className?: string;
    searchable?: boolean;
}

interface AppSearchProps {
    // Main search
    searchTerm: string;
    onSearchChange: (value: string) => void;
    placeholder?: string;
    searchLabel?: string;
    isLoading?: boolean;

    // Additional filters
    dropdowns?: FilterDropdown[];

    // Date filter
    dateValue?: string;
    onDateChange?: (value: string) => void;
    dateLabel?: string;

    // Results & Actions
    resultsCount?: number;
    resultsLabel?: string;
    onClearFilters?: () => void;
    hasActiveFilters?: boolean;

    className?: string;
}

function buildDraftDropdownValues(dropdowns: FilterDropdown[]): Record<string, string> {
    return dropdowns.reduce<Record<string, string>>((acc, dropdown) => {
        acc[dropdown.id] = dropdown.value;
        return acc;
    }, {});
}

export default function AppSearch({
    searchTerm,
    onSearchChange,
    placeholder = "Search...",
    searchLabel,
    isLoading = false,
    dropdowns = [],
    dateValue,
    onDateChange,
    dateLabel,
    resultsCount,
    resultsLabel = "results found",
    onClearFilters,
    hasActiveFilters = false,
    className
}: AppSearchProps) {
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [draftDropdownValues, setDraftDropdownValues] = useState<Record<string, string>>({});
    const [draftDateValue, setDraftDateValue] = useState("");
    const hasFilters = dropdowns.length > 0 || dateValue !== undefined;

    const openFilterDrawer = () => {
        setDraftDropdownValues(buildDraftDropdownValues(dropdowns));
        setDraftDateValue(dateValue ?? "");
        setIsFilterDrawerOpen(true);
    };

    const handleApplyFilters = () => {
        dropdowns.forEach((dropdown) => {
            const nextValue = draftDropdownValues[dropdown.id] ?? dropdown.value;
            if (nextValue !== dropdown.value) {
                dropdown.onChange({
                    target: { value: nextValue },
                } as React.ChangeEvent<HTMLSelectElement>);
            }
        });

        if (onDateChange && dateValue !== undefined && draftDateValue !== dateValue) {
            onDateChange(draftDateValue);
        }

        setIsFilterDrawerOpen(false);
    };

    const handleResetFilters = () => {
        if (onClearFilters) {
            onClearFilters();
        }
        setIsFilterDrawerOpen(false);
    };

    const handleCloseDrawer = () => {
        setIsFilterDrawerOpen(false);
    };

    return (
        <>
            <div className={cn(
                "rounded-3xl border border-border/40 bg-primary/10 p-4 text-left shadow-sm backdrop-blur-xl sm:rounded-4xl sm:p-5",
                className
            )}>
                <div className="flex gap-4 items-end w-full">
                    {/* Search Input */}
                    <div className="relative group flex-1">
                        {searchLabel ? (
                            <AppLabel htmlFor="app-search" className="text-[10px] font-black uppercase tracking-widest mb-2 sm:mb-3 ml-4 text-primary/70 dark:text-white/80 block">
                                {searchLabel}
                            </AppLabel>
                        ) : null}
                        <div className="relative w-full">
                            <SearchSVG className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-primary/40 dark:text-white/60 transition-colors group-focus-within:text-primary dark:group-focus-within:text-white" />
                            <Input
                                id="app-search"
                                type="text"
                                placeholder={placeholder}
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="h-12 w-full rounded-2xl border-primary/10 bg-background/50 pl-12 pr-12 text-xs placeholder:text-xs sm:h-14 sm:text-sm sm:placeholder:text-sm md:text-sm dark:bg-card/50 dark:border-border/60"
                            />
                            {isLoading ? (
                                <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary dark:text-white" />
                            ) : null}
                        </div>
                    </div>

                    {/* Filter Button */}
                    {hasFilters ? (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={openFilterDrawer}
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-4 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98] sm:h-14 sm:px-6"
                            >
                                <FilterSVG className="size-6 sm:size-5" />
                                <span className="hidden sm:inline">Filters</span>
                                {hasActiveFilters ? (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-background opacity-60"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-background border-2 border-primary shadow-sm"></span>
                                    </span>
                                ) : null}
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            <FilterDrawer isOpen={isFilterDrawerOpen} onClose={handleCloseDrawer} title="Filters">
                <div className="flex flex-col gap-6 pt-2 h-full pb-10">
                    {dropdowns.map((dropdown) => (
                        <div key={dropdown.id} className="relative group">
                            {dropdown.label ? (
                                <AppLabel htmlFor={dropdown.id} className="text-xs font-bold uppercase tracking-widest mb-2 ml-1 text-primary/70 dark:text-white/80 block">
                                    {dropdown.label}
                                </AppLabel>
                            ) : null}
                            <AppDropdown
                                id={dropdown.id}
                                value={draftDropdownValues[dropdown.id] ?? dropdown.value}
                                onChange={(e) => {
                                    setDraftDropdownValues((current) => ({
                                        ...current,
                                        [dropdown.id]: e.target.value,
                                    }));
                                }}
                                placeholder={dropdown.placeholder}
                                options={dropdown.options}
                                searchable={
                                    dropdown.searchable ??
                                    (dropdown.id?.toLowerCase().includes("subject") ||
                                        dropdown.label?.toLowerCase().includes("subject") ||
                                        dropdown.options.length > 6)
                                }
                                className={cn("h-14 rounded-xl bg-background hover:bg-muted focus:ring-primary/20", dropdown.className)}
                            />
                        </div>
                    ))}

                    {dateValue !== undefined && onDateChange ? (
                        <div className="relative group">
                            {dateLabel ? (
                                <AppLabel htmlFor="date-filter" className="text-xs font-bold uppercase tracking-widest mb-2 ml-1 text-primary/70 dark:text-white/80 block">
                                    {dateLabel}
                                </AppLabel>
                            ) : null}
                            <Input
                                id="date-filter"
                                type="date"
                                value={draftDateValue}
                                onChange={(e) => setDraftDateValue(e.target.value)}
                                className="h-14 rounded-xl bg-background border border-border/80 hover:bg-muted focus:ring-primary/20"
                            />
                        </div>
                    ) : null}

                    <div className="mt-auto pt-6 flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={handleApplyFilters}
                            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            Apply Filters
                        </button>

                        {hasActiveFilters && onClearFilters ? (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="w-full h-12 rounded-xl border-0 bg-primary/10 text-primary dark:bg-muted dark:text-foreground font-bold hover:bg-primary/15 transition-colors"
                            >
                                Reset All Filters
                            </button>
                        ) : null}
                    </div>
                </div>
            </FilterDrawer>
        </>
    );
}
