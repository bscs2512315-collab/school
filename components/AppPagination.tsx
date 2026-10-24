"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/Typography";

interface AppPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  className?: string;
  summaryClassName?: string;
  reverseMobileOrder?: boolean;
  showSummary?: boolean;
}

const ELLIPSIS = "ellipsis" as const;

/** Build a compact page list: 1 … 4 5 [6] 7 8 … 20 */
function getPageItems(
  currentPage: number,
  totalPages: number,
): (number | typeof ELLIPSIS)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: (number | typeof ELLIPSIS)[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) items.push(ELLIPSIS);
  for (let page = start; page <= end; page++) items.push(page);
  if (end < totalPages - 1) items.push(ELLIPSIS);

  items.push(totalPages);
  return items;
}

export function AppPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemLabel,
  onPageChange,
  className,
  summaryClassName,
  reverseMobileOrder = true,
  showSummary = true,
}: AppPaginationProps) {
  if (totalItems === 0 || (totalPages <= 1 && !showSummary)) {
    return null;
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const pageItems = getPageItems(currentPage, totalPages);

  const arrowClassName = cn(
    "inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-all cursor-pointer",
    "hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
    "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-card disabled:hover:text-foreground",
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row",
        className,
      )}
    >
      {showSummary ? (
        <Typography
          variant="small"
          className={cn(
            "font-medium text-muted-foreground",
            {
              "order-2 sm:order-1": reverseMobileOrder,
            },
            summaryClassName,
          )}
        >
          Showing <span className="text-foreground">{startItem}</span> to{" "}
          <span className="text-foreground">{endItem}</span> of{" "}
          <span className="font-bold text-foreground">{totalItems}</span> {itemLabel}
        </Typography>
      ) : null}

      {totalPages > 1 ? (
        <nav
          aria-label="Pagination"
          className={cn("flex items-center gap-1.5", {
            "order-1 sm:order-2": reverseMobileOrder && showSummary,
          })}
        >
        <button
          type="button"
          aria-label="Previous page"
          className={arrowClassName}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="flex items-center gap-1">
          {pageItems.map((item, index) =>
            item === ELLIPSIS ? (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex size-9 items-center justify-center text-sm text-muted-foreground"
              >
                &hellip;
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-label={`Page ${item}`}
                aria-current={item === currentPage ? "page" : undefined}
                onClick={() => onPageChange(item)}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-xl text-sm font-semibold transition-all",
                  item === currentPage
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
                )}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          aria-label="Next page"
          className={arrowClassName}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="size-4" />
        </button>
      </nav>
      ) : null}
    </div>
  );
}
