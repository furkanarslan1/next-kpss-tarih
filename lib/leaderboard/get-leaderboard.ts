import { unstable_cache } from "next/cache";
import { leaderboardTag } from "@/lib/cache-tags";
import { getUserRank } from "@/lib/ranks";
import { createPublicServerClient } from "@/lib/supabase/public-server";

export type LeaderboardEntry = {
  id: string;
  username: string;
  displayName: string | null;
  totalPoints: number;
  rankTitle: string;
  rankTone: string;
};

type LeaderboardProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  total_points: number;
};

async function queryLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = createPublicServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, total_points")
    .not("username", "is", null)
    .order("total_points", { ascending: false })
    .order("updated_at", { ascending: true })
    .limit(50)
    .returns<LeaderboardProfileRow[]>();

  return (data ?? [])
    .filter((profile): profile is LeaderboardProfileRow & { username: string } =>
      Boolean(profile.username),
    )
    .map((profile) => {
      const rank = getUserRank(profile.total_points);

      return {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        totalPoints: profile.total_points,
        rankTitle: rank.title,
        rankTone: rank.tone,
      };
    });
}

export const getLeaderboard = unstable_cache(
  queryLeaderboard,
  ["leaderboard-v1"],
  {
    tags: [leaderboardTag],
    revalidate: 60 * 60 * 6,
  },
);
