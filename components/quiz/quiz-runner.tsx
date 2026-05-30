"use client";

import {
  CheckCircle2Icon,
  ClockIcon,
  RotateCcwIcon,
  XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  checkQuizAnswerAction,
  submitQuizAttemptAction,
} from "@/app/(actions)/actions/quiz/attempts";
import { Button } from "@/components/ui/button";
import type { QuizPlayQuestion } from "@/lib/questions/get-questions";
import { cn } from "@/lib/utils";

type QuizRunnerProps = {
  mode: "topic" | "random";
  topicId?: string | null;
  quizSetId?: string | null;
  title: string;
  questions: QuizPlayQuestion[];
  backHref?: string;
  flashcardsHref?: string;
  nextTestHref?: string | null;
  unlockRequiredCorrect?: number | null;
};

type QuizResult = {
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  totalQuestions: number;
  score: number;
  pointDelta: number;
  elapsedSeconds: number;
  answers: Record<string, { isCorrect: boolean; correctOptionId: string }>;
};

export function QuizRunner({
  mode,
  topicId,
  quizSetId,
  title,
  questions,
  backHref = "/tests",
  flashcardsHref,
  nextTestHref = null,
  unlockRequiredCorrect = null,
}: QuizRunnerProps) {
  const [orderedQuestions, setOrderedQuestions] = useState(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [feedbackByQuestionId, setFeedbackByQuestionId] = useState<
    Record<string, { isCorrect: boolean; correctOptionId: string }>
  >({});
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [liveScore, setLiveScore] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isScored = mode === "topic";

  useEffect(() => {
    if (!isScored || result) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isScored, result]);

  const currentQuestion = orderedQuestions[currentIndex];
  const answeredCount = useMemo(
    () =>
      orderedQuestions.filter((question) => selectedAnswers[question.id]).length,
    [orderedQuestions, selectedAnswers],
  );

  function selectOption(questionId: string, optionId: string) {
    if (result || selectedAnswers[questionId] || pendingQuestionId) {
      return;
    }

    const nextSelectedAnswers = {
      ...selectedAnswers,
      [questionId]: optionId,
    };

    setSelectedAnswers((answers) => ({
      ...answers,
      [questionId]: optionId,
    }));
    setPendingQuestionId(questionId);

    startTransition(async () => {
      const response = await checkQuizAnswerAction({
        mode,
        topicId: mode === "topic" ? topicId : null,
        quizSetId: mode === "topic" ? quizSetId : null,
        questionId,
        selectedOptionId: optionId,
      });

      setPendingQuestionId(null);

      if (!response.ok) {
        setSelectedAnswers((answers) => {
          const nextAnswers = { ...answers };
          delete nextAnswers[questionId];
          return nextAnswers;
        });
        setMessage(response.message);
        return;
      }

      setFeedbackByQuestionId((feedback) => ({
        ...feedback,
        [questionId]: {
          isCorrect: response.isCorrect,
          correctOptionId: response.correctOptionId,
        },
      }));

      if (isScored) {
        setLiveScore((score) => score + (response.isCorrect ? 10 : -2));
      }

      window.setTimeout(() => {
        if (currentIndex >= orderedQuestions.length - 1) {
          finishQuiz(nextSelectedAnswers);
          return;
        }

        setCurrentIndex((index) => (index === currentIndex ? index + 1 : index));
      }, 650);
    });
  }

  function finishQuiz(answersToSubmit = selectedAnswers) {
    setMessage(null);

    startTransition(async () => {
      const response = await submitQuizAttemptAction({
        mode,
        topicId: mode === "topic" ? topicId : null,
        quizSetId: mode === "topic" ? quizSetId : null,
        elapsedSeconds,
        answers: orderedQuestions.map((question) => ({
          questionId: question.id,
          selectedOptionId: answersToSubmit[question.id] ?? null,
        })),
      });

      if (!response.ok) {
        setMessage(response.message);
        return;
      }

      setResult(response.result);
    });
  }

  function restartQuiz() {
    setOrderedQuestions(shuffle(questions).map((question) => ({
      ...question,
      options: shuffle(question.options),
    })));
    setCurrentIndex(0);
    setSelectedAnswers({});
    setFeedbackByQuestionId({});
    setPendingQuestionId(null);
    setElapsedSeconds(0);
    setLiveScore(0);
    setResult(null);
    setMessage(null);
  }

  if (orderedQuestions.length === 0 || !currentQuestion) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Bu test icin yayinda soru yok.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4" aria-label={title}>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-orange-200/70 bg-white/60 p-3 shadow-sm shadow-orange-950/5 backdrop-blur-xl">
          <p className="text-xs text-orange-900/60">Soru</p>
          <p className="mt-1 text-lg font-semibold">
            {currentIndex + 1}/{orderedQuestions.length}
          </p>
        </div>
        <div className="rounded-lg border border-orange-200/70 bg-white/60 p-3 shadow-sm shadow-orange-950/5 backdrop-blur-xl">
          <p className="text-xs text-orange-900/60">Cevaplanan</p>
          <p className="mt-1 text-lg font-semibold">{answeredCount}</p>
        </div>
        {isScored ? (
          <>
            <div className="rounded-lg border border-orange-200/70 bg-white/60 p-3 shadow-sm shadow-orange-950/5 backdrop-blur-xl">
              <p className="text-xs text-orange-900/60">Anlik puan</p>
              <p
                className={cn(
                  "mt-1 text-lg font-semibold",
                  liveScore < 0 && "text-destructive",
                  liveScore > 0 && "text-emerald-700",
                )}
              >
                {liveScore}
              </p>
            </div>
            <div className="rounded-lg border border-orange-200/70 bg-white/60 p-3 shadow-sm shadow-orange-950/5 backdrop-blur-xl">
              <p className="flex items-center gap-1 text-xs text-orange-900/60">
                <ClockIcon className="size-3" />
                Sure
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatDuration(elapsedSeconds)}
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-orange-200/70 bg-white/60 p-3 shadow-sm shadow-orange-950/5 backdrop-blur-xl">
            <p className="text-xs text-orange-900/60">Mod</p>
            <p className="mt-1 text-lg font-semibold">Pratik</p>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-orange-200/80 bg-white/65 p-3 shadow-lg shadow-orange-950/5 backdrop-blur-xl sm:p-5">
        <div className="mb-4 flex flex-col gap-1">
          <p className="text-xs text-orange-900/60">
            {currentQuestion.periodTitle} / {currentQuestion.topicTitle}
          </p>
          <h2 className="text-base font-semibold leading-7 sm:text-lg">
            {currentQuestion.prompt}
          </h2>
        </div>

        <div className="grid gap-3">
          {currentQuestion.options.map((option, optionIndex) => {
            const selectedOptionId = selectedAnswers[currentQuestion.id];
            const isSelected = selectedOptionId === option.id;
            const answerResult =
              result?.answers[currentQuestion.id] ??
              feedbackByQuestionId[currentQuestion.id];
            const isCorrectOption = answerResult?.correctOptionId === option.id;
            const isWrongSelection =
              answerResult && isSelected && !answerResult.isCorrect;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => selectOption(currentQuestion.id, option.id)}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-lg border border-orange-200/70 bg-white/75 px-3 py-2 text-left text-sm leading-6 shadow-sm shadow-orange-950/5 transition-colors hover:border-orange-300 hover:bg-orange-50/70",
                  isSelected && "border-orange-500 bg-orange-50",
                  isCorrectOption && answerResult && "border-emerald-600 bg-emerald-50 text-emerald-950",
                  isWrongSelection && "border-destructive bg-destructive/10",
                )}
                disabled={
                  Boolean(feedbackByQuestionId[currentQuestion.id]) ||
                  pendingQuestionId === currentQuestion.id
                }
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-orange-200 bg-white/70 text-xs font-medium">
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span className="leading-6">{option.text}</span>
              </button>
            );
          })}
        </div>

        {result && currentQuestion.explanation ? (
          <div className="mt-4 rounded-md border bg-muted/25 p-3 text-sm leading-6 text-muted-foreground">
            {currentQuestion.explanation}
          </div>
        ) : null}
      </section>

      {message ? <p className="text-sm text-destructive">{message}</p> : null}

      {result ? (
        <ResultModal
          backHref={backHref}
          flashcardsHref={flashcardsHref}
          isScored={isScored}
          nextTestHref={nextTestHref}
          result={result}
          questions={orderedQuestions}
          onRestart={restartQuiz}
          unlockRequiredCorrect={unlockRequiredCorrect}
        />
      ) : (
        <div className="rounded-lg border border-orange-200/70 bg-white/55 p-3 text-center text-sm text-orange-950/70 shadow-sm shadow-orange-950/5 backdrop-blur-xl">
          {isPending
            ? "Cevap kontrol ediliyor..."
            : "Sikki secince otomatik sonraki soruya gecilir."}
        </div>
      )}
    </div>
  );
}

function ResultModal({
  backHref,
  flashcardsHref,
  isScored,
  nextTestHref,
  result,
  questions,
  onRestart,
  unlockRequiredCorrect,
}: {
  backHref: string;
  flashcardsHref?: string;
  isScored: boolean;
  nextTestHref?: string | null;
  result: QuizResult;
  questions: QuizPlayQuestion[];
  onRestart: () => void;
  unlockRequiredCorrect?: number | null;
}) {
  const accuracy =
    result.totalQuestions > 0
      ? Math.round((result.correctCount / result.totalQuestions) * 100)
      : 0;
  const tone =
    accuracy >= 75 ? "strong" : accuracy >= 50 ? "medium" : "weak";
  const missedQuestions = questions.filter((question) => {
    const answer = result.answers[question.id];

    return answer && !answer.isCorrect;
  });
  const nextUnlocked =
    isScored &&
    nextTestHref != null &&
    unlockRequiredCorrect != null &&
    result.correctCount >= unlockRequiredCorrect;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/30 p-3 backdrop-blur-md sm:items-center sm:p-4">
      <section
        className={cn(
          "my-4 w-full max-w-2xl rounded-lg border p-4 shadow-xl backdrop-blur sm:my-auto sm:p-5",
          tone === "strong" &&
            "border-emerald-600/40 bg-emerald-50/90 text-emerald-950",
          tone === "medium" &&
            "border-amber-500/40 bg-amber-50/90 text-amber-950",
          tone === "weak" &&
            "border-destructive/40 bg-red-50/90 text-red-950",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium opacity-80">Test sonucu</p>
            <h2 className="mt-1 text-2xl font-semibold">%{accuracy} dogru</h2>
          </div>
          {tone === "strong" ? (
            <CheckCircle2Icon className="size-7 text-emerald-700" />
          ) : (
            <XCircleIcon
              className={cn(
                "size-7",
                tone === "medium" ? "text-amber-700" : "text-destructive",
              )}
            />
          )}
        </div>

        {isScored && nextTestHref ? (
          <div className="mt-4 rounded-md border bg-white/45 p-3 text-sm leading-6">
            {nextUnlocked ? (
              <span>
                Sonraki testi actin. {unlockRequiredCorrect} dogru esigini
                gectin.
              </span>
            ) : (
              <span>
                Sonraki test icin {unlockRequiredCorrect} dogru gerekiyor.
                Tekrar cozerek kilidi acabilirsin.
              </span>
            )}
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <ResultStat label="Dogru" value={result.correctCount} kind="success" />
          <ResultStat label="Yanlis" value={result.wrongCount} kind="danger" />
          <ResultStat label="Bos" value={result.blankCount} />
          <ResultStat label="Toplam" value={result.totalQuestions} />
          {isScored ? (
            <>
              <ResultStat label="Puan" value={result.pointDelta} />
              <ResultStat
                label="Sure"
                value={formatDuration(result.elapsedSeconds)}
              />
            </>
          ) : null}
        </div>

        {missedQuestions.length ? (
          <div className="mt-5 rounded-md border bg-white/45 p-3">
            <h3 className="text-sm font-semibold">Yanlislar ve boslar</h3>
            <div className="mt-3 max-h-[38svh] space-y-3 overflow-y-auto pr-1 sm:max-h-60">
              {missedQuestions.map((question) => {
                const answer = result.answers[question.id];
                const correctOption = question.options.find(
                  (option) => option.id === answer.correctOptionId,
                );

                return (
                  <article key={question.id} className="rounded-md border bg-white/55 p-3">
                    <p className="text-sm font-medium leading-6">
                      {question.prompt}
                    </p>
                    <p className="mt-2 text-xs leading-5 opacity-80">
                      Dogru cevap: {correctOption?.text ?? "Bulunamadi"}
                    </p>
                    {question.explanation ? (
                      <p className="mt-2 text-xs leading-5 opacity-80">
                        {question.explanation}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
          {nextUnlocked ? (
            <Button asChild>
              <Link href={nextTestHref}>Sonraki test</Link>
            </Button>
          ) : null}
          <Button type="button" onClick={onRestart}>
            <RotateCcwIcon />
            Yeniden coz
          </Button>
          {flashcardsHref ? (
            <Button asChild variant="outline">
              <Link href={flashcardsHref}>Bilgi kartlari</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href={backHref}>Geri don</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function ResultStat({
  label,
  value,
  kind,
}: {
  label: string;
  value: number | string;
  kind?: "success" | "danger";
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 flex items-center gap-1 text-lg font-semibold",
          kind === "success" && "text-emerald-700",
          kind === "danger" && "text-destructive",
        )}
      >
        {kind === "success" ? <CheckCircle2Icon className="size-4" /> : null}
        {kind === "danger" ? <XCircleIcon className="size-4" /> : null}
        {value}
      </p>
    </div>
  );
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
