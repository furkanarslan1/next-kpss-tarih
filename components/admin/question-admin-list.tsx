"use client";

import { ArrowDownIcon, ArrowUpIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteQuestionAction,
  moveQuestionToSetAction,
  reorderQuestionAction,
  updateQuestionAction,
} from "@/app/(actions)/actions/admin/questions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type QuizSetOption = {
  id: string;
  topicId: string;
  title: string;
  setOrder: number;
};

type AdminQuestion = {
  id: string;
  topicId: string;
  prompt: string;
  explanation: string | null;
  sortOrder: number;
  status: "draft" | "published" | "archived";
  topicTitle: string;
  periodTitle: string;
  quizSetTitle: string;
  correctAnswer: string;
};

type QuestionAdminListProps = {
  questions: AdminQuestion[];
  quizSets: QuizSetOption[];
};

export function QuestionAdminList({
  questions,
  quizSets,
}: QuestionAdminListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    prompt: string;
    explanation: string;
    status: "draft" | "published" | "archived";
  }>({
    prompt: "",
    explanation: "",
    status: "draft",
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

  function startEdit(question: AdminQuestion) {
    setEditingId(question.id);
    setEditValues({
      prompt: question.prompt,
      explanation: question.explanation ?? "",
      status: question.status,
    });
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        Henuz test sorusu yok.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {questions.map((question) => {
        const sameTopicSets = quizSets
          .filter((quizSet) => quizSet.topicId === question.topicId)
          .sort((a, b) => a.setOrder - b.setOrder);
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
                <select
                  className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                  value={editValues.status}
                  onChange={(event) =>
                    setEditValues((values) => ({
                      ...values,
                      status: event.target.value as AdminQuestion["status"],
                    }))
                  }
                >
                  <option value="draft">Taslak</option>
                  <option value="published">Yayinda</option>
                  <option value="archived">Arsiv</option>
                </select>
              </div>
            ) : (
              <>
                <p className="mt-3 line-clamp-3 text-sm">{question.prompt}</p>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  Dogru cevap: {question.correctAnswer}
                </p>
              </>
            )}

            <div className="mt-3 grid gap-2">
              <p className="text-xs text-muted-foreground">
                {question.quizSetTitle} / Sira: {question.sortOrder}
              </p>
              <select
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                disabled={isPending}
                defaultValue=""
                onChange={(event) => {
                  const quizSetId = event.target.value;
                  event.currentTarget.value = "";

                  if (!quizSetId) return;
                  runAction(() =>
                    moveQuestionToSetAction({
                      questionId: question.id,
                      quizSetId,
                    }),
                  );
                }}
              >
                <option value="">Baska teste tasi</option>
                {sameTopicSets.map((quizSet) => (
                  <option key={quizSet.id} value={quizSet.id}>
                    {quizSet.title}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    runAction(() =>
                      reorderQuestionAction({
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
                      reorderQuestionAction({
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
                        updateQuestionAction({
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
                      deleteQuestionAction({ questionId: question.id }),
                    )
                  }
                >
                  <Trash2Icon />
                  Sil
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
