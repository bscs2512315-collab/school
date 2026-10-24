import type { LeaderboardEntry } from "@/components/LeaderboardView";

export interface PodiumUser {
  user: LeaderboardEntry;
  rank: number;
}

const PODIUM_ORDERS: Record<number, number[]> = {
  5: [4, 2, 0, 1, 3],
  3: [1, 0, 2],
  2: [1, 0],
  1: [0],
};

export function getPodiumUsers(users: LeaderboardEntry[], count: number): PodiumUser[] {
  const slice = users.slice(0, count);
  const order = PODIUM_ORDERS[count] ?? slice.map((_, index) => index);

  return order
    .map((index) => {
      const user = slice[index];
      if (!user) return null;
      return { user, rank: index + 1 };
    })
    .filter((entry): entry is PodiumUser => entry !== null);
}
