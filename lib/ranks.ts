export type UserRank = {
  title: string;
  minPoints: number;
  tone: string;
};

export const userRanks = [
  { title: "Aday", minPoints: 0, tone: "text-zinc-700" },
  { title: "Caliskan", minPoints: 500, tone: "text-teal-700" },
  { title: "Usta", minPoints: 1500, tone: "text-emerald-700" },
  { title: "Bilgin", minPoints: 3500, tone: "text-amber-700" },
  { title: "Efsane", minPoints: 7500, tone: "text-rose-700" },
] satisfies UserRank[];

export function getUserRank(points: number) {
  return [...userRanks]
    .reverse()
    .find((rank) => points >= rank.minPoints) ?? userRanks[0];
}
