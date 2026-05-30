import { redirect } from "next/navigation";
import { FillBlankRunner } from "@/components/practice/fill-blank-runner";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { getFillBlankDeck } from "@/lib/practice/get-fill-blank";

type FillBlankTopicPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function FillBlankTopicPage({
  params,
}: FillBlankTopicPageProps) {
  const { user } = await getCurrentUserRole();

  if (!user) {
    redirect("/login");
  }

  const { slug } = await params;
  const deck = await getFillBlankDeck(slug);

  return (
    <main className="flex min-h-svh flex-col bg-[#fff7ed]">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 py-3 sm:px-6 sm:py-6">
        <FillBlankRunner
          title={deck.topic.title}
          questions={deck.questions}
          backHref="/fill-blanks"
        />
      </div>
    </main>
  );
}
