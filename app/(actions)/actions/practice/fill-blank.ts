"use server";

import { z } from "zod";
import { getCurrentUserRole } from "@/lib/auth/roles";
import {
  getCachedFillBlankLetterGuess,
  getCachedFillBlankReveal,
} from "@/lib/practice/get-fill-blank";
import { uuidSchema } from "@/lib/validations/primitives";

const guessFillBlankLetterSchema = z.object({
  questionId: uuidSchema,
  topicSlug: z.string().trim().min(2).max(80),
  letter: z.string().trim().min(1).max(2),
});

export type GuessFillBlankLetterResult =
  | {
      ok: true;
      isMatch: boolean;
      matches: {
        position: number;
        character: string;
      }[];
    }
  | {
      ok: false;
      message: string;
    };

export type RevealFillBlankAnswerResult =
  | {
      ok: true;
      correctAnswer: string;
      explanation: string | null;
    }
  | {
      ok: false;
      message: string;
    };

export async function guessFillBlankLetterAction(
  input: unknown,
): Promise<GuessFillBlankLetterResult> {
  const { user } = await getCurrentUserRole();

  if (!user) {
    return {
      ok: false,
      message: "Harf kontrolu icin giris yapmalisin.",
    };
  }

  const parsed = guessFillBlankLetterSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Gecerli bir harf sec.",
    };
  }

  const letter = Array.from(parsed.data.letter.trim())[0];

  if (!letter) {
    return {
      ok: false,
      message: "Gecerli bir harf sec.",
    };
  }

  const result = await getCachedFillBlankLetterGuess({
    letter,
    questionId: parsed.data.questionId,
    topicSlug: parsed.data.topicSlug,
  });

  if (!result) {
    return {
      ok: false,
      message: "Soru bulunamadi.",
    };
  }

  return {
    ok: true,
    isMatch: result.isMatch,
    matches: result.matches,
  };
}

export async function revealFillBlankAnswerAction(
  input: unknown,
): Promise<RevealFillBlankAnswerResult> {
  const { user } = await getCurrentUserRole();

  if (!user) {
    return {
      ok: false,
      message: "Cevabi gormek icin giris yapmalisin.",
    };
  }

  const parsed = z
    .object({
      questionId: uuidSchema,
      topicSlug: z.string().trim().min(2).max(80),
    })
    .safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Soru bulunamadi.",
    };
  }

  const result = await getCachedFillBlankReveal({
    questionId: parsed.data.questionId,
    topicSlug: parsed.data.topicSlug,
  });

  if (!result) {
    return {
      ok: false,
      message: "Soru bulunamadi.",
    };
  }

  return {
    ok: true,
    correctAnswer: result.correctAnswer,
    explanation: result.explanation,
  };
}
