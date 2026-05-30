import Link from "next/link";
import {
  BookOpenIcon,
  BrainIcon,
  FlameIcon,
  MapIcon,
  PencilLineIcon,
  ShuffleIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import { signOutAction } from "@/app/(actions)/actions/auth/auth";
import { Button } from "@/components/ui/button";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { getUserRank } from "@/lib/ranks";
import { createClient } from "@/lib/supabase/server";

type AttemptSummaryRow = {
  correct_count: number;
  wrong_count: number;
  total_questions: number;
};

type ProfileSummary = {
  total_points: number;
  display_name: string | null;
};

export default async function Home() {
  const { user, isAdmin } = await getCurrentUserRole();
  let profile: ProfileSummary | null = null;
  let attempts: AttemptSummaryRow[] = [];

  if (user) {
    const supabase = await createClient();
    const [profileResult, attemptsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("total_points, display_name")
        .eq("id", user.id)
        .maybeSingle()
        .returns<ProfileSummary>(),
      supabase
        .from("quiz_attempts")
        .select("correct_count, wrong_count, total_questions")
        .eq("user_id", user.id)
        .eq("mode", "topic")
        .limit(50)
        .returns<AttemptSummaryRow[]>(),
    ]);

    profile = profileResult.data;
    attempts = attemptsResult.data ?? [];
  }
  const correctCount = attempts.reduce(
    (total, attempt) => total + attempt.correct_count,
    0,
  );
  const wrongCount = attempts.reduce(
    (total, attempt) => total + attempt.wrong_count,
    0,
  );
  const totalQuestions = attempts.reduce(
    (total, attempt) => total + attempt.total_questions,
    0,
  );
  const accuracy =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const rank = getUserRank(profile?.total_points ?? 0);

  return (
    <main className="min-h-svh bg-[#f7f6f2]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8">
        <header className="flex flex-col gap-4 rounded-lg border bg-white/65 p-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {user
                ? `Merhaba ${profile?.display_name ?? "KPSS yolcusu"}`
                : "Kullanici anasayfasi"}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Next KPSS Tarih
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {user ? (
              <>
                {isAdmin ? (
                  <Button asChild variant="outline">
                    <Link href="/admin">Admin</Link>
                  </Button>
                ) : null}
                <form action={signOutAction}>
                  <Button type="submit" variant="outline">
                    Cikis yap
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link href="/login">Giris yap</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Uye ol</Link>
                </Button>
              </>
            )}
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={TrophyIcon}
            label="Toplam puan"
            value={profile?.total_points ?? 0}
          />
          <StatCard icon={MedalIconFallback} label="Rutbe" value={rank.title} />
          <StatCard icon={BrainIcon} label="Cozulen test" value={attempts.length} />
          <StatCard icon={FlameIcon} label="Dogru orani" value={`%${accuracy}`} />
          <StatCard
            icon={BookOpenIcon}
            label="Dogru / Yanlis"
            value={`${correctCount}/${wrongCount}`}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ActionCard
            href={user ? "/tests" : "/login"}
            icon={BrainIcon}
            title="Konu testleri"
            description="Testleri sirayla ac, puan kazan ve zayif konularini yakala."
          />
          <ActionCard
            href={user ? "/tests/random" : "/login"}
            icon={ShuffleIcon}
            title="Rastgele test"
            description="Puansiz pratik modunda tum konulardan karisik soru coz."
          />
          <ActionCard
            href={user ? "/tests/progress" : "/login"}
            icon={TrophyIcon}
            title="Ilerlemem"
            description="Konu testlerinde hangi bolumleri actigini ve gecmisini gor."
          />
          <ActionCard
            href={user ? "/fill-blanks" : "/login"}
            icon={PencilLineIcon}
            title="Bosluk doldurma"
            description="Kavramlari ipucuyla hatirla, sureye karsi cevap yaz."
          />
          <ActionCard
            href={user ? "/leaderboard" : "/login"}
            icon={UsersIcon}
            title="Leaderboard"
            description="Puanini ve rutbeni diger kullanicilarla karsilastir."
          />
          <ActionCard
            href={user ? "/flashcards" : "/login"}
            icon={BookOpenIcon}
            title="Bilgi kartlari"
            description="Sinav oncesi kisa tekrar icin konu kartlarini kaydir."
          />
          <ActionCard
            href="#"
            icon={MapIcon}
            title="Harita ile ogren"
            description="Donem ve olaylari harita uzerinde calisma alani."
          />
        </section>
      </div>
    </main>
  );
}

function MedalIconFallback({ className }: { className?: string }) {
  return <TrophyIcon className={className} />;
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border bg-white/65 p-4 shadow-sm backdrop-blur">
      <Icon className="size-4 text-teal-700" />
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border bg-white/70 p-4 shadow-sm backdrop-blur transition-colors hover:bg-white/90"
    >
      <Icon className="size-5 text-teal-700" />
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </Link>
  );
}
