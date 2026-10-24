"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Keyboard } from "lucide-react";
import { FRONTEND_ROUTES } from "@/constants/endpoints";

const CharacterScene = dynamic(() => import("./CharacterScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
      Loading lab…
    </div>
  ),
});

export default function WalkPage() {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#e3e7e4]">
      <div className="absolute inset-0">
        <CharacterScene />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <Link
          href={FRONTEND_ROUTES.STUDENT_LAB_GAME}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/80"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <span className="pointer-events-none rounded-full bg-black/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/90 backdrop-blur">
          Character movement · Step 1 (beta)
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-6">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/40 bg-white/90 px-5 py-3 shadow-2xl backdrop-blur-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Keyboard size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black leading-tight text-black">Chemistry Lab (first-person)</h2>
            <p className="text-xs leading-snug text-black/60">
              <b>Arrows/WASD</b> move · <b>drag</b> to look · <b>T</b> water · <b>F</b> stove · <b>E</b> grab extinguisher (walk to it) · <b>Space</b> spray to douse fire.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
