import { QuestionAdminList } from "@/components/admin/question-admin-list";
import { QuestionForm } from "@/components/admin/question-form";
import { QuizSetForm } from "@/components/admin/quiz-set-form";
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

type QuestionRow = {
  id: string;
  topic_id: string;
  prompt: string;
  explanation: string | null;
  sort_order: number;
  status: "draft" | "published" | "archived";
  created_at: string;
  topics: {
    title: string;
    historical_periods: {
      title: string;
    } | null;
  } | null;
  quiz_options: {
    option_text: string;
    is_correct: boolean;
    sort_order: number;
  }[];
  quiz_sets: {
    title: string;
    set_order: number;
  } | null;
};

type QuizSetRow = {
  id: string;
  topic_id: string;
  title: string;
  set_order: number;
  question_count: number;
  unlock_required_correct: number;
  status: "draft" | "published" | "archived";
};

export default async function AdminQuestionsPage() {
  const supabase = await createClient();

  const [topicsResult, quizSetsResult, questionsResult] = await Promise.all([
    supabase
      .from("topics")
      .select("id, title, slug, status, historical_periods(title)")
      .order("display_order", { ascending: true })
      .returns<TopicRow[]>(),
    supabase
      .from("quiz_sets")
      .select(
        "id, topic_id, title, set_order, question_count, unlock_required_correct, status",
      )
      .order("set_order", { ascending: true })
      .returns<QuizSetRow[]>(),
    supabase
      .from("quiz_questions")
      .select(
        "id, topic_id, prompt, explanation, sort_order, status, created_at, topics(title, historical_periods(title)), quiz_sets(title, set_order), quiz_options(option_text, is_correct, sort_order)",
      )
      .order("created_at", { ascending: false })
      .limit(12)
      .returns<QuestionRow[]>(),
  ]);

  const topics = topicsResult.data ?? [];
  const quizSets = quizSetsResult.data ?? [];
  const questions = questionsResult.data ?? [];
  const publishedCount = questions.filter(
    (question) => question.status === "published",
  ).length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Ogrenme icerigi</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Test sorulari
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Soru ve dogru cevabi gir; yanlis secenekleri mevcut sorularin dogru
          cevaplarindan oner veya manuel olarak duzenle.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Konu</p>
          <p className="mt-2 text-2xl font-semibold">{topics.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Son sorular</p>
          <p className="mt-2 text-2xl font-semibold">{questions.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Yayinda</p>
          <p className="mt-2 text-2xl font-semibold">{publishedCount}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border p-4 md:p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Yeni test sorusu</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Zorluk seviyesi admin tarafinda sorulmaz; sistem varsayilan
              degerle kaydeder.
            </p>
          </div>
          <QuestionForm
            topics={topics.map((topic) => ({
              id: topic.id,
              title: topic.title,
              periodTitle: topic.historical_periods?.title ?? "Donem yok",
            }))}
            quizSets={quizSets.map((quizSet) => ({
              id: quizSet.id,
              topicId: quizSet.topic_id,
              title: quizSet.title,
              setOrder: quizSet.set_order,
              questionCount: quizSet.question_count,
              unlockRequiredCorrect: quizSet.unlock_required_correct,
            }))}
          />
        </div>

        <aside className="rounded-lg border p-4 md:p-5">
          <div className="mb-6 rounded-md border bg-muted/20 p-3">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Yeni test bolumu</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Konu icinde 2. Test, 3. Test gibi kilitli bolumler olustur.
              </p>
            </div>
            <QuizSetForm
              topics={topics.map((topic) => ({
                id: topic.id,
                title: topic.title,
                periodTitle: topic.historical_periods?.title ?? "Donem yok",
              }))}
            />
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold">Son sorular</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              En son eklenen 12 test sorusu.
            </p>
          </div>

          <QuestionAdminList
            questions={questions.map((question) => ({
              id: question.id,
              topicId: question.topic_id,
              prompt: question.prompt,
              explanation: question.explanation,
              sortOrder: question.sort_order,
              status: question.status,
              topicTitle: question.topics?.title ?? "Konu yok",
              periodTitle:
                question.topics?.historical_periods?.title ?? "Donem yok",
              quizSetTitle: question.quiz_sets?.title ?? "Test yok",
              correctAnswer:
                question.quiz_options.find((option) => option.is_correct)
                  ?.option_text ?? "Yok",
            }))}
            quizSets={quizSets.map((quizSet) => ({
              id: quizSet.id,
              topicId: quizSet.topic_id,
              title: quizSet.title,
              setOrder: quizSet.set_order,
            }))}
          />
        </aside>
      </section>
    </div>
  );
}
