"use client";

import { useSyncExternalStore } from "react";
import {
  buildElectionPublicUrl,
  buildElectionRegisterUrl,
  electionPublicPath,
  electionRegisterPath,
} from "@/lib/elections/public-url";

function subscribe() {
  return () => undefined;
}

function getSnapshot() {
  return window.location.origin;
}

function getServerSnapshot() {
  return "";
}

export function useElectionPublicUrl(slug: string): string {
  const origin = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!origin) return electionPublicPath(slug);
  return buildElectionPublicUrl(slug, origin);
}

export function useElectionRegisterUrl(slug: string): string {
  const origin = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!origin) return electionRegisterPath(slug);
  return buildElectionRegisterUrl(slug, origin);
}

export async function copyElectionLink(slug: string): Promise<string> {
  const url = buildElectionPublicUrl(slug, window.location.origin);
  await navigator.clipboard.writeText(url);
  return url;
}

export async function copyElectionRegisterLink(slug: string): Promise<string> {
  const url = buildElectionRegisterUrl(slug, window.location.origin);
  await navigator.clipboard.writeText(url);
  return url;
}
