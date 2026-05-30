import Link from "next/link";
import { redirect } from "next/navigation";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { Button } from "@/components/ui/button";
import { getCurrentUserRole } from "@/lib/auth/roles";
import {
  getAllQuizQuestions,
  toPublicQuizQuestion,
} from "@/lib/questions/get-questions";

const RANDOM_TEST_QUESTION_COUNT = 20;

export default async function RandomTestPage() {
  const { user } = await getCurrentUserRole();

  if (!user) {
    redirect("/login");
  }

  const questions = shuffle(await getAllQuizQuestions())
    .slice(0, RANDOM_TEST_QUESTION_COUNT)
    .map(toPublicQuizQuestion)
    .map((question) => ({
      ...question,
      options: shuffle(question.options),
    }));

  return (
    <main className="flex min-h-svh flex-col bg-[#f7f6f2]">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
        <header className="grid gap-3 rounded-lg border bg-white/65 p-4 shadow-sm backdrop-blur sm:flex sm:items-start sm:justify-between sm:p-5">
          <div>
            <p className="text-sm text-muted-foreground">Pratik modu</p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Rastgele test
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bu modda sure ve genel puan tutulmaz.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/tests">Konular</Link>
          </Button>
        </header>

        <QuizRunner
          mode="random"
          title="Rastgele test"
          questions={questions}
          backHref="/tests"
        />
      </div>
    </main>
  );
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}
