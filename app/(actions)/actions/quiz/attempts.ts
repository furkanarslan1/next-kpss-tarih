"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserRole } from "@/lib/auth/roles";
import {
  getAllQuizQuestions,
  getQuizDeck,
  getQuizTopics,
} from "@/lib/questions/get-questions";
import { createClient } from "@/lib/supabase/server";
import { quizAttemptSchema } from "@/lib/validations/learning";
import { uuidSchema } from "@/lib/validations/primitives";

const CORRECT_POINTS = 10;
const WRONG_PENALTY = 3;

const checkQuizAnswerSchema = z.object({
  mode: z.enum(["topic", "random"]),
  topicId: uuidSchema.nullable().optional(),
  quizSetId: uuidSchema.nullable().optional(),
  questionId: uuidSchema,
  selectedOptionId: uuidSchema,
});

export type CheckQuizAnswerResult =
  | {
      ok: true;
      isCorrect: boolean;
      correctOptionId: string;
    }
  | {
      ok: false;
      message: string;
    };

export type SubmitQuizAttemptResult =
  | {
      ok: true;
      result: {
        correctCount: number;
        wrongCount: number;
        blankCount: number;
        totalQuestions: number;
        score: number;
        pointDelta: number;
        elapsedSeconds: number;
        answers: Record<string, { isCorrect: boolean; correctOptionId: string }>;
      };
    }
  | {
      ok: false;
      message: string;
    };

export async function checkQuizAnswerAction(
  input: unknown,
): Promise<CheckQuizAnswerResult> {
  const { user } = await getCurrentUserRole();

  if (!user) {
    return {
      ok: false,
      message: "Cevabi kontrol etmek icin giris yapmalisin.",
    };
  }

  const parsed = checkQuizAnswerSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Cevap kontrol edilemedi.",
    };
  }

  const answerKey = await getAnswerKey(parsed.data);
  const question = answerKey.find(
    (item) => item.id === parsed.data.questionId,
  );

  if (!question?.correctOptionId) {
    return {
      ok: false,
      message: "Soru bulunamadi.",
    };
  }

  const isValidOption = question.options.some(
    (option) => option.id === parsed.data.selectedOptionId,
  );

  if (!isValidOption) {
    return {
      ok: false,
      message: "Secenek bu soruya ait degil.",
    };
  }

  return {
    ok: true,
    isCorrect: parsed.data.selectedOptionId === question.correctOptionId,
    correctOptionId: question.correctOptionId,
  };
}

export async function submitQuizAttemptAction(
  input: unknown,
): Promise<SubmitQuizAttemptResult> {
  const { user } = await getCurrentUserRole();

  if (!user) {
    return {
      ok: false,
      message: "Test sonucunu kaydetmek icin giris yapmalisin.",
    };
  }

  const parsed = quizAttemptSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Test cevaplari kontrol edilemedi.",
    };
  }

  const answerKey = await getAnswerKey(parsed.data);
  const submittedQuestionIds = new Set(
    parsed.data.answers.map((answer) => answer.questionId),
  );
  const validQuestions = answerKey.filter((question) =>
    submittedQuestionIds.has(question.id),
  );

  if (validQuestions.length === 0) {
    return {
      ok: false,
      message: "Kaydedilecek gecerli soru bulunamadi.",
    };
  }

  const selectedByQuestionId = new Map(
    parsed.data.answers.map((answer) => [
      answer.questionId,
      answer.selectedOptionId ?? null,
    ]),
  );
  const answerResults: Record<
    string,
    { isCorrect: boolean; correctOptionId: string }
  > = {};
  let correctCount = 0;
  let wrongCount = 0;
  let blankCount = 0;

  for (const question of validQuestions) {
    const selectedOptionId = selectedByQuestionId.get(question.id) ?? null;

    if (!selectedOptionId) {
      blankCount += 1;
      answerResults[question.id] = {
        isCorrect: false,
        correctOptionId: question.correctOptionId!,
      };
      continue;
    }

    const isValidOption = question.options.some(
      (option) => option.id === selectedOptionId,
    );
    const isCorrect =
      isValidOption && selectedOptionId === question.correctOptionId;

    if (isCorrect) {
      correctCount += 1;
    } else {
      wrongCount += 1;
    }

    answerResults[question.id] = {
      isCorrect,
      correctOptionId: question.correctOptionId!,
    };
  }

  const mode = parsed.data.mode;
  const isScored = mode === "topic";
  const rawScore = correctCount * CORRECT_POINTS - wrongCount * WRONG_PENALTY;
  const score = isScored ? rawScore : 0;
  const pointDelta = isScored ? score : 0;
  const elapsedSeconds = isScored ? parsed.data.elapsedSeconds : 0;
  const supabase = await createClient();
  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: user.id,
      topic_id: mode === "topic" ? parsed.data.topicId ?? null : null,
      quiz_set_id: mode === "topic" ? parsed.data.quizSetId ?? null : null,
      mode,
      score,
      point_delta: pointDelta,
      total_questions: validQuestions.length,
      correct_count: correctCount,
      wrong_count: wrongCount,
      blank_count: blankCount,
      elapsed_seconds: elapsedSeconds,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (attemptError) {
    return {
      ok: false,
      message: attemptError.message,
    };
  }

  const { error: answersError } = await supabase
    .from("quiz_attempt_answers")
    .insert(
      validQuestions.map((question) => {
        const selectedOptionId = selectedByQuestionId.get(question.id) ?? null;

        return {
          attempt_id: attempt.id,
          question_id: question.id,
          selected_option_id: selectedOptionId,
          is_correct:
            selectedOptionId != null &&
            selectedOptionId === question.correctOptionId,
        };
      }),
    );

  if (answersError) {
    await supabase.from("quiz_attempts").delete().eq("id", attempt.id);

    return {
      ok: false,
      message: answersError.message,
    };
  }

  if (pointDelta !== 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_points")
      .eq("id", user.id)
      .single();

    await supabase
      .from("profiles")
      .update({
        total_points: Math.max(0, (profile?.total_points ?? 0) + pointDelta),
      })
      .eq("id", user.id);

    revalidatePath("/");
  }

  return {
    ok: true,
    result: {
      correctCount,
      wrongCount,
      blankCount,
      totalQuestions: validQuestions.length,
      score,
      pointDelta,
      elapsedSeconds,
      answers: answerResults,
    },
  };
}

async function getAnswerKey(input: {
  mode: "topic" | "random";
  topicId?: string | null;
  quizSetId?: string | null;
}) {
  if (input.mode === "random") {
    return getAllQuizQuestions();
  }

  if (!input.quizSetId) {
    return [];
  }

  const topics = await getQuizTopics();
  const topic = topics.find((item) => item.id === input.topicId);

  if (!topic) {
    return [];
  }

  return (await getQuizDeck(topic.slug)).questions.filter(
    (question) => question.quizSetId === input.quizSetId,
  );
}
