import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import {
  adminPracticeQuestionsTag,
  practiceQuestionsTag,
} from "@/lib/cache-tags";
import { createPublicServerClient } from "@/lib/supabase/public-server";

export type FillBlankTopic = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  periodTitle: string;
  questionCount: number;
};

export type FillBlankQuestion = {
  id: string;
  topicId: string;
  topicSlug: string;
  topicTitle: string;
  periodTitle: string;
  prompt: string;
  hint: string | null;
  answerMask: string;
  timeLimitSeconds: number;
  sortOrder: number;
};

export type FillBlankDeck = {
  topic: {
    id: string;
    slug: string;
    title: string;
    periodTitle: string;
  };
  questions: FillBlankQuestion[];
};

export type FillBlankLetterGuess = {
  isMatch: boolean;
  matches: {
    position: number;
    character: string;
  }[];
};

export type FillBlankReveal = {
  correctAnswer: string;
  explanation: string | null;
};

async function queryFillBlankTopics(): Promise<FillBlankTopic[]> {
  const supabase = createPublicServerClient();
  const { data, error } = await supabase.rpc("list_fill_blank_topics");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((topic) => ({
    id: topic.topic_id,
    slug: topic.slug,
    title: topic.title,
    summary: topic.summary,
    periodTitle: topic.period_title,
    questionCount: Number(topic.question_count),
  }));
}

async function queryFillBlankDeck(slug: string): Promise<FillBlankDeck> {
  const supabase = createPublicServerClient();
  const { data, error } = await supabase.rpc("get_fill_blank_deck", {
    p_slug: slug,
  });

  if (error) {
    throw new Error(error.message);
  }

  const questions = (data ?? []).map((question) => ({
    id: question.id,
    topicId: question.topic_id,
    topicSlug: question.topic_slug,
    topicTitle: question.topic_title,
    periodTitle: question.period_title,
    prompt: question.prompt,
    hint: question.hint,
    answerMask: question.answer_mask ?? "",
    timeLimitSeconds: question.time_limit_seconds,
    sortOrder: question.sort_order,
  }));

  if (questions.length === 0) {
    notFound();
  }

  const firstQuestion = questions[0]!;

  return {
    topic: {
      id: firstQuestion.topicId,
      slug: firstQuestion.topicSlug,
      title: firstQuestion.topicTitle,
      periodTitle: firstQuestion.periodTitle,
    },
    questions,
  };
}

async function queryFillBlankLetterGuess(
  questionId: string,
  letter: string,
): Promise<FillBlankLetterGuess | null> {
  const supabase = createPublicServerClient();
  const { data, error } = await supabase
    .rpc("guess_fill_blank_letter", {
      p_question_id: questionId,
      p_letter: letter,
    })
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    isMatch: data.is_match,
    matches: parseLetterMatches(data.matches),
  };
}

async function queryFillBlankReveal(
  questionId: string,
): Promise<FillBlankReveal | null> {
  const supabase = createPublicServerClient();
  const { data, error } = await supabase
    .rpc("reveal_fill_blank_answer", {
      p_question_id: questionId,
    })
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    correctAnswer: data.correct_answer,
    explanation: data.explanation,
  };
}

export const getFillBlankTopics = unstable_cache(
  queryFillBlankTopics,
  ["fill-blank-topics-v1"],
  {
    tags: [adminPracticeQuestionsTag],
    revalidate: 60 * 60,
  },
);

export async function getFillBlankDeck(slug: string) {
  const topics = await getFillBlankTopics();
  const topic = topics.find((item) => item.slug === slug);

  return unstable_cache(queryFillBlankDeck, [`fill-blank-deck-v2:${slug}`], {
    tags: topic
      ? [practiceQuestionsTag(topic.id), adminPracticeQuestionsTag]
      : [adminPracticeQuestionsTag],
    revalidate: 60 * 60,
  })(slug);
}

export async function getCachedFillBlankLetterGuess({
  letter,
  questionId,
  topicSlug,
}: {
  letter: string;
  questionId: string;
  topicSlug: string;
}) {
  const topics = await getFillBlankTopics();
  const topic = topics.find((item) => item.slug === topicSlug);
  const normalizedLetter = letter.toLocaleLowerCase("tr-TR");

  return unstable_cache(
    queryFillBlankLetterGuess,
    [`fill-blank-letter-v1:${questionId}:${normalizedLetter}`],
    {
      tags: topic
        ? [practiceQuestionsTag(topic.id), adminPracticeQuestionsTag]
        : [adminPracticeQuestionsTag],
      revalidate: 60 * 60,
    },
  )(questionId, normalizedLetter);
}

export async function getCachedFillBlankReveal({
  questionId,
  topicSlug,
}: {
  questionId: string;
  topicSlug: string;
}) {
  const topics = await getFillBlankTopics();
  const topic = topics.find((item) => item.slug === topicSlug);

  return unstable_cache(
    queryFillBlankReveal,
    [`fill-blank-reveal-v1:${questionId}`],
    {
      tags: topic
        ? [practiceQuestionsTag(topic.id), adminPracticeQuestionsTag]
        : [adminPracticeQuestionsTag],
      revalidate: 60 * 60,
    },
  )(questionId);
}

function parseLetterMatches(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("position" in item) ||
        !("character" in item)
      ) {
        return null;
      }

      const position = Number(item.position);
      const character = String(item.character);

      if (!Number.isInteger(position) || character.length === 0) {
        return null;
      }

      return { position, character };
    })
    .filter((item) => item !== null);
}
