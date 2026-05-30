import Link from "next/link";
import { redirect } from "next/navigation";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { Button } from "@/components/ui/button";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { getQuizDeck, toPublicQuizQuestion } from "@/lib/questions/get-questions";
import { createClient } from "@/lib/supabase/server";

type TopicWrongsPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    filter?: string;
  }>;
};

type AttemptRow = {
  id: string;
};

type AttemptAnswerRow = {
  question_id: string;
};

export default async function TopicWrongsPage({
  params,
  searchParams,
}: TopicWrongsPageProps) {
  const { user } = await getCurrentUserRole();

  if (!user) {
    redirect("/login");
  }

  const { slug } = await params;
  const { filter = "all" } = await searchParams;
  const deck = await getQuizDeck(slug);
  const supabase = await createClient();
  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("topic_id", deck.topic.id)
    .eq("mode", "topic")
    .order("completed_at", { ascending: false })
    .returns<AttemptRow[]>();
  const attemptIds =
    filter === "latest"
      ? (attempts ?? []).slice(0, 3).map((attempt) => attempt.id)
      : (attempts ?? []).map((attempt) => attempt.id);
  let wrongQuestionIds = new Set<string>();

  if (attemptIds.length > 0) {
    const { data: wrongAnswers } = await supabase
      .from("quiz_attempt_answers")
      .select("question_id")
      .in("attempt_id", attemptIds)
      .eq("is_correct", false)
      .returns<AttemptAnswerRow[]>();

    if (filter === "repeated") {
      const counts = new Map<string, number>();

      for (const answer of wrongAnswers ?? []) {
        counts.set(answer.question_id, (counts.get(answer.question_id) ?? 0) + 1);
      }

      wrongQuestionIds = new Set(
        [...counts.entries()]
          .filter(([, count]) => count >= 2)
          .map(([questionId]) => questionId),
      );
    } else {
      wrongQuestionIds = new Set(
        (wrongAnswers ?? []).map((answer) => answer.question_id),
      );
    }
  }

  const questions = shuffle(
    deck.questions
      .filter((question) => wrongQuestionIds.has(question.id))
      .map(toPublicQuizQuestion),
  ).map((question) => ({
    ...question,
    options: shuffle(question.options),
  }));

  return (
    <main className="flex min-h-svh flex-col bg-[#f7f6f2]">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
        <header className="rounded-lg border bg-white/65 p-4 shadow-sm backdrop-blur sm:p-5">
          <p className="text-sm text-muted-foreground">
            {deck.topic.periodTitle} / {deck.topic.title}
          </p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Yanlislarim
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bu pratik modunda sure ve genel puan tutulmaz.
          </p>
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/tests/${slug}`}>Testler</Link>
              </Button>
              <Button
                asChild
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
              >
                <Link href={`/tests/${slug}/wrongs`}>Tum yanlislar</Link>
              </Button>
              <Button
                asChild
                variant={filter === "latest" ? "default" : "outline"}
                size="sm"
              >
                <Link href={`/tests/${slug}/wrongs?filter=latest`}>
                  Son yanlislar
                </Link>
              </Button>
              <Button
                asChild
                variant={filter === "repeated" ? "default" : "outline"}
                size="sm"
              >
                <Link href={`/tests/${slug}/wrongs?filter=repeated`}>
                  2 kez yanlis
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {questions.length ? (
          <QuizRunner
            mode="random"
            title="Yanlislarim"
            questions={questions}
            backHref={`/tests/${slug}`}
            flashcardsHref={`/flashcards/${slug}`}
          />
        ) : (
          <div className="rounded-lg border border-dashed bg-white/55 p-6 text-sm text-muted-foreground backdrop-blur">
            Bu konuda henuz yanlis veya bos cevabin yok.
          </div>
        )}
      </div>
    </main>
  );
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}
