import { z } from "zod";
import { optionalTextSchema } from "@/lib/validations/primitives";

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(2).max(80).nullable().optional(),
  username: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{3,32}$/)
    .nullable()
    .optional(),
  avatarUrl: optionalTextSchema,
  onboardingCompleted: z.boolean().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
