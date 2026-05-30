"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createQuizSetAction } from "@/app/(actions)/actions/admin/questions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type TopicOption = {
  id: string;
  title: string;
  periodTitle: string;
};

type QuizSetFormProps = {
  topics: TopicOption[];
};

const quizSetFormSchema = z.object({
  topicId: z.string().min(1),
  title: z.string().trim().min(2).max(80),
  questionCount: z.coerce.number().int().min(1).max(50),
  unlockRequiredCorrect: z.coerce.number().int().min(0).max(50),
  status: z.enum(["draft", "published", "archived"]),
});

type QuizSetFormValues = z.input<typeof quizSetFormSchema>;
type QuizSetFormOutput = z.output<typeof quizSetFormSchema>;

export function QuizSetForm({ topics }: QuizSetFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const form = useForm<QuizSetFormValues, unknown, QuizSetFormOutput>({
    resolver: zodResolver(quizSetFormSchema),
    defaultValues: {
      topicId: topics[0]?.id ?? "",
      title: "2. Test",
      questionCount: 20,
      unlockRequiredCorrect: 14,
      status: "published",
    },
  });
  const errors = form.formState.errors;

  function onSubmit(values: QuizSetFormOutput) {
    setMessage(null);

    startTransition(async () => {
      const result = await createQuizSetAction(values);

      if (!result.ok) {
        setMessage({ kind: "error", text: result.message });
        return;
      }

      setMessage({ kind: "success", text: result.message });
      form.reset({
        topicId: values.topicId,
        title: "",
        questionCount: values.questionCount,
        unlockRequiredCorrect: values.unlockRequiredCorrect,
        status: values.status,
      });
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FieldSet disabled={isPending || topics.length === 0}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="setTopicId">Konu</FieldLabel>
            <select
              id="setTopicId"
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              {...form.register("topicId")}
            >
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.periodTitle} / {topic.title}
                </option>
              ))}
            </select>
            <FieldError errors={[errors.topicId]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="setTitle">Baslik</FieldLabel>
            <Input
              id="setTitle"
              placeholder="Ornek: 2. Test"
              {...form.register("title")}
            />
            <FieldError errors={[errors.title]} />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="questionCount">Soru sayisi</FieldLabel>
              <Input
                id="questionCount"
                type="number"
                min={1}
                max={50}
                {...form.register("questionCount")}
              />
              <FieldError errors={[errors.questionCount]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="unlockRequiredCorrect">Kilit dogrusu</FieldLabel>
              <Input
                id="unlockRequiredCorrect"
                type="number"
                min={0}
                max={50}
                {...form.register("unlockRequiredCorrect")}
              />
              <FieldError errors={[errors.unlockRequiredCorrect]} />
            </Field>
          </div>
        </FieldGroup>
      </FieldSet>

      {message ? (
        <p
          className={
            message.kind === "success"
              ? "text-sm text-emerald-600"
              : "text-sm text-destructive"
          }
        >
          {message.text}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending || topics.length === 0}>
        {isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
        Test bolumu ekle
      </Button>
    </form>
  );
}
