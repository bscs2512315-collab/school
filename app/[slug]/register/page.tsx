import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicCandidateRegisterView from "@/components/elections/PublicCandidateRegisterView";
import { SITE } from "@/lib/site";
import { isReservedElectionSlug } from "@/lib/elections/slug";
import {
  getElectionBySlug,
  listCandidates,
  mapElectionEvent,
  toPublicCandidate,
} from "@/lib/teacher/election-schema";
import type { PublicCandidateRegistration } from "@/types/election";

export const dynamic = "force-dynamic";

async function loadRegistration(slug: string): Promise<PublicCandidateRegistration | null> {
  const normalized = slug.trim().toLowerCase();
  if (
    !normalized ||
    isReservedElectionSlug(normalized) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)
  ) {
    return null;
  }

  const row = await getElectionBySlug(normalized);
  if (!row) return null;
  const event = mapElectionEvent(row);
  const candidates = (await listCandidates(row.id)).map(toPublicCandidate);
  return {
    name: event.name,
    slug: event.slug,
    logoUrl: event.logoUrl,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    status: event.status,
    categories: event.categories,
    registrationClosed: event.registrationClosed,
    resultsApprovedAt: event.resultsApprovedAt,
    candidates,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const election = await loadRegistration(slug);
  if (!election) {
    return { title: "Election not found" };
  }
  return {
    title: `Register as a candidate · ${election.name}`,
    description: `Nominate yourself for ${election.name}.`,
    alternates: { canonical: `/${election.slug}/register` },
    openGraph: {
      title: `Register as a candidate · ${election.name}`,
      description: `Public candidate registration for ${election.name}.`,
      url: `${SITE.url}/${election.slug}/register`,
      type: "website",
      images: election.logoUrl ? [election.logoUrl] : [`${SITE.url}/og.png`],
    },
  };
}

export default async function PublicCandidateRegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const election = await loadRegistration(slug);
  if (!election) notFound();

  return <PublicCandidateRegisterView election={election} />;
}
