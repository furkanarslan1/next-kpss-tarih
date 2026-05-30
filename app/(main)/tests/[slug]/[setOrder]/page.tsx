import Link from "next/link";
import { redirect } from "next/navigation";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { Button } from "@/components/ui/button";
import { getCurrentUserRole } from "@/lib/auth/roles";
import {
  getQuizSetDeck,
  getQuizSetsForTopic,
  toPublicQuizQuestion,
} from "@/lib/questions/get-questions";
import { createClient } from "@/lib/supabase/server";

type TopicTestSetPageProps = {
  params: Promise<{
    slug: string;
    setOrder: string;
  }>;
};

type AttemptProgressRow = {
  quiz_set_id: string | null;
  correct_count: number;
};

export default async function TopicTestSetPage({
  params,
}: TopicTestSetPageProps) {
  const { user } = await getCurrentUserRole();

  if (!user) {
    redirect("/login");
  }

  const { slug, setOrder } = await params;
  const numericSetOrder = Number(setOrder);

  if (!Number.isInteger(numericSetOrder) || numericSetOrder < 1) {
    redirect(`/tests/${slug}`);
  }

  const quizSetList = await getQuizSetsForTopic(slug);
  const requestedSet = quizSetList.sets.find(
    (quizSet) => quizSet.setOrder === numericSetOrder - 1,
  );

  if (!requestedSet) {
    redirect(`/tests/${slug}`);
  }

  const supabase = await createClient();
  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("quiz_set_id, correct_count")
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

  const previousSet = quizSetList.sets.find(
    (quizSet) => quizSet.setOrder === requestedSet.setOrder - 1,
  );
  const isUnlocked =
    requestedSet.setOrder === 0 ||
    (previousSet
      ? (bestCorrectBySetId.get(previousSet.id) ?? 0) >=
        previousSet.unlockRequiredCorrect
      : false);

  if (!isUnlocked) {
    redirect(`/tests/${slug}`);
  }

  const deck = await getQuizSetDeck(slug, requestedSet.setOrder);
  const nextSet = quizSetList.sets.find(
    (quizSet) => quizSet.setOrder === requestedSet.setOrder + 1,
  );
  const questions = shuffle(deck.questions.map(toPublicQuizQuestion)).map(
    (question) => ({
      ...question,
      options: shuffle(question.options),
    }),
  );

  return (
    <main className="flex min-h-svh flex-col bg-[#f7f6f2]">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
        <header className="grid gap-3 rounded-lg border bg-white/65 p-4 shadow-sm backdrop-blur sm:flex sm:items-start sm:justify-between sm:p-5">
          <div>
            <p className="text-sm text-muted-foreground">
              {deck.topic.periodTitle} / {deck.topic.title}
            </p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {deck.quizSet?.title ?? `${numericSetOrder}. Test`}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sure ve puan bu modda tutulur.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/tests/${slug}`}>Testler</Link>
          </Button>
        </header>

        <QuizRunner
          mode="topic"
          topicId={deck.topic.id}
          quizSetId={deck.quizSet?.id ?? null}
          title={deck.quizSet?.title ?? deck.topic.title}
          questions={questions}
          backHref={`/tests/${slug}`}
          flashcardsHref={`/flashcards/${slug}`}
          nextTestHref={
            nextSet ? `/tests/${slug}/${nextSet.setOrder + 1}` : null
          }
          unlockRequiredCorrect={requestedSet.unlockRequiredCorrect}
        />
      </div>
    </main>
  );
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}
