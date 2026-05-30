"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createFlashcardAction } from "@/app/(actions)/actions/admin/flashcards";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { flashcardSchema } from "@/lib/validations/learning";

type TopicOption = {
  id: string;
  title: string;
  periodTitle: string;
};

type FlashcardFormProps = {
  topics: TopicOption[];
};

const createFlashcardSchema = flashcardSchema.omit({ sortOrder: true });

type FlashcardFormValues = z.input<typeof createFlashcardSchema>;
type FlashcardFormOutput = z.output<typeof createFlashcardSchema>;

export function FlashcardForm({ topics }: FlashcardFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formMessage, setFormMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const form = useForm<FlashcardFormValues, unknown, FlashcardFormOutput>({
    resolver: zodResolver(createFlashcardSchema),
    defaultValues: {
      topicId: topics[0]?.id ?? "",
      front: "",
      back: "",
      hint: null,
      status: "draft",
    },
  });

  const fieldErrors = form.formState.errors;
  const isDisabled = isPending || topics.length === 0;

  function onSubmit(values: FlashcardFormOutput) {
    setFormMessage(null);

    startTransition(async () => {
      const result = await createFlashcardAction(values);

      if (!result.ok) {
        setFormMessage({ kind: "error", text: result.message });

        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (!messages?.length) continue;
            form.setError(field as keyof FlashcardFormValues, {
              type: "server",
              message: messages.join(" "),
            });
          }
        }

        return;
      }

      setFormMessage({ kind: "success", text: result.message });
      form.reset({
        topicId: values.topicId,
        front: "",
        back: "",
        hint: null,
        status: values.status,
      });
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FieldSet disabled={isDisabled}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="topicId">Konu</FieldLabel>
            <select
              id="topicId"
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              {...form.register("topicId")}
            >
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.periodTitle} / {topic.title}
                </option>
              ))}
            </select>
            {topics.length === 0 ? (
              <FieldDescription>
                Once bir donem ve konu olusturulmasi gerekiyor.
              </FieldDescription>
            ) : null}
            <FieldError errors={[fieldErrors.topicId]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="front">Kart on yuzu</FieldLabel>
            <Textarea
              id="front"
              rows={4}
              placeholder="Ornek: Karesi Beyligi'nin Osmanli'ya katilmasinin onemi nedir?"
              {...form.register("front")}
            />
            <FieldDescription>
              Kullanici kartta ilk olarak bu soruyu veya kavrami gorecek.
            </FieldDescription>
            <FieldError errors={[fieldErrors.front]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="back">Kart arka yuzu</FieldLabel>
            <Textarea
              id="back"
              rows={7}
              placeholder="Karesi'nin katilmasi Osmanli'ya donanma, denizcilik tecrubesi ve Rumeli'ye gecis avantaji sagladi."
              {...form.register("back")}
            />
            <FieldDescription>
              Cevabi kisa ama KPSS anahtar kelimelerini icerecek sekilde yaz.
            </FieldDescription>
            <FieldError errors={[fieldErrors.back]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="hint">Ipucu</FieldLabel>
            <Input
              id="hint"
              placeholder="Ornek: Rumeli'ye gecis"
              {...form.register("hint")}
            />
            <FieldError errors={[fieldErrors.hint]} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="status">Yayin durumu</FieldLabel>
              <select
                id="status"
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register("status")}
              >
                <option value="draft">Taslak</option>
                <option value="published">Yayinda</option>
                <option value="archived">Arsiv</option>
              </select>
              <FieldError errors={[fieldErrors.status]} />
            </Field>

            <Field>
              <FieldLabel>Siralamasi</FieldLabel>
              <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                Secilen konunun sonuna otomatik eklenir
              </div>
            </Field>
          </div>
        </FieldGroup>
      </FieldSet>

      {formMessage ? (
        <p
          className={
            formMessage.kind === "success"
              ? "text-sm text-emerald-600"
              : "text-sm text-destructive"
          }
        >
          {formMessage.text}
        </p>
      ) : null}

      <Button type="submit" disabled={isDisabled}>
        {isPending ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <PlusIcon />
        )}
        Bilgi karti ekle
      </Button>
    </form>
  );
}
