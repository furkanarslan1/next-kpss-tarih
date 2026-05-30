"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { adminQuizQuestionsTag, quizQuestionsTag } from "@/lib/cache-tags";
import { createClient } from "@/lib/supabase/server";
import { createQuizQuestionSchema } from "@/lib/validations/learning";
import { uuidSchema } from "@/lib/validations/primitives";

const suggestQuestionOptionsSchema = z.object({
  topicId: uuidSchema,
  correctAnswer: z.string().trim().min(1).max(500),
});

const createQuizSetSchema = z.object({
  topicId: uuidSchema,
  title: z.string().trim().min(2).max(80),
  questionCount: z.coerce.number().int().min(1).max(50).default(20),
  unlockRequiredCorrect: z.coerce.number().int().min(0).max(50).default(14),
  status: z.enum(["draft", "published", "archived"]).default("published"),
});

const questionIdSchema = z.object({
  questionId: uuidSchema,
});

const moveQuestionToSetSchema = questionIdSchema.extend({
  quizSetId: uuidSchema,
});

const reorderQuestionSchema = questionIdSchema.extend({
  direction: z.enum(["up", "down"]),
});

const updateQuestionSchema = questionIdSchema.extend({
  prompt: z.string().trim().min(5).max(2000),
  explanation: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : null))
    .nullable()
    .optional(),
  status: z.enum(["draft", "published", "archived"]),
});

export type CreateQuestionResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export type SuggestQuestionOptionsResult =
  | {
      ok: true;
      message: string;
      options: string[];
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

type AdminMutationResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function suggestQuestionOptionsAction(
  input: unknown,
): Promise<SuggestQuestionOptionsResult> {
  const { user, isAdmin } = await getCurrentUserRole();

  if (!user || !isAdmin) {
    return {
      ok: false,
      message: "Bu islem icin admin yetkisi gerekiyor.",
    };
  }

  const parsed = suggestQuestionOptionsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Soru ve dogru cevabi kontrol et.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const options = await findDistractorOptions({
    correctAnswer: parsed.data.correctAnswer,
    supabase,
    topicId: parsed.data.topicId,
  });

  return {
    ok: true,
    message:
      options.length >= 3
        ? "Secenek onerileri hazir."
        : "Yeterli onerilen secenek bulunamadi; eksikleri manuel tamamla.",
    options,
  };
}

export async function createQuestionAction(
  input: unknown,
): Promise<CreateQuestionResult> {
  const { user, isAdmin } = await getCurrentUserRole();

  if (!user || !isAdmin) {
    return {
      ok: false,
      message: "Bu islem icin admin yetkisi gerekiyor.",
    };
  }

  const parsed = createQuizQuestionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Form alanlarini kontrol et.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const options = shuffleOptions([
    {
      option_text: parsed.data.correctAnswer,
      is_correct: true,
    },
    ...parsed.data.distractors.map((distractor) => ({
      option_text: distractor.optionText,
      is_correct: false,
    })),
  ]).map((option) => ({
    option_text: option.option_text,
    is_correct: option.is_correct,
  }));
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_quiz_question_with_options", {
    p_topic_id: parsed.data.topicId,
    p_quiz_set_id: parsed.data.quizSetId,
    p_prompt: parsed.data.prompt,
    p_explanation: parsed.data.explanation ?? null,
    p_status: parsed.data.status,
    p_options: options,
    p_user_id: user.id,
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidateTag(quizQuestionsTag(parsed.data.topicId), "max");
  revalidateTag(adminQuizQuestionsTag, "max");
  revalidatePath("/admin/questions");

  return {
    ok: true,
    message: "Test sorusu kaydedildi.",
  };
}

export async function createQuizSetAction(
  input: unknown,
): Promise<AdminMutationResult> {
  const { user, isAdmin } = await getCurrentUserRole();

  if (!user || !isAdmin) {
    return {
      ok: false,
      message: "Bu islem icin admin yetkisi gerekiyor.",
    };
  }

  const parsed = createQuizSetSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Test bolumu alanlarini kontrol et.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: latestSet, error: latestError } = await supabase
    .from("quiz_sets")
    .select("set_order")
    .eq("topic_id", parsed.data.topicId)
    .order("set_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    return {
      ok: false,
      message: latestError.message,
    };
  }

  const setOrder = (latestSet?.set_order ?? -1) + 1;
  const { error } = await supabase.from("quiz_sets").insert({
    topic_id: parsed.data.topicId,
    title: parsed.data.title,
    set_order: setOrder,
    question_count: parsed.data.questionCount,
    unlock_required_correct: parsed.data.unlockRequiredCorrect,
    status: parsed.data.status,
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidateTag(quizQuestionsTag(parsed.data.topicId), "max");
  revalidateTag(adminQuizQuestionsTag, "max");
  revalidatePath("/admin/questions");

  return {
    ok: true,
    message: "Test bolumu olusturuldu.",
  };
}

export async function moveQuestionToSetAction(
  input: unknown,
): Promise<AdminMutationResult> {
  const { user, isAdmin } = await getCurrentUserRole();

  if (!user || !isAdmin) {
    return {
      ok: false,
      message: "Bu islem icin admin yetkisi gerekiyor.",
    };
  }

  const parsed = moveQuestionToSetSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Soru tasima bilgisi hatali.",
    };
  }

  const supabase = await createClient();
  const { data: question } = await supabase
    .from("quiz_questions")
    .select("topic_id")
    .eq("id", parsed.data.questionId)
    .single();
  const { data: targetSet, error: targetError } = await supabase
    .from("quiz_sets")
    .select("id, topic_id")
    .eq("id", parsed.data.quizSetId)
    .single();

  if (!question || targetError || !targetSet || question.topic_id !== targetSet.topic_id) {
    return {
      ok: false,
      message: targetError?.message ?? "Soru ve hedef test ayni konuya ait olmali.",
    };
  }

  const { data: latestQuestion } = await supabase
    .from("quiz_questions")
    .select("sort_order")
    .eq("quiz_set_id", targetSet.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase
    .from("quiz_questions")
    .update({
      quiz_set_id: targetSet.id,
      sort_order: (latestQuestion?.sort_order ?? -1) + 1,
      updated_by: user.id,
    })
    .eq("id", parsed.data.questionId);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidateTag(quizQuestionsTag(question.topic_id), "max");
  revalidateTag(adminQuizQuestionsTag, "max");
  revalidatePath("/admin/questions");

  return {
    ok: true,
    message: "Soru tasindi.",
  };
}

export async function reorderQuestionAction(
  input: unknown,
): Promise<AdminMutationResult> {
  const { user, isAdmin } = await getCurrentUserRole();

  if (!user || !isAdmin) {
    return {
      ok: false,
      message: "Bu islem icin admin yetkisi gerekiyor.",
    };
  }

  const parsed = reorderQuestionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Siralama bilgisi hatali.",
    };
  }

  const supabase = await createClient();
  const { data: question, error: questionError } = await supabase
    .from("quiz_questions")
    .select("id, topic_id, quiz_set_id, sort_order")
    .eq("id", parsed.data.questionId)
    .single();

  if (questionError || !question?.quiz_set_id) {
    return {
      ok: false,
      message: questionError?.message ?? "Soru test bolumune bagli degil.",
    };
  }

  const operator = parsed.data.direction === "up" ? "lt" : "gt";
  const ascending = parsed.data.direction === "down";
  const adjacentQuery = supabase
    .from("quiz_questions")
    .select("id, sort_order")
    .eq("quiz_set_id", question.quiz_set_id)
    .order("sort_order", { ascending })
    .limit(1);
  const { data: adjacent, error: adjacentError } =
    operator === "lt"
      ? await adjacentQuery.lt("sort_order", question.sort_order).maybeSingle()
      : await adjacentQuery.gt("sort_order", question.sort_order).maybeSingle();

  if (adjacentError) {
    return {
      ok: false,
      message: adjacentError.message,
    };
  }

  if (!adjacent) {
    return {
      ok: true,
      message: "Soru zaten sinirda.",
    };
  }

  const { error: firstError } = await supabase
    .from("quiz_questions")
    .update({ sort_order: adjacent.sort_order, updated_by: user.id })
    .eq("id", question.id);
  const { error: secondError } = await supabase
    .from("quiz_questions")
    .update({ sort_order: question.sort_order, updated_by: user.id })
    .eq("id", adjacent.id);

  if (firstError || secondError) {
    return {
      ok: false,
      message: firstError?.message ?? secondError?.message ?? "Siralama guncellenemedi.",
    };
  }

  revalidateTag(quizQuestionsTag(question.topic_id), "max");
  revalidateTag(adminQuizQuestionsTag, "max");
  revalidatePath("/admin/questions");

  return {
    ok: true,
    message: "Siralama guncellendi.",
  };
}

export async function updateQuestionAction(
  input: unknown,
): Promise<AdminMutationResult> {
  const { user, isAdmin } = await getCurrentUserRole();

  if (!user || !isAdmin) {
    return {
      ok: false,
      message: "Bu islem icin admin yetkisi gerekiyor.",
    };
  }

  const parsed = updateQuestionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Soru alanlarini kontrol et.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: question } = await supabase
    .from("quiz_questions")
    .select("topic_id")
    .eq("id", parsed.data.questionId)
    .single();
  const { error } = await supabase
    .from("quiz_questions")
    .update({
      prompt: parsed.data.prompt,
      explanation: parsed.data.explanation ?? null,
      status: parsed.data.status,
      updated_by: user.id,
    })
    .eq("id", parsed.data.questionId);

  if (error || !question) {
    return {
      ok: false,
      message: error?.message ?? "Soru bulunamadi.",
    };
  }

  revalidateTag(quizQuestionsTag(question.topic_id), "max");
  revalidateTag(adminQuizQuestionsTag, "max");
  revalidatePath("/admin/questions");

  return {
    ok: true,
    message: "Soru guncellendi.",
  };
}

export async function deleteQuestionAction(
  input: unknown,
): Promise<AdminMutationResult> {
  const { user, isAdmin } = await getCurrentUserRole();

  if (!user || !isAdmin) {
    return {
      ok: false,
      message: "Bu islem icin admin yetkisi gerekiyor.",
    };
  }

  const parsed = questionIdSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Silinecek soru bulunamadi.",
    };
  }

  const supabase = await createClient();
  const { data: question } = await supabase
    .from("quiz_questions")
    .select("topic_id")
    .eq("id", parsed.data.questionId)
    .single();
  const { error } = await supabase
    .from("quiz_questions")
    .delete()
    .eq("id", parsed.data.questionId);

  if (error || !question) {
    return {
      ok: false,
      message: error?.message ?? "Soru bulunamadi.",
    };
  }

  revalidateTag(quizQuestionsTag(question.topic_id), "max");
  revalidateTag(adminQuizQuestionsTag, "max");
  revalidatePath("/admin/questions");

  return {
    ok: true,
    message: "Soru silindi.",
  };
}

async function findDistractorOptions({
  correctAnswer,
  supabase,
  topicId,
}: {
  correctAnswer: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
  topicId: string;
}) {
  const topicQuestionIds = await getQuestionIdsByTopicIds(supabase, [topicId]);
  const sameTopicOptions = await getCorrectOptionsByQuestionIds(
    supabase,
    topicQuestionIds,
  );

  const { data: topic } = await supabase
    .from("topics")
    .select("period_id")
    .eq("id", topicId)
    .maybeSingle();

  let samePeriodOptions: string[] = [];

  if (topic?.period_id) {
    const { data: periodTopics } = await supabase
      .from("topics")
      .select("id")
      .eq("period_id", topic.period_id);
    const periodTopicIds = (periodTopics ?? []).map((periodTopic) => periodTopic.id);
    const periodQuestionIds = await getQuestionIdsByTopicIds(
      supabase,
      periodTopicIds,
    );

    samePeriodOptions = await getCorrectOptionsByQuestionIds(
      supabase,
      periodQuestionIds,
    );
  }

  const { data: globalOptions } = await supabase
    .from("quiz_options")
    .select("option_text")
    .eq("is_correct", true)
    .limit(300);

  return pickDistractors(correctAnswer, [
    ...sameTopicOptions,
    ...samePeriodOptions,
    ...((globalOptions ?? []).map((option) => option.option_text)),
  ]);
}

async function getQuestionIdsByTopicIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  topicIds: string[],
) {
  if (topicIds.length === 0) {
    return [];
  }

  const { data } = await supabase
    .from("quiz_questions")
    .select("id")
    .in("topic_id", topicIds)
    .limit(300);

  return (data ?? []).map((question) => question.id);
}

async function getCorrectOptionsByQuestionIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  questionIds: string[],
) {
  if (questionIds.length === 0) {
    return [];
  }

  const { data } = await supabase
    .from("quiz_options")
    .select("option_text")
    .eq("is_correct", true)
    .in("question_id", questionIds)
    .limit(300);

  return (data ?? []).map((option) => option.option_text);
}

function pickDistractors(correctAnswer: string, candidates: string[]) {
  const correct = normalizeOptionText(correctAnswer);
  const seen = new Set<string>();
  const distractors: string[] = [];

  for (const candidate of candidates) {
    const normalized = normalizeOptionText(candidate);

    if (
      !normalized ||
      seen.has(normalized) ||
      isTooSimilar(normalized, correct)
    ) {
      continue;
    }

    seen.add(normalized);
    distractors.push(candidate.trim());
  }

  return shuffleOptions(distractors).slice(0, 3);
}

function shuffleOptions<T>(options: T[]) {
  return [...options].sort(() => Math.random() - 0.5);
}

function isTooSimilar(candidate: string, correctAnswer: string) {
  if (candidate === correctAnswer) {
    return true;
  }

  const [shorter, longer] =
    candidate.length < correctAnswer.length
      ? [candidate, correctAnswer]
      : [correctAnswer, candidate];

  return shorter.length >= 6 && longer.includes(shorter);
}

function normalizeOptionText(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
}
