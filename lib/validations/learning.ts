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
    quizSetId: uuidSchema,
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

export const createQuizQuestionSchema = z
  .object({
    topicId: uuidSchema,
    quizSetId: uuidSchema,
    prompt: z.string().trim().min(5).max(2000),
    correctAnswer: z.string().trim().min(1).max(500),
    explanation: optionalTextSchema,
    status: contentStatusSchema.default("draft"),
    distractors: z.array(
      z.object({
        optionText: z.string().trim().min(1).max(500),
      }),
    ).min(3).max(5),
  })
  .superRefine((value, context) => {
    const seen = new Set<string>();
    const normalizedCorrectAnswer = normalizeOptionText(value.correctAnswer);

    seen.add(normalizedCorrectAnswer);

    for (const [index, distractor] of value.distractors.entries()) {
      const normalized = normalizeOptionText(distractor.optionText);

      if (seen.has(normalized)) {
        context.addIssue({
          code: "custom",
          message: "Secenekler birbirinden farkli olmali.",
          path: ["distractors", index, "optionText"],
        });
      }

      seen.add(normalized);
    }
  });

export const quizAttemptAnswerSchema = z.object({
  questionId: uuidSchema,
  selectedOptionId: uuidSchema.nullable().optional(),
});

export const quizAttemptSchema = z.object({
  topicId: uuidSchema.nullable().optional(),
  quizSetId: uuidSchema.nullable().optional(),
  mode: z.enum(["topic", "random"]).default("topic"),
  elapsedSeconds: z.coerce.number().int().min(0).max(24 * 60 * 60),
  answers: z.array(quizAttemptAnswerSchema).min(1),
});

export const flashcardReviewSchema = z.object({
  flashcardId: uuidSchema,
  confidence: z.coerce.number().int().min(1).max(5),
});

export type FlashcardInput = z.infer<typeof flashcardSchema>;
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;
export type CreateQuizQuestionInput = z.infer<typeof createQuizQuestionSchema>;
export type QuizOptionInput = z.infer<typeof quizOptionSchema>;
export type QuizAttemptInput = z.infer<typeof quizAttemptSchema>;
export type FlashcardReviewInput = z.infer<typeof flashcardReviewSchema>;

function normalizeOptionText(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
}
