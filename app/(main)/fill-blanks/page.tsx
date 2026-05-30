import Link from "next/link";
import { PencilLineIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { getFillBlankTopics } from "@/lib/practice/get-fill-blank";

export default async function FillBlankTopicsPage() {
  const { user } = await getCurrentUserRole();

  if (!user) {
    redirect("/login");
  }

  const topics = await getFillBlankTopics();

  return (
    <main className="min-h-svh bg-[#fff7ed]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8">
        <header className="rounded-lg border border-orange-200/80 bg-white/60 p-5 shadow-lg shadow-orange-950/5 backdrop-blur-xl">
          <p className="text-sm text-orange-900/60">Pratik modu</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Bosluk doldurma
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-orange-900/60">
            Konuyu sec, sure bitmeden cevaplari yaz. Bu mod genel puani
            etkilemez; aktif hatirlama icin kullanilir.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/fill-blanks/${topic.slug}`}
              className="rounded-lg border border-orange-200/80 bg-white/65 p-4 shadow-sm shadow-orange-950/5 backdrop-blur-xl transition-colors hover:bg-orange-50/80"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1 text-sm text-orange-900/60">
                    <PencilLineIcon className="size-3.5 text-orange-700" />
                    {topic.periodTitle}
                  </p>
                  <h2 className="mt-1 font-semibold">{topic.title}</h2>
                </div>
                <span className="shrink-0 rounded-md border border-orange-200 bg-white/65 px-2 py-1 text-xs text-orange-900/70">
                  {topic.questionCount} soru
                </span>
              </div>
              {topic.summary ? (
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-orange-900/60">
                  {topic.summary}
                </p>
              ) : null}
            </Link>
          ))}
        </section>

        {topics.length === 0 ? (
          <div className="rounded-lg border border-dashed border-orange-200 p-6 text-sm text-orange-900/60">
            Henuz yayinda bosluk doldurma sorusu yok.
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
