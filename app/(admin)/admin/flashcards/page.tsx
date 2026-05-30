import { FlashcardForm } from "@/components/admin/flashcard-form";
import { createClient } from "@/lib/supabase/server";

type TopicRow = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  historical_periods: {
    title: string;
  } | null;
};

type FlashcardRow = {
  id: string;
  topic_id: string;
  front: string;
  back: string;
  hint: string | null;
  sort_order: number;
  status: "draft" | "published" | "archived";
  created_at: string;
  topics: {
    title: string;
    historical_periods: {
      title: string;
    } | null;
  } | null;
};

function statusLabel(status: FlashcardRow["status"]) {
  const labels = {
    draft: "Taslak",
    published: "Yayinda",
    archived: "Arsiv",
  } satisfies Record<FlashcardRow["status"], string>;

  return labels[status];
}

export default async function AdminFlashcardsPage() {
  const supabase = await createClient();

  const [topicsResult, flashcardsResult] = await Promise.all([
    supabase
      .from("topics")
      .select("id, title, slug, status, historical_periods(title)")
      .order("display_order", { ascending: true })
      .returns<TopicRow[]>(),
    supabase
      .from("flashcards")
      .select(
        "id, topic_id, front, back, hint, sort_order, status, created_at, topics(title, historical_periods(title))",
      )
      .order("created_at", { ascending: false })
      .limit(12)
      .returns<FlashcardRow[]>(),
  ]);

  const topics = topicsResult.data ?? [];
  const flashcards = flashcardsResult.data ?? [];
  const publishedCount = flashcards.filter(
    (flashcard) => flashcard.status === "published",
  ).length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Ogrenme icerigi</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Bilgi kartlari
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Konulara bagli tekrar kartlari ekle. Kullanici tarafinda kartlar
          konuya gore cachelenecek; admin yeni kart eklediginde ilgili konu
          cache etiketi bozulacak.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Konu</p>
          <p className="mt-2 text-2xl font-semibold">{topics.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Son kayitlar</p>
          <p className="mt-2 text-2xl font-semibold">{flashcards.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Yayinda</p>
          <p className="mt-2 text-2xl font-semibold">{publishedCount}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border p-4 md:p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Yeni bilgi karti</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Kartlari net soru-cevap mantigiyla gir; kullanici ekrani sonraki
              adimda saga/sola kaydirma deneyimiyle okuyacak.
            </p>
          </div>
          <FlashcardForm
            topics={topics.map((topic) => ({
              id: topic.id,
              title: topic.title,
              periodTitle: topic.historical_periods?.title ?? "Donem yok",
            }))}
          />
        </div>

        <aside className="rounded-lg border p-4 md:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Son kartlar</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              En son eklenen 12 kart.
            </p>
          </div>

          {flashcards.length ? (
            <div className="space-y-3">
              {flashcards.map((flashcard) => (
                <article
                  key={flashcard.id}
                  className="rounded-md border bg-muted/20 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {flashcard.topics?.title ?? "Konu yok"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {flashcard.topics?.historical_periods?.title ??
                          "Donem yok"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">
                      {statusLabel(flashcard.status)}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm">{flashcard.front}</p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {flashcard.back}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Sira: {flashcard.sort_order}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              Henuz bilgi karti yok.
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
