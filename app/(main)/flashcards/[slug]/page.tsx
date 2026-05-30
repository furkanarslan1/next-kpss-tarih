import Link from "next/link";
import { redirect } from "next/navigation";
import { SwipeDeck } from "@/components/flashcards/swipe-deck";
import { Button } from "@/components/ui/button";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { getFlashcardDeck } from "@/lib/flashcards/get-flashcards";

type FlashcardDeckPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function FlashcardDeckPage({
  params,
}: FlashcardDeckPageProps) {
  const { user } = await getCurrentUserRole();

  if (!user) {
    redirect("/login");
  }

  const { slug } = await params;
  const deck = await getFlashcardDeck(slug);

  return (
    <main className="flex min-h-svh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
        <header className="flex items-start justify-between gap-3 border-b pb-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {deck.topic.periodTitle}
            </p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {deck.topic.title}
            </h1>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/flashcards">Konular</Link>
          </Button>
        </header>

        <SwipeDeck cards={deck.cards} />
      </div>
    </main>
  );
}
