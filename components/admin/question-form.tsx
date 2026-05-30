"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  WandSparklesIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  createQuestionAction,
  suggestQuestionOptionsAction,
} from "@/app/(actions)/actions/admin/questions";
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
import { createQuizQuestionSchema } from "@/lib/validations/learning";
import { cn } from "@/lib/utils";

type TopicOption = {
  id: string;
  title: string;
  periodTitle: string;
};

type QuestionFormProps = {
  topics: TopicOption[];
  quizSets: QuizSetOption[];
};

type QuizSetOption = {
  id: string;
  topicId: string;
  title: string;
  setOrder: number;
  questionCount: number;
  unlockRequiredCorrect: number;
};

type QuestionFormValues = z.input<typeof createQuizQuestionSchema>;
type QuestionFormOutput = z.output<typeof createQuizQuestionSchema>;

const emptyDistractors = [
  { optionText: "" },
  { optionText: "" },
  { optionText: "" },
];

export function QuestionForm({ topics, quizSets }: QuestionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [formMessage, setFormMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [suggestionMessage, setSuggestionMessage] = useState<string | null>(
    null,
  );

  const form = useForm<QuestionFormValues, unknown, QuestionFormOutput>({
    resolver: zodResolver(createQuizQuestionSchema),
    defaultValues: {
      topicId: topics[0]?.id ?? "",
      quizSetId:
        quizSets.find((quizSet) => quizSet.topicId === topics[0]?.id)?.id ?? "",
      prompt: "",
      correctAnswer: "",
      explanation: null,
      status: "draft",
      distractors: emptyDistractors,
    },
  });
  const distractors = useFieldArray({
    control: form.control,
    name: "distractors",
  });

  const selectedTopicId = useWatch({
    control: form.control,
    name: "topicId",
  });
  const topicQuizSets = useMemo(
    () =>
      quizSets
        .filter((quizSet) => quizSet.topicId === selectedTopicId)
        .sort((a, b) => a.setOrder - b.setOrder),
    [quizSets, selectedTopicId],
  );
  const fieldErrors = form.formState.errors;
  const isDisabled =
    isPending || isSuggesting || topics.length === 0 || quizSets.length === 0;

  function suggestOptions() {
    setFormMessage(null);
    setSuggestionMessage(null);

    const { topicId, correctAnswer } = form.getValues();

    startSuggestionTransition(async () => {
      const result = await suggestQuestionOptionsAction({
        topicId,
        correctAnswer,
      });

      if (!result.ok) {
        setSuggestionMessage(result.message);
        return;
      }

      const options = result.options.length
        ? result.options
        : emptyDistractors.map((distractor) => distractor.optionText);
      const paddedOptions = [
        ...options,
        ...Array.from({ length: Math.max(0, 3 - options.length) }, () => ""),
      ].slice(0, 5);

      distractors.replace(
        paddedOptions.map((optionText) => ({
          optionText,
        })),
      );
      setSuggestionMessage(result.message);
    });
  }

  function onSubmit(values: QuestionFormOutput) {
    setFormMessage(null);

    startTransition(async () => {
      const result = await createQuestionAction(values);

      if (!result.ok) {
        setFormMessage({ kind: "error", text: result.message });

        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (!messages?.length) continue;
            form.setError(field as keyof QuestionFormValues, {
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
        quizSetId: values.quizSetId,
        prompt: "",
        correctAnswer: "",
        explanation: null,
        status: values.status,
        distractors: emptyDistractors,
      });
      setSuggestionMessage(null);
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
              onChange={(event) => {
                const topicId = event.target.value;
                const firstQuizSet = quizSets
                  .filter((quizSet) => quizSet.topicId === topicId)
                  .sort((a, b) => a.setOrder - b.setOrder)[0];

                form.setValue("topicId", topicId, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                form.setValue("quizSetId", firstQuizSet?.id ?? "", {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
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
            <FieldLabel htmlFor="quizSetId">Test bolumu</FieldLabel>
            <select
              id="quizSetId"
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              {...form.register("quizSetId")}
            >
              {topicQuizSets.map((quizSet) => (
                <option key={quizSet.id} value={quizSet.id}>
                  {quizSet.title} / {quizSet.questionCount} soru / kilit:{" "}
                  {quizSet.unlockRequiredCorrect} dogru
                </option>
              ))}
            </select>
            {topicQuizSets.length === 0 ? (
              <FieldDescription>
                Bu konu icin once test bolumu olusturulmasi gerekiyor.
              </FieldDescription>
            ) : null}
            <FieldError errors={[fieldErrors.quizSetId]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="prompt">Soru</FieldLabel>
            <Textarea
              id="prompt"
              rows={5}
              placeholder="Ornek: Osmanli Devleti'nin Rumeli'ye gecisinde etkili olan ilk toprak kazanimi hangisidir?"
              {...form.register("prompt")}
            />
            <FieldError errors={[fieldErrors.prompt]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="correctAnswer">Dogru cevap</FieldLabel>
            <Input
              id="correctAnswer"
              placeholder="Ornek: Cimpe Kalesi"
              {...form.register("correctAnswer")}
            />
            <FieldDescription>
              Otomatik oneriler diger sorularin dogru cevaplarindan secilir.
            </FieldDescription>
            <FieldError errors={[fieldErrors.correctAnswer]} />
          </Field>

          <Field>
            <FieldLabel>Secenek modu</FieldLabel>
            <div className="grid grid-cols-2 rounded-lg border bg-muted/30 p-1">
              <button
                type="button"
                className={cn(
                  "h-8 rounded-md px-3 text-sm font-medium transition-colors",
                  mode === "auto"
                    ? "bg-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setMode("auto")}
              >
                Otomatik oner
              </button>
              <button
                type="button"
                className={cn(
                  "h-8 rounded-md px-3 text-sm font-medium transition-colors",
                  mode === "manual"
                    ? "bg-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setMode("manual")}
              >
                Manuel gir
              </button>
            </div>
          </Field>

          {mode === "auto" ? (
            <div className="rounded-md border bg-muted/20 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Dogru cevabi yaz, sonra benzer konulardan yanlis secenekleri
                  getir. Gelen secenekleri kaydetmeden once duzenleyebilirsin.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={suggestOptions}
                  disabled={isDisabled}
                >
                  {isSuggesting ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <WandSparklesIcon />
                  )}
                  Secenek olustur
                </Button>
              </div>
              {suggestionMessage ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {suggestionMessage}
                </p>
              ) : null}
            </div>
          ) : null}

          <Field>
            <div className="flex items-center justify-between gap-3">
              <FieldLabel>Yanlis secenekler</FieldLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => distractors.append({ optionText: "" })}
                disabled={isDisabled || distractors.fields.length >= 5}
              >
                <PlusIcon />
                Secenek
              </Button>
            </div>
            <div className="space-y-3">
              {distractors.fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    aria-label={`${index + 1}. yanlis secenek`}
                    placeholder={`${index + 1}. yanlis secenek`}
                    {...form.register(`distractors.${index}.optionText`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => distractors.remove(index)}
                    disabled={isDisabled || distractors.fields.length <= 3}
                    aria-label="Secenegi sil"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              ))}
            </div>
            <FieldDescription>
              En az 3, en fazla 5 yanlis secenek girilebilir.
            </FieldDescription>
            <FieldError errors={[fieldErrors.distractors]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="explanation">Aciklama</FieldLabel>
            <Textarea
              id="explanation"
              rows={4}
              placeholder="Kisa cozum aciklamasi veya hatirlatma notu."
              {...form.register("explanation")}
            />
            <FieldError errors={[fieldErrors.explanation]} />
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
        {isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
        Test sorusu ekle
      </Button>
    </form>
  );
}
