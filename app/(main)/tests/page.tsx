import Link from "next/link";
import { ShuffleIcon, TargetIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { getQuizTopics } from "@/lib/questions/get-questions";

export default async function TestTopicsPage() {
  const { user } = await getCurrentUserRole();

  if (!user) {
    redirect("/login");
  }

  const topics = await getQuizTopics();

  return (
    <main className="min-h-svh bg-[#f7f6f2]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8">
        <header className="rounded-lg border bg-white/65 p-5 shadow-sm backdrop-blur">
          <p className="text-sm text-muted-foreground">Test coz</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Test modu sec
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Konu testlerinde sure ve puan tutulur. Rastgele test pratik
            modudur; sure ve genel puan yoktur.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/tests/random"
            className="rounded-lg border bg-white/70 p-4 shadow-sm backdrop-blur transition-colors hover:bg-white/90"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <ShuffleIcon className="size-3.5 text-teal-700" />
                  Pratik modu
                </p>
                <h2 className="mt-1 font-semibold">Rastgele test coz</h2>
              </div>
              <span className="shrink-0 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">
                Puan yok
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Tum konulardan karisik sorular gelir; sure ve genel puan
              hesaplanmaz.
            </p>
          </Link>

          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/tests/${topic.slug}`}
              className="rounded-lg border bg-white/70 p-4 shadow-sm backdrop-blur transition-colors hover:bg-white/90"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TargetIcon className="size-3.5 text-teal-700" />
                    {topic.periodTitle}
                  </p>
                  <h2 className="mt-1 font-semibold">{topic.title}</h2>
                </div>
                <span className="shrink-0 rounded-md border px-2 py-1 text-xs text-muted-foreground">
                  {topic.questionCount} soru
                </span>
              </div>
              {topic.summary ? (
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {topic.summary}
                </p>
              ) : null}
            </Link>
          ))}
        </section>

        {topics.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Henuz yayinda test sorusu yok.
          </div>
        ) : null}

        <div>
          <Button asChild variant="outline">
            <Link href="/">Ana sayfa</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
