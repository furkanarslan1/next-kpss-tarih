"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { adminFlashcardsTag, flashcardsTag } from "@/lib/cache-tags";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { flashcardSchema } from "@/lib/validations/learning";

const createFlashcardSchema = flashcardSchema.omit({ sortOrder: true });

export type CreateFlashcardResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function createFlashcardAction(
  input: unknown,
): Promise<CreateFlashcardResult> {
  const { user, isAdmin } = await getCurrentUserRole();

  if (!user || !isAdmin) {
    return {
      ok: false,
      message: "Bu islem icin admin yetkisi gerekiyor.",
    };
  }

  const parsed = createFlashcardSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Form alanlarini kontrol et.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: latestFlashcard, error: latestError } = await supabase
    .from("flashcards")
    .select("sort_order")
    .eq("topic_id", parsed.data.topicId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    return {
      ok: false,
      message: latestError.message,
    };
  }

  const nextSortOrder = (latestFlashcard?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("flashcards").insert({
    topic_id: parsed.data.topicId,
    front: parsed.data.front,
    back: parsed.data.back,
    hint: parsed.data.hint ?? null,
    sort_order: nextSortOrder,
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

  revalidateTag(flashcardsTag(parsed.data.topicId), "max");
  revalidateTag(adminFlashcardsTag, "max");
  revalidatePath("/admin/flashcards");

  return {
    ok: true,
    message: "Bilgi karti kaydedildi.",
  };
}
