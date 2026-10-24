"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AlertCircleSVG from "@/public/svgs/AlertCircleSVG";
import DashboardSVG from "@/public/svgs/DashboardSVG";
import ArrowLeftSVG from "@/public/svgs/ArrowLeftSVG";
import { FRONTEND_ROUTES } from "@/constants/endpoints";

export default function AdminNotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="relative mx-auto max-w-md rounded-3xl border border-destructive/20 bg-card/90 p-8 shadow-2xl backdrop-blur-xl transition-all">
        {/* Decorative Icon */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-8 ring-destructive/5">
          <AlertCircleSVG className="size-8" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Page Not Found
        </h2>
        <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
          The admin management page or resource you requested could not be found.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={FRONTEND_ROUTES.ADMIN_DASHBOARD}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          >
            <DashboardSVG className="size-4" />
            <span>Admin Overview</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push(FRONTEND_ROUTES.ADMIN_DASHBOARD);
              }
            }}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-input bg-background/80 px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:bg-accent active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeftSVG className="size-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
