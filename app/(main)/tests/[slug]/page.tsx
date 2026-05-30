import Link from "next/link";
import { LockIcon, RotateCcwIcon, SparklesIcon, TrophyIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { getQuizSetsForTopic } from "@/lib/questions/get-questions";
import { createClient } from "@/lib/supabase/server";

type TopicTestsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type AttemptProgressRow = {
  quiz_set_id: string | null;
  correct_count: number;
  wrong_count: number;
  blank_count: number;
};

export default async function TopicTestsPage({ params }: TopicTestsPageProps) {
  const { user } = await getCurrentUserRole();

  if (!user) {
    redirect("/login");
  }

  const { slug } = await params;
  const quizSetList = await getQuizSetsForTopic(slug);
  const supabase = await createClient();
  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("quiz_set_id, correct_count, wrong_count, blank_count")
    .eq("user_id", user.id)
    .eq("topic_id", quizSetList.topic.id)
    .eq("mode", "topic")
    .returns<AttemptProgressRow[]>();
  const bestCorrectBySetId = new Map<string, number>();

  for (const attempt of attempts ?? []) {
    if (!attempt.quiz_set_id) continue;
    bestCorrectBySetId.set(
      attempt.quiz_set_id,
      Math.max(
        bestCorrectBySetId.get(attempt.quiz_set_id) ?? 0,
        attempt.correct_count,
      ),
    );
  }
  const hasMissedQuestions = (attempts ?? []).some(
    (attempt) => attempt.wrong_count + attempt.blank_count > 0,
  );

  return (
    <main className="min-h-svh bg-[#f7f6f2]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8">
        <header className="rounded-lg border bg-white/65 p-4 shadow-sm backdrop-blur sm:p-5">
          <div>
            <p className="text-sm text-muted-foreground">
              {quizSetList.topic.periodTitle}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {quizSetList.topic.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Testler sirayla acilir. Bir sonraki test icin onceki testte
              gerekli dogru sayisina ulasman gerekir.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/tests">Konular</Link>
            </Button>
            {hasMissedQuestions ? (
              <Button asChild size="sm">
                <Link href={`/tests/${slug}/wrongs`}>
                  <RotateCcwIcon />
                  Yanlislarim
                </Link>
              </Button>
            ) : null}
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          {quizSetList.sets.map((quizSet, index) => {
            const previousSet = quizSetList.sets[index - 1];
            const previousBest = previousSet
              ? bestCorrectBySetId.get(previousSet.id) ?? 0
              : 0;
            const isUnlocked =
              index === 0 ||
              previousBest >= previousSet.unlockRequiredCorrect;
            const bestCorrect = bestCorrectBySetId.get(quizSet.id) ?? 0;
            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      {isUnlocked ? (
                        <SparklesIcon className="size-3.5 text-teal-700" />
                      ) : (
                        <LockIcon className="size-3.5" />
                      )}
                      {isUnlocked ? "Acik" : "Kilitli"} /{" "}
                      {quizSet.questionCount} soru
                    </p>
                    <h2 className="mt-1 font-semibold">{quizSet.title}</h2>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md border bg-white/65 px-2 py-1 text-xs text-muted-foreground">
                    <TrophyIcon className="size-3" />
                    {bestCorrect}/{quizSet.questionCount}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Sonraki test icin hedef:{" "}
                  {quizSet.unlockRequiredCorrect}/{quizSet.questionCount}
                </p>
              </>
            );

            if (!isUnlocked) {
              return (
                <div
                  key={quizSet.id}
                  className="rounded-lg border bg-white/45 p-4 text-muted-foreground shadow-sm backdrop-blur"
                >
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <LockIcon className="size-4" />
                    Kilitli
                  </div>
                  {content}
                  <p className="mt-3 text-xs">
                    {quizSet.title} icin {previousSet.title} bolumunde en az{" "}
                    {previousSet.unlockRequiredCorrect} dogru yapmalisin.
                  </p>
                </div>
              );
            }

            return (
              <Link
                key={quizSet.id}
                href={`/tests/${quizSetList.topic.slug}/${quizSet.setOrder + 1}`}
                className="rounded-lg border bg-white/70 p-4 shadow-sm backdrop-blur transition-colors hover:bg-white/90"
              >
                {content}
              </Link>
            );
          })}
        </section>

        {quizSetList.sets.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Bu konu icin yayinda test bolumu yok.
          </div>
        ) : null}
      </div>
    </main>
  );
}
