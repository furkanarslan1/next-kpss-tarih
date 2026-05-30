import Link from "next/link";
import { MedalIcon, TrophyIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { getLeaderboard } from "@/lib/leaderboard/get-leaderboard";

export default async function LeaderboardPage() {
  const { user } = await getCurrentUserRole();

  if (!user) {
    redirect("/login");
  }

  const profiles = await getLeaderboard();

  return (
    <main className="min-h-svh bg-[#f7f6f2]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8">
        <header className="rounded-lg border bg-white/65 p-4 shadow-sm backdrop-blur sm:p-5">
          <p className="text-sm text-muted-foreground">Leaderboard</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Genel siralama
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Konu testlerinden kazanilan toplam puana gore ilk 50 kullanici.
          </p>
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/">Ana sayfa</Link>
            </Button>
          </div>
        </header>

        <section className="rounded-lg border bg-white/70 p-3 shadow-sm backdrop-blur sm:p-4">
          <div className="space-y-2">
            {profiles.map((profile, index) => {
              const isCurrentUser = profile.id === user.id;

              return (
                <article
                  key={profile.id}
                  className={
                    isCurrentUser
                      ? "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-teal-600/40 bg-teal-50/80 p-3"
                      : "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border bg-white/55 p-3"
                  }
                >
                  <div className="flex size-9 items-center justify-center rounded-md border bg-white/70 text-sm font-semibold">
                    {index < 3 ? (
                      <MedalIcon className="size-4 text-amber-600" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      @{profile.username}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {profile.displayName ?? "Isimsiz"} /{" "}
                      <span className={profile.rankTone}>
                        {profile.rankTitle}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="flex items-center justify-end gap-1 text-sm font-semibold">
                      <TrophyIcon className="size-3.5 text-teal-700" />
                      {profile.totalPoints}
                    </p>
                    <p className="text-xs text-muted-foreground">puan</p>
                  </div>
                </article>
              );
            })}
          </div>

          {profiles.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              Henuz siralamada kullanici yok.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
