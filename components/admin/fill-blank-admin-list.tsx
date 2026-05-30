"use client";

import { ArrowDownIcon, ArrowUpIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deletePracticeQuestionAction,
  reorderPracticeQuestionAction,
  updateFillBlankQuestionAction,
} from "@/app/(actions)/actions/admin/practice-questions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FillBlankQuestion = {
  id: string;
  prompt: string;
  correctAnswer: string;
  acceptedAnswers: string[];
  hint: string | null;
  explanation: string | null;
  timeLimitSeconds: number;
  sortOrder: number;
  status: "draft" | "published" | "archived";
  topicTitle: string;
  periodTitle: string;
};

type FillBlankAdminListProps = {
  questions: FillBlankQuestion[];
};

export function FillBlankAdminList({ questions }: FillBlankAdminListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    prompt: "",
    correctAnswer: "",
    acceptedAnswersText: "",
    hint: "",
    explanation: "",
    timeLimitSeconds: 45,
    status: "draft" as FillBlankQuestion["status"],
  });

  function runAction(action: () => Promise<{ ok: boolean; message: string }>) {
    setMessage(null);

    startTransition(async () => {
      const result = await action();
      setMessage(result.message);

      if (result.ok) {
        setEditingId(null);
        router.refresh();
      }
    });
  }

  function startEdit(question: FillBlankQuestion) {
    setEditingId(question.id);
    setEditValues({
      prompt: question.prompt,
      correctAnswer: question.correctAnswer,
      acceptedAnswersText: question.acceptedAnswers
        .filter((answer) => answer !== question.correctAnswer)
        .join("\n"),
      hint: question.hint ?? "",
      explanation: question.explanation ?? "",
      timeLimitSeconds: question.timeLimitSeconds,
      status: question.status,
    });
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        Henuz bosluk doldurma sorusu yok.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {questions.map((question) => {
        const isEditing = editingId === question.id;

        return (
          <article key={question.id} className="rounded-md border bg-muted/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{question.topicTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {question.periodTitle}
                </p>
              </div>
              <span className="shrink-0 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">
                {question.status}
              </span>
            </div>

            {isEditing ? (
              <div className="mt-3 space-y-3">
                <Textarea
                  rows={4}
                  value={editValues.prompt}
                  onChange={(event) =>
                    setEditValues((values) => ({
                      ...values,
                      prompt: event.target.value,
                    }))
                  }
                />
                <Input
                  value={editValues.correctAnswer}
                  onChange={(event) =>
                    setEditValues((values) => ({
                      ...values,
                      correctAnswer: event.target.value,
                    }))
                  }
                  placeholder="Dogru cevap"
                />
                <Textarea
                  rows={3}
                  value={editValues.acceptedAnswersText}
                  onChange={(event) =>
                    setEditValues((values) => ({
                      ...values,
                      acceptedAnswersText: event.target.value,
                    }))
                  }
                  placeholder="Alternatif cevaplar"
                />
                <Input
                  value={editValues.hint}
                  onChange={(event) =>
                    setEditValues((values) => ({
                      ...values,
                      hint: event.target.value,
                    }))
                  }
                  placeholder="Ipucu"
                />
                <Textarea
                  rows={3}
                  value={editValues.explanation}
                  onChange={(event) =>
                    setEditValues((values) => ({
                      ...values,
                      explanation: event.target.value,
                    }))
                  }
                  placeholder="Aciklama"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    type="number"
                    min={10}
                    max={300}
                    step={5}
                    value={editValues.timeLimitSeconds}
                    onChange={(event) =>
                      setEditValues((values) => ({
                        ...values,
                        timeLimitSeconds: Number(event.target.value),
                      }))
                    }
                  />
                  <select
                    className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                    value={editValues.status}
                    onChange={(event) =>
                      setEditValues((values) => ({
                        ...values,
                        status: event.target.value as FillBlankQuestion["status"],
                      }))
                    }
                  >
                    <option value="draft">Taslak</option>
                    <option value="published">Yayinda</option>
                    <option value="archived">Arsiv</option>
                  </select>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-3 line-clamp-3 text-sm">{question.prompt}</p>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  Cevap: {question.correctAnswer} / Sure:{" "}
                  {question.timeLimitSeconds} sn / Sira: {question.sortOrder}
                </p>
              </>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  runAction(() =>
                    reorderPracticeQuestionAction({
                      questionId: question.id,
                      direction: "up",
                    }),
                  )
                }
              >
                <ArrowUpIcon />
                Yukari
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  runAction(() =>
                    reorderPracticeQuestionAction({
                      questionId: question.id,
                      direction: "down",
                    }),
                  )
                }
              >
                <ArrowDownIcon />
                Asagi
              </Button>
              {isEditing ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    runAction(() =>
                      updateFillBlankQuestionAction({
                        questionId: question.id,
                        ...editValues,
                      }),
                    )
                  }
                >
                  <SaveIcon />
                  Kaydet
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => startEdit(question)}
                >
                  Duzenle
                </Button>
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  runAction(() =>
                    deletePracticeQuestionAction({ questionId: question.id }),
                  )
                }
              >
                <Trash2Icon />
                Sil
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
