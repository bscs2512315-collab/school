import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicElectionView from "@/components/elections/PublicElectionView";
import { SITE } from "@/lib/site";
import { isReservedElectionSlug } from "@/lib/elections/slug";
import {
  getElectionBySlug,
  listCandidates,
  mapElectionEvent,
  mapPublicElection,
  toPublicCandidate,
} from "@/lib/teacher/election-schema";

// Revalidate page shell every 10 seconds so CDN edge shields the server during voter surges
export const revalidate = 10;

const loadPublicElection = cache(async (slug: string) => {
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
  const candidates = await listCandidates(event.id, false);
  return mapPublicElection(
    event,
    candidates.map(toPublicCandidate),
  );
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const election = await loadPublicElection(slug);
  if (!election) {
    return { title: "Election not found" };
  }
  return {
    title: election.name,
    description: `Cast your vote in ${election.name}. No account required.`,
    alternates: { canonical: `/${election.slug}` },
    openGraph: {
      title: election.name,
      description: `Public voting for ${election.name}.`,
      url: `${SITE.url}/${election.slug}`,
      type: "website",
      images: election.logoUrl ? [election.logoUrl] : [`${SITE.url}/og.png`],
    },
  };
}

export default async function PublicElectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const election = await loadPublicElection(slug);
  if (!election) notFound();

  return <PublicElectionView election={election} />;
}
