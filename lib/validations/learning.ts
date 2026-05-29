import { z } from "zod";
import { questionDifficultySchema } from "@/lib/validations/enums";
import {
  optionalTextSchema,
  sortOrderSchema,
  uuidSchema,
} from "@/lib/validations/primitives";
import { contentStatusSchema } from "@/lib/validations/enums";

export const flashcardSchema = z.object({
  topicId: uuidSchema,
  front: z.string().trim().min(2).max(500),
  back: z.string().trim().min(2).max(2000),
  hint: optionalTextSchema,
  sortOrder: sortOrderSchema,
  status: contentStatusSchema.default("draft"),
});

export const quizOptionSchema = z.object({
  optionText: z.string().trim().min(1).max(500),
  isCorrect: z.boolean().default(false),
  sortOrder: sortOrderSchema,
});

export const quizQuestionSchema = z
  .object({
    topicId: uuidSchema,
    prompt: z.string().trim().min(5).max(2000),
    explanation: optionalTextSchema,
    difficulty: questionDifficultySchema.default("medium"),
    sortOrder: sortOrderSchema,
    status: contentStatusSchema.default("draft"),
    options: z.array(quizOptionSchema).min(2).max(6),
  })
  .refine(
    (value) => value.options.filter((option) => option.isCorrect).length === 1,
    "A question must have exactly one correct option.",
  );

export const quizAttemptAnswerSchema = z.object({
  questionId: uuidSchema,
  selectedOptionId: uuidSchema.nullable().optional(),
});

export const quizAttemptSchema = z.object({
  topicId: uuidSchema,
  answers: z.array(quizAttemptAnswerSchema).min(1),
});

export const flashcardReviewSchema = z.object({
  flashcardId: uuidSchema,
  confidence: z.coerce.number().int().min(1).max(5),
});

export type FlashcardInput = z.infer<typeof flashcardSchema>;
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;
export type QuizOptionInput = z.infer<typeof quizOptionSchema>;
export type QuizAttemptInput = z.infer<typeof quizAttemptSchema>;
export type FlashcardReviewInput = z.infer<typeof flashcardReviewSchema>;
