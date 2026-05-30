import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { getQuizTopics, getQuizSetsForTopic } from "@/lib/questions/get-questions";
import { createClient } from "@/lib/supabase/server";

type AttemptRow = {
  id: string;
  topic_id: string | null;
  quiz_set_id: string | null;
  correct_count: number;
  wrong_count: number;
  blank_count: number;
  total_questions: number;
  point_delta: number;
  elapsed_seconds: number;
  completed_at: string | null;
  topics: {
    title: string;
    slug: string;
  } | null;
  quiz_sets: {
    title: string;
  } | null;
};

export default async function TestProgressPage() {
  const { user } = await getCurrentUserRole();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const [topics, attemptsResult] = await Promise.all([
    getQuizTopics(),
    supabase
      .from("quiz_attempts")
      .select(
        "id, topic_id, quiz_set_id, correct_count, wrong_count, blank_count, total_questions, point_delta, elapsed_seconds, completed_at, topics(title, slug), quiz_sets(title)",
      )
      .eq("user_id", user.id)
      .eq("mode", "topic")
      .order("completed_at", { ascending: false })
      .limit(20)
      .returns<AttemptRow[]>(),
  ]);
  const attempts = attemptsResult.data ?? [];
  const setLists = await Promise.all(
    topics.slice(0, 8).map((topic) => getQuizSetsForTopic(topic.slug)),
  );

  return (
    <main className="min-h-svh bg-[#f7f6f2]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8">
        <header className="rounded-lg border bg-white/65 p-4 shadow-sm backdrop-blur sm:p-5">
          <p className="text-sm text-muted-foreground">Test ilerlemesi</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Konu durumun
          </h1>
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/">Ana sayfa</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2">
          {setLists.map((setList) => (
            <article
              key={setList.topic.id}
              className="rounded-lg border bg-white/70 p-4 shadow-sm backdrop-blur"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {setList.topic.periodTitle}
                  </p>
                  <h2 className="font-semibold">{setList.topic.title}</h2>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/tests/${setList.topic.slug}`}>Ac</Link>
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                {setList.sets.map((quizSet, index) => {
                  const best = Math.max(
                    0,
                    ...attempts
                      .filter((attempt) => attempt.quiz_set_id === quizSet.id)
                      .map((attempt) => attempt.correct_count),
                  );
                  const previous = setList.sets[index - 1];
                  const previousBest = previous
                    ? Math.max(
                        0,
                        ...attempts
                          .filter((attempt) => attempt.quiz_set_id === previous.id)
                          .map((attempt) => attempt.correct_count),
                      )
                    : 0;
                  const unlocked =
                    index === 0 ||
                    previousBest >= previous.unlockRequiredCorrect;

                  return (
                    <div
                      key={quizSet.id}
                      className="flex items-center justify-between gap-3 rounded-md border bg-white/55 px-3 py-2 text-sm"
                    >
                      <span>{quizSet.title}</span>
                      <span className="text-muted-foreground">
                        {unlocked ? "Acik" : "Kilitli"} / {best}/
                        {quizSet.questionCount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-lg border bg-white/70 p-4 shadow-sm backdrop-blur">
          <h2 className="font-semibold">Son test gecmisi</h2>
          <div className="mt-4 space-y-3">
            {attempts.map((attempt) => (
              <article key={attempt.id} className="rounded-md border bg-white/55 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {attempt.topics?.title ?? "Konu yok"} /{" "}
                      {attempt.quiz_sets?.title ?? "Test"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attempt.completed_at
                        ? new Date(attempt.completed_at).toLocaleDateString("tr-TR")
                        : "Tarih yok"}
                    </p>
                  </div>
                  <span className="rounded-md border bg-white/70 px-2 py-1 text-xs text-muted-foreground">
                    {attempt.point_delta} puan
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Dogru {attempt.correct_count}, yanlis {attempt.wrong_count},
                  bos {attempt.blank_count}, toplam {attempt.total_questions}
                </p>
              </article>
            ))}
            {attempts.length === 0 ? (
              <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">
                Henuz konu testi cozmedin.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
