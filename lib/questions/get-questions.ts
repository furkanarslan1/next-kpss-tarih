import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { adminQuizQuestionsTag, quizQuestionsTag } from "@/lib/cache-tags";
import { createPublicServerClient } from "@/lib/supabase/public-server";

export type QuizTopic = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  periodTitle: string;
  questionCount: number;
};

export type QuizPlayOption = {
  id: string;
  text: string;
  sortOrder: number;
};

export type QuizPlayQuestion = {
  id: string;
  topicId: string;
  quizSetId: string | null;
  topicTitle: string;
  periodTitle: string;
  prompt: string;
  explanation: string | null;
  options: QuizPlayOption[];
};

export type QuizAnswerKeyQuestion = QuizPlayQuestion & {
  correctOptionId: string | null;
};

export type QuizDeck = {
  topic: Omit<QuizTopic, "questionCount">;
  quizSet?: QuizSet;
  questions: QuizAnswerKeyQuestion[];
};

export type QuizSet = {
  id: string;
  topicId: string;
  title: string;
  setOrder: number;
  questionCount: number;
  unlockRequiredCorrect: number;
};

export type QuizSetList = {
  topic: Omit<QuizTopic, "questionCount">;
  sets: QuizSet[];
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

type QuestionRow = {
  id: string;
  topic_id: string;
  quiz_set_id: string | null;
  prompt: string;
  explanation: string | null;
  sort_order: number;
  topics: {
    title: string;
    historical_periods: {
      title: string;
    } | null;
  } | null;
  quiz_options: {
    id: string;
    option_text: string;
    is_correct: boolean;
    sort_order: number;
  }[];
};

type QuizSetRow = {
  id: string;
  topic_id: string;
  title: string;
  set_order: number;
  question_count: number;
  unlock_required_correct: number;
};

async function queryQuizTopics(): Promise<QuizTopic[]> {
  const supabase = createPublicServerClient();

  const [topicsResult, questionsResult] = await Promise.all([
    supabase
      .from("topics")
      .select("id, slug, title, summary, historical_periods(title)")
      .eq("status", "published")
      .order("display_order", { ascending: true })
      .returns<TopicRow[]>(),
    supabase
      .from("quiz_questions")
      .select("topic_id")
      .eq("status", "published"),
  ]);

  const counts = new Map<string, number>();

  for (const question of questionsResult.data ?? []) {
    counts.set(question.topic_id, (counts.get(question.topic_id) ?? 0) + 1);
  }

  return (topicsResult.data ?? [])
    .map((topic) => ({
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      summary: topic.summary,
      periodTitle: topic.historical_periods?.title ?? "KPSS Tarih",
      questionCount: counts.get(topic.id) ?? 0,
    }))
    .filter((topic) => topic.questionCount > 0);
}

async function queryQuizDeck(slug: string): Promise<QuizDeck> {
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

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select(
      "id, topic_id, quiz_set_id, prompt, explanation, sort_order, topics(title, historical_periods(title)), quiz_options(id, option_text, is_correct, sort_order)",
    )
    .eq("topic_id", topic.id)
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .returns<QuestionRow[]>();

  return {
    topic: {
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      summary: topic.summary,
      periodTitle: topic.historical_periods?.title ?? "KPSS Tarih",
    },
    questions: normalizeQuestions(questions ?? []),
  };
}

async function queryQuizSetsForTopic(slug: string): Promise<QuizSetList> {
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

  const [setsResult, questionsResult] = await Promise.all([
    supabase
      .from("quiz_sets")
      .select("id, topic_id, title, set_order, question_count, unlock_required_correct")
      .eq("topic_id", topic.id)
      .eq("status", "published")
      .order("set_order", { ascending: true })
      .returns<QuizSetRow[]>(),
    supabase
      .from("quiz_questions")
      .select("quiz_set_id")
      .eq("topic_id", topic.id)
      .eq("status", "published"),
  ]);

  const counts = new Map<string, number>();

  for (const question of questionsResult.data ?? []) {
    if (!question.quiz_set_id) continue;
    counts.set(question.quiz_set_id, (counts.get(question.quiz_set_id) ?? 0) + 1);
  }

  return {
    topic: {
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      summary: topic.summary,
      periodTitle: topic.historical_periods?.title ?? "KPSS Tarih",
    },
    sets: (setsResult.data ?? []).map((quizSet) => ({
      id: quizSet.id,
      topicId: quizSet.topic_id,
      title: quizSet.title,
      setOrder: quizSet.set_order,
      questionCount: counts.get(quizSet.id) ?? 0,
      unlockRequiredCorrect: quizSet.unlock_required_correct,
    })),
  };
}

async function queryQuizSetDeck(
  slug: string,
  setOrder: number,
): Promise<QuizDeck> {
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

  const { data: quizSet } = await supabase
    .from("quiz_sets")
    .select("id, topic_id, title, set_order, question_count, unlock_required_correct")
    .eq("topic_id", topic.id)
    .eq("set_order", setOrder)
    .eq("status", "published")
    .single()
    .returns<QuizSetRow>();

  if (!quizSet) {
    notFound();
  }

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select(
      "id, topic_id, quiz_set_id, prompt, explanation, sort_order, topics(title, historical_periods(title)), quiz_options(id, option_text, is_correct, sort_order)",
    )
    .eq("quiz_set_id", quizSet.id)
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .returns<QuestionRow[]>();

  return {
    topic: {
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      summary: topic.summary,
      periodTitle: topic.historical_periods?.title ?? "KPSS Tarih",
    },
    quizSet: {
      id: quizSet.id,
      topicId: quizSet.topic_id,
      title: quizSet.title,
      setOrder: quizSet.set_order,
      questionCount: questions?.length ?? 0,
      unlockRequiredCorrect: quizSet.unlock_required_correct,
    },
    questions: normalizeQuestions(questions ?? []),
  };
}

async function queryAllQuizQuestions(): Promise<QuizAnswerKeyQuestion[]> {
  const supabase = createPublicServerClient();
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select(
      "id, topic_id, quiz_set_id, prompt, explanation, sort_order, topics(title, historical_periods(title)), quiz_options(id, option_text, is_correct, sort_order)",
    )
    .eq("status", "published")
    .limit(500)
    .returns<QuestionRow[]>();

  return normalizeQuestions(questions ?? []);
}

export const getQuizTopics = unstable_cache(
  queryQuizTopics,
  ["quiz-topics-v1"],
  {
    tags: [adminQuizQuestionsTag],
    revalidate: 60 * 60,
  },
);

export async function getQuizDeck(slug: string) {
  const topicLookup = await getQuizTopics();
  const topic = topicLookup.find((item) => item.slug === slug);

  return unstable_cache(queryQuizDeck, [`quiz-deck-v1:${slug}`], {
    tags: topic
      ? [quizQuestionsTag(topic.id), adminQuizQuestionsTag]
      : [adminQuizQuestionsTag],
    revalidate: 60 * 60,
  })(slug);
}

export async function getQuizSetsForTopic(slug: string) {
  const topicLookup = await getQuizTopics();
  const topic = topicLookup.find((item) => item.slug === slug);

  return unstable_cache(
    queryQuizSetsForTopic,
    [`quiz-sets-v1:${slug}`],
    {
      tags: topic
        ? [quizQuestionsTag(topic.id), adminQuizQuestionsTag]
        : [adminQuizQuestionsTag],
      revalidate: 60 * 60,
    },
  )(slug);
}

export async function getQuizSetDeck(slug: string, setOrder: number) {
  const topicLookup = await getQuizTopics();
  const topic = topicLookup.find((item) => item.slug === slug);

  return unstable_cache(
    queryQuizSetDeck,
    [`quiz-set-deck-v1:${slug}:${setOrder}`],
    {
      tags: topic
        ? [quizQuestionsTag(topic.id), adminQuizQuestionsTag]
        : [adminQuizQuestionsTag],
      revalidate: 60 * 60,
    },
  )(slug, setOrder);
}

export const getAllQuizQuestions = unstable_cache(
  queryAllQuizQuestions,
  ["quiz-all-questions-v1"],
  {
    tags: [adminQuizQuestionsTag],
    revalidate: 60 * 60,
  },
);

export function toPublicQuizQuestion(
  question: QuizAnswerKeyQuestion,
): QuizPlayQuestion {
  return {
    id: question.id,
    topicId: question.topicId,
    quizSetId: question.quizSetId,
    topicTitle: question.topicTitle,
    periodTitle: question.periodTitle,
    prompt: question.prompt,
    explanation: question.explanation,
    options: question.options,
  };
}

function normalizeQuestions(rows: QuestionRow[]): QuizAnswerKeyQuestion[] {
  return rows
    .map((question) => {
      const options = [...question.quiz_options].sort(
        (a, b) => a.sort_order - b.sort_order,
      );

      return {
        id: question.id,
        topicId: question.topic_id,
        quizSetId: question.quiz_set_id,
        topicTitle: question.topics?.title ?? "Konu yok",
        periodTitle: question.topics?.historical_periods?.title ?? "KPSS Tarih",
        prompt: question.prompt,
        explanation: question.explanation,
        correctOptionId:
          options.find((option) => option.is_correct)?.id ?? null,
        options: options.map((option) => ({
          id: option.id,
          text: option.option_text,
          sortOrder: option.sort_order,
        })),
      };
    })
    .filter(
      (question) =>
        question.correctOptionId !== null && question.options.length >= 2,
    );
}
