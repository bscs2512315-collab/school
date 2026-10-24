import type { ElectionTally } from "@/types/election";
import { ElectionStatus } from "@/types/enums";
import { groupCandidatesByRace } from "@/lib/elections/races";

export const LIVE_ANALYTICS_INTERVAL_MS = 20_000;
export const UPCOMING_ANALYTICS_INTERVAL_MS = 30_000;

export function analyticsRefetchInterval(status?: ElectionStatus) {
  if (status === ElectionStatus.LIVE) return LIVE_ANALYTICS_INTERVAL_MS;
  if (status === ElectionStatus.UPCOMING) return UPCOMING_ANALYTICS_INTERVAL_MS;
  return false;
}

export interface RaceTallyGroup {
  key: string;
  label: string;
  totalVotes: number;
  tallies: ElectionTally[];
}

export function groupTalliesByRace(
  tallies: ElectionTally[],
  categoryOrder?: string[],
): RaceTallyGroup[] {
  return groupCandidatesByRace(tallies, categoryOrder).map((group) => {
    const totalVotes = group.candidates.reduce(
      (sum, item) => sum + item.voteCount,
      0,
    );
    return {
      key: group.key,
      label: group.label,
      totalVotes,
      tallies: group.candidates.map((item) => ({
        ...item,
        percentage:
          totalVotes === 0
            ? 0
            : Math.round((item.voteCount / totalVotes) * 1000) / 10,
      })),
    };
  });
}

export interface RaceLeader {
  key: string;
  label: string;
  totalVotes: number;
  leaders: ElectionTally[];
  isTie: boolean;
}

export function getRaceLeaders(groups: RaceTallyGroup[]): RaceLeader[] {
  return groups.map((group) => {
    const topCount = group.tallies.reduce(
      (max, item) => Math.max(max, item.voteCount),
      0,
    );
    const leaders =
      topCount === 0
        ? []
        : group.tallies.filter((item) => item.voteCount === topCount);

    return {
      key: group.key,
      label: group.label,
      totalVotes: group.totalVotes,
      leaders,
      isTie: leaders.length > 1,
    };
  });
}

export function formatVotePercent(value: number): string {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}
