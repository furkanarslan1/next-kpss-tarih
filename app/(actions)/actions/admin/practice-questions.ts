"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getCurrentUserRole } from "@/lib/auth/roles";
import {
  adminPracticeQuestionsTag,
  practiceQuestionsTag,
} from "@/lib/cache-tags";
import { createClient } from "@/lib/supabase/server";
import {
  fillBlankQuestionSchema,
  normalizeAcceptedAnswers,
} from "@/lib/validations/learning";
import { uuidSchema } from "@/lib/validations/primitives";

type AdminPracticeMutationResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

const practiceQuestionIdSchema = z.object({
  questionId: uuidSchema,
});

const reorderPracticeQuestionSchema = practiceQuestionIdSchema.extend({
  direction: z.enum(["up", "down"]),
});

const updateFillBlankQuestionSchema = practiceQuestionIdSchema.extend(
  fillBlankQuestionSchema.omit({ topicId: true }).shape,
);

export async function createFillBlankQuestionAction(
  input: unknown,
): Promise<AdminPracticeMutationResult> {
  const { user, isAdmin } = await getCurrentUserRole();

  if (!user || !isAdmin) {
    return {
      ok: false,
      message: "Bu islem icin admin yetkisi gerekiyor.",
    };
  }

  const parsed = fillBlankQuestionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Bosluk doldurma alanlarini kontrol et.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: latestQuestion, error: latestError } = await supabase
    .from("practice_questions")
    .select("sort_order")
    .eq("topic_id", parsed.data.topicId)
    .eq("question_type", "fill_blank")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    return {
      ok: false,
      message: latestError.message,
    };
  }

  const { error } = await supabase.from("practice_questions").insert({
    topic_id: parsed.data.topicId,
    question_type: "fill_blank",
    prompt: parsed.data.prompt,
    correct_answer: parsed.data.correctAnswer,
    accepted_answers: normalizeAcceptedAnswers(
      parsed.data.correctAnswer,
      parsed.data.acceptedAnswersText,
    ),
    hint: parsed.data.hint ?? null,
    explanation: parsed.data.explanation ?? null,
    time_limit_seconds: parsed.data.timeLimitSeconds,
    sort_order: (latestQuestion?.sort_order ?? -1) + 1,
    status: parsed.data.status,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidatePracticeQuestions(parsed.data.topicId);

  return {
    ok: true,
    message: "Bosluk doldurma sorusu kaydedildi.",
  };
}

export async function updateFillBlankQuestionAction(
  input: unknown,
): Promise<AdminPracticeMutationResult> {
  const { user, isAdmin } = await getCurrentUserRole();

  if (!user || !isAdmin) {
    return {
      ok: false,
      message: "Bu islem icin admin yetkisi gerekiyor.",
    };
  }

  const parsed = updateFillBlankQuestionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Bosluk doldurma sorusunu kontrol et.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: question } = await supabase
    .from("practice_questions")
    .select("topic_id")
    .eq("id", parsed.data.questionId)
    .eq("question_type", "fill_blank")
    .single();
  const { error } = await supabase
    .from("practice_questions")
    .update({
      prompt: parsed.data.prompt,
      correct_answer: parsed.data.correctAnswer,
      accepted_answers: normalizeAcceptedAnswers(
        parsed.data.correctAnswer,
        parsed.data.acceptedAnswersText,
      ),
      hint: parsed.data.hint ?? null,
      explanation: parsed.data.explanation ?? null,
      time_limit_seconds: parsed.data.timeLimitSeconds,
      status: parsed.data.status,
      updated_by: user.id,
    })
    .eq("id", parsed.data.questionId)
    .eq("question_type", "fill_blank");

  if (error || !question) {
    return {
      ok: false,
      message: error?.message ?? "Soru bulunamadi.",
    };
  }

  revalidatePracticeQuestions(question.topic_id);

  return {
    ok: true,
    message: "Bosluk doldurma sorusu guncellendi.",
  };
}

export async function reorderPracticeQuestionAction(
  input: unknown,
): Promise<AdminPracticeMutationResult> {
  const { user, isAdmin } = await getCurrentUserRole();

  if (!user || !isAdmin) {
    return {
      ok: false,
      message: "Bu islem icin admin yetkisi gerekiyor.",
    };
  }

  const parsed = reorderPracticeQuestionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Siralama bilgisi hatali.",
    };
  }

  const supabase = await createClient();
  const { data: question, error: questionError } = await supabase
    .from("practice_questions")
    .select("id, topic_id, question_type, sort_order")
    .eq("id", parsed.data.questionId)
    .single();

  if (questionError || !question) {
    return {
      ok: false,
      message: questionError?.message ?? "Soru bulunamadi.",
    };
  }

  const operator = parsed.data.direction === "up" ? "lt" : "gt";
  const ascending = parsed.data.direction === "down";
  const adjacentQuery = supabase
    .from("practice_questions")
    .select("id, sort_order")
    .eq("topic_id", question.topic_id)
    .eq("question_type", question.question_type)
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
    .from("practice_questions")
    .update({ sort_order: adjacent.sort_order, updated_by: user.id })
    .eq("id", question.id);
  const { error: secondError } = await supabase
    .from("practice_questions")
    .update({ sort_order: question.sort_order, updated_by: user.id })
    .eq("id", adjacent.id);

  if (firstError || secondError) {
    return {
      ok: false,
      message:
        firstError?.message ?? secondError?.message ?? "Siralama guncellenemedi.",
    };
  }

  revalidatePracticeQuestions(question.topic_id);

  return {
    ok: true,
    message: "Siralama guncellendi.",
  };
}

export async function deletePracticeQuestionAction(
  input: unknown,
): Promise<AdminPracticeMutationResult> {
  const { user, isAdmin } = await getCurrentUserRole();

  if (!user || !isAdmin) {
    return {
      ok: false,
      message: "Bu islem icin admin yetkisi gerekiyor.",
    };
  }

  const parsed = practiceQuestionIdSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Silinecek soru bulunamadi.",
    };
  }

  const supabase = await createClient();
  const { data: question } = await supabase
    .from("practice_questions")
    .select("topic_id")
    .eq("id", parsed.data.questionId)
    .single();
  const { error } = await supabase
    .from("practice_questions")
    .delete()
    .eq("id", parsed.data.questionId);

  if (error || !question) {
    return {
      ok: false,
      message: error?.message ?? "Soru bulunamadi.",
    };
  }

  revalidatePracticeQuestions(question.topic_id);

  return {
    ok: true,
    message: "Soru silindi.",
  };
}

function revalidatePracticeQuestions(topicId: string) {
  revalidateTag(practiceQuestionsTag(topicId), "max");
  revalidateTag(adminPracticeQuestionsTag, "max");
  revalidatePath("/admin/questions");
}
