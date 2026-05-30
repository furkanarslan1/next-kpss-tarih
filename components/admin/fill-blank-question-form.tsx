"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createFillBlankQuestionAction } from "@/app/(actions)/actions/admin/practice-questions";
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
import { fillBlankQuestionSchema } from "@/lib/validations/learning";

type TopicOption = {
  id: string;
  title: string;
  periodTitle: string;
};

type FillBlankQuestionFormProps = {
  topics: TopicOption[];
};

type FillBlankQuestionFormValues = z.input<typeof fillBlankQuestionSchema>;
type FillBlankQuestionFormOutput = z.output<typeof fillBlankQuestionSchema>;

export function FillBlankQuestionForm({
  topics,
}: FillBlankQuestionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formMessage, setFormMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const form = useForm<
    FillBlankQuestionFormValues,
    unknown,
    FillBlankQuestionFormOutput
  >({
    resolver: zodResolver(fillBlankQuestionSchema),
    defaultValues: {
      topicId: topics[0]?.id ?? "",
      prompt: "",
      correctAnswer: "",
      acceptedAnswersText: null,
      hint: null,
      explanation: null,
      timeLimitSeconds: 45,
      status: "draft",
    },
  });

  const fieldErrors = form.formState.errors;
  const isDisabled = isPending || topics.length === 0;

  function onSubmit(values: FillBlankQuestionFormOutput) {
    setFormMessage(null);

    startTransition(async () => {
      const result = await createFillBlankQuestionAction(values);

      if (!result.ok) {
        setFormMessage({ kind: "error", text: result.message });

        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (!messages?.length) continue;
            form.setError(field as keyof FillBlankQuestionFormValues, {
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
        prompt: "",
        correctAnswer: "",
        acceptedAnswersText: null,
        hint: null,
        explanation: null,
        timeLimitSeconds: values.timeLimitSeconds,
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
            <FieldLabel htmlFor="fillTopicId">Konu</FieldLabel>
            <select
              id="fillTopicId"
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
            <FieldLabel htmlFor="fillPrompt">Soru cumlesi</FieldLabel>
            <Textarea
              id="fillPrompt"
              rows={4}
              placeholder="Ornek: Osmanli Beyligi'nin kurucusu kabul edilen kisi kimdir?"
              {...form.register("prompt")}
            />
            <FieldDescription>
              Kullanici cevabi kendisi yazacak; cevabi soru metninde acikca
              vermemeye dikkat et.
            </FieldDescription>
            <FieldError errors={[fieldErrors.prompt]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="fillCorrectAnswer">Dogru cevap</FieldLabel>
            <Input
              id="fillCorrectAnswer"
              placeholder="Ornek: Osman Bey"
              {...form.register("correctAnswer")}
            />
            <FieldError errors={[fieldErrors.correctAnswer]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="acceptedAnswersText">
              Kabul edilen alternatifler
            </FieldLabel>
            <Textarea
              id="acceptedAnswersText"
              rows={3}
              placeholder={"Ornek:\nOsman Gazi\nI. Osman"}
              {...form.register("acceptedAnswersText")}
            />
            <FieldDescription>
              Her satira bir alternatif yaz. Dogru cevap otomatik olarak listeye
              eklenir.
            </FieldDescription>
            <FieldError errors={[fieldErrors.acceptedAnswersText]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="fillHint">Ipucu</FieldLabel>
            <Input
              id="fillHint"
              placeholder="Ornek: Kurucu bey"
              {...form.register("hint")}
            />
            <FieldError errors={[fieldErrors.hint]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="fillExplanation">Aciklama</FieldLabel>
            <Textarea
              id="fillExplanation"
              rows={4}
              placeholder="Kisa cozum aciklamasi veya hatirlatma notu."
              {...form.register("explanation")}
            />
            <FieldError errors={[fieldErrors.explanation]} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="timeLimitSeconds">Soru suresi</FieldLabel>
              <Input
                id="timeLimitSeconds"
                type="number"
                min={10}
                max={300}
                step={5}
                {...form.register("timeLimitSeconds")}
              />
              <FieldDescription>10-300 saniye arasi.</FieldDescription>
              <FieldError errors={[fieldErrors.timeLimitSeconds]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="fillStatus">Yayin durumu</FieldLabel>
              <select
                id="fillStatus"
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register("status")}
              >
                <option value="draft">Taslak</option>
                <option value="published">Yayinda</option>
                <option value="archived">Arsiv</option>
              </select>
              <FieldError errors={[fieldErrors.status]} />
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
        {isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
        Bosluk doldurma sorusu ekle
      </Button>
    </form>
  );
}
