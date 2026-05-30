import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { adminFlashcardsTag, flashcardsTag } from "@/lib/cache-tags";
import { createPublicServerClient } from "@/lib/supabase/public-server";

export type FlashcardTopic = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  periodTitle: string;
  cardCount: number;
};

export type FlashcardDeckCard = {
  id: string;
  front: string;
  back: string;
  hint: string | null;
  sortOrder: number;
};

export type FlashcardDeck = {
  topic: Omit<FlashcardTopic, "cardCount">;
  cards: FlashcardDeckCard[];
};

type TopicRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
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
};

async function queryFlashcardTopics(): Promise<FlashcardTopic[]> {
  const supabase = createPublicServerClient();

  const [topicsResult, flashcardsResult] = await Promise.all([
    supabase
      .from("topics")
      .select("id, slug, title, summary, historical_periods(title)")
      .eq("status", "published")
      .order("display_order", { ascending: true })
      .returns<TopicRow[]>(),
    supabase
      .from("flashcards")
      .select("topic_id")
      .eq("status", "published"),
  ]);

  const counts = new Map<string, number>();

  for (const flashcard of flashcardsResult.data ?? []) {
    counts.set(flashcard.topic_id, (counts.get(flashcard.topic_id) ?? 0) + 1);
  }

  return (topicsResult.data ?? []).map((topic) => ({
    id: topic.id,
    slug: topic.slug,
    title: topic.title,
    summary: topic.summary,
    periodTitle: topic.historical_periods?.title ?? "KPSS Tarih",
    cardCount: counts.get(topic.id) ?? 0,
  }));
}

async function queryFlashcardDeck(slug: string): Promise<FlashcardDeck> {
  const supabase = createPublicServerClient();

  const { data: topic } = await supabase
    .from("topics")
    .select("id, slug, title, summary, historical_periods(title)")
    .eq("slug", slug)
    .eq("status", "published")
    .single()
    .returns<TopicRow>();

  if (!topic) {
    notFound();
  }

  const { data: cards } = await supabase
    .from("flashcards")
    .select("id, topic_id, front, back, hint, sort_order")
    .eq("topic_id", topic.id)
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .returns<FlashcardRow[]>();

  return {
    topic: {
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      summary: topic.summary,
      periodTitle: topic.historical_periods?.title ?? "KPSS Tarih",
    },
    cards:
      cards?.map((card) => ({
        id: card.id,
        front: card.front,
        back: card.back,
        hint: card.hint,
        sortOrder: card.sort_order,
      })) ?? [],
  };
}

export const getFlashcardTopics = unstable_cache(
  queryFlashcardTopics,
  ["flashcard-topics-v2"],
  {
    tags: [adminFlashcardsTag],
    revalidate: 60 * 60,
  },
);

export async function getFlashcardDeck(slug: string) {
  const topicLookup = await getFlashcardTopics();
  const topic = topicLookup.find((item) => item.slug === slug);

  return unstable_cache(queryFlashcardDeck, [`flashcard-deck-v2:${slug}`], {
    tags: topic ? [flashcardsTag(topic.id), adminFlashcardsTag] : [adminFlashcardsTag],
    revalidate: 60 * 60,
  })(slug);
}
