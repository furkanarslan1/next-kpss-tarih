import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { getFlashcardTopics } from "@/lib/flashcards/get-flashcards";

export default async function FlashcardTopicsPage() {
  const { user } = await getCurrentUserRole();

  if (!user) {
    redirect("/login");
  }

  const topics = await getFlashcardTopics();

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8">
        <header className="flex flex-col gap-3 border-b pb-5">
          <p className="text-sm text-muted-foreground">Bilgi kartlari</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Konu sec
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Kartlar konuya gore hazirlanir ve sinav oncesi hizli tekrar icin
            sirali olarak acilir.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/flashcards/${topic.slug}`}
              className="rounded-lg border bg-background p-4 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {topic.periodTitle}
                  </p>
                  <h2 className="mt-1 font-semibold">{topic.title}</h2>
                </div>
                <span className="shrink-0 rounded-md border px-2 py-1 text-xs text-muted-foreground">
                  {topic.cardCount} kart
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
            Henuz yayinda konu yok.
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
