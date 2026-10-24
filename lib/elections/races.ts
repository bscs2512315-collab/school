import { formatGenderLabel } from "@/lib/elections/format";
import { Gender } from "@/types/enums";
import type { ElectionVote } from "@/types/election";

const GENDER_ORDER: Record<string, number> = {
  [Gender.MALE]: 0,
  [Gender.FEMALE]: 1,
  [Gender.OTHER]: 2,
};

export function getRaceKey(
  category?: string | null,
  gender?: Gender | string | null,
): string {
  return `${(category ?? "").trim().toLowerCase()}::${String(gender ?? "").trim().toLowerCase()}`;
}

export function formatRaceLabel(
  category?: string | null,
  gender?: Gender | string | null,
): string {
  const cat = category?.trim() || "General";
  const genderLabel = formatGenderLabel(gender);
  return genderLabel ? `${cat} (${genderLabel})` : cat;
}

export function raceAnchorId(key: string): string {
  return `race-${key.replace(/[^a-z0-9]+/gi, "-")}`;
}

export interface CandidateRaceGroup<
  T extends { category: string | null; gender: Gender | null },
> {
  key: string;
  label: string;
  category: string | null;
  gender: Gender | null;
  candidates: T[];
}

const CANONICAL_CATEGORY_ORDER = [
  { test: (s: string) => /^president\b/i.test(s) && !/vice/i.test(s) },
  { test: (s: string) => /vice\s*president\b/i.test(s) },
  { test: (s: string) => /general\s*secretary\b/i.test(s) },
  { test: (s: string) => /joint\s*secretary\b/i.test(s) },
  { test: (s: string) => /finance|treasur/i.test(s) },
  { test: (s: string) => /event/i.test(s) },
  { test: (s: string) => /discipline/i.test(s) },
  { test: (s: string) => /sport/i.test(s) },
  { test: (s: string) => /media/i.test(s) },
  { test: (s: string) => /literary|debating/i.test(s) },
  { test: (s: string) => /art/i.test(s) },
  { test: (s: string) => /community/i.test(s) },
];

export function getCategorySortRank(
  category?: string | null,
  categoryOrder?: string[],
): number {
  if (!category) return 999;
  const trimmed = category.trim();

  // 1. If explicit categoryOrder is provided, find matching index
  if (categoryOrder && categoryOrder.length > 0) {
    const trimmedLower = trimmed.toLowerCase();
    const exactIdx = categoryOrder.findIndex(
      (cat) => cat.trim().toLowerCase() === trimmedLower,
    );
    if (exactIdx !== -1) return exactIdx;

    // Fuzzy matching between categoryOrder items and candidate category
    for (let i = 0; i < categoryOrder.length; i++) {
      const orderItem = categoryOrder[i];
      for (const rule of CANONICAL_CATEGORY_ORDER) {
        if (rule.test(orderItem) && rule.test(trimmed)) {
          return i;
        }
      }
    }
  }

  // 2. Canonical student council hierarchy
  for (let i = 0; i < CANONICAL_CATEGORY_ORDER.length; i++) {
    if (CANONICAL_CATEGORY_ORDER[i].test(trimmed)) {
      return i;
    }
  }

  return 500;
}

export function groupCandidatesByRace<
  T extends { category: string | null; gender: Gender | null },
>(candidates: T[], categoryOrder?: string[]): CandidateRaceGroup<T>[] {
  const groups = new Map<string, T[]>();

  for (const candidate of candidates) {
    const key = getRaceKey(candidate.category, candidate.gender);
    const list = groups.get(key) ?? [];
    list.push(candidate);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .map(([key, items]) => {
      const first = items[0];
      return {
        key,
        label: formatRaceLabel(first.category, first.gender),
        category: first.category,
        gender: first.gender,
        candidates: items,
      };
    })
    .sort((a, b) => {
      const rankA = getCategorySortRank(a.category, categoryOrder);
      const rankB = getCategorySortRank(b.category, categoryOrder);
      if (rankA !== rankB) return rankA - rankB;

      const byCategory = (a.category ?? "").localeCompare(b.category ?? "");
      if (byCategory !== 0) return byCategory;
      return (
        (GENDER_ORDER[a.gender ?? ""] ?? 9) -
        (GENDER_ORDER[b.gender ?? ""] ?? 9)
      );
    });
}

export interface VoterBallotRow {
  key: string;
  voterName: string;
  voterRollNumber: string;
  voterSelfieUrl: string | null;
  latestVoteAt: string;
  voteIds: string[];
  discarded: boolean;
  discardedReason: string | null;
  resolved: boolean;
  resolvedAt: string | null;
  picks: Record<string, ElectionVote>;
}

export interface RaceColumn {
  key: string;
  label: string;
}

export function getRaceColumnsFromTallies(
  items: { category: string | null; gender: Gender | null }[],
  categoryOrder?: string[],
): RaceColumn[] {
  return groupCandidatesByRace(items, categoryOrder).map((group) => ({
    key: group.key,
    label: group.label,
  }));
}

export function groupVotesByVoter(votes: ElectionVote[]): VoterBallotRow[] {
  const rows = new Map<string, VoterBallotRow>();

  for (const vote of votes) {
    const key = vote.voterRollNumber.trim().toLowerCase();
    const raceKey = getRaceKey(vote.candidateCategory, vote.candidateGender);
    const existing = rows.get(key);

    if (!existing) {
      rows.set(key, {
        key,
        voterName: vote.voterName,
        voterRollNumber: vote.voterRollNumber,
        voterSelfieUrl: vote.voterSelfieUrl,
        latestVoteAt: vote.createdAt,
        voteIds: [vote.id],
        discarded: Boolean(vote.discardedAt),
        discardedReason: vote.discardedAt ? vote.discardedReason : null,
        resolved: Boolean(vote.resolvedAt),
        resolvedAt: vote.resolvedAt ?? null,
        picks: { [raceKey]: vote },
      });
      continue;
    }

    existing.picks[raceKey] = vote;
    if (!existing.voteIds.includes(vote.id)) existing.voteIds.push(vote.id);
    existing.discarded =
      Object.values(existing.picks).every((item) => Boolean(item.discardedAt));
    existing.discardedReason =
      existing.discardedReason ??
      (vote.discardedAt ? vote.discardedReason : null);
    if (vote.resolvedAt) {
      existing.resolved = true;
      existing.resolvedAt = vote.resolvedAt;
    }
    if (new Date(vote.createdAt) > new Date(existing.latestVoteAt)) {
      existing.latestVoteAt = vote.createdAt;
      existing.voterName = vote.voterName;
      existing.voterSelfieUrl = vote.voterSelfieUrl ?? existing.voterSelfieUrl;
    }
  }

  return [...rows.values()].sort(
    (a, b) =>
      new Date(b.latestVoteAt).getTime() - new Date(a.latestVoteAt).getTime(),
  );
}
