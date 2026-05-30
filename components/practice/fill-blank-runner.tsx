"use client";

import {
  CheckCircle2Icon,
  ClockIcon,
  LightbulbIcon,
  RotateCcwIcon,
  XIcon,
  XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  guessFillBlankLetterAction,
  revealFillBlankAnswerAction,
} from "@/app/(actions)/actions/practice/fill-blank";
import { Button } from "@/components/ui/button";
import type { FillBlankQuestion } from "@/lib/practice/get-fill-blank";
import { cn } from "@/lib/utils";

const MAX_WRONG_GUESSES = 6;
const LETTERS = [
  "A",
  "B",
  "C",
  "Ç",
  "D",
  "E",
  "F",
  "G",
  "Ğ",
  "H",
  "I",
  "İ",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "Ö",
  "P",
  "R",
  "S",
  "Ş",
  "T",
  "U",
  "Ü",
  "V",
  "Y",
  "Z",
];

type FillBlankRunnerProps = {
  title: string;
  questions: FillBlankQuestion[];
  backHref?: string;
};

type AnswerResult = {
  questionId: string;
  prompt: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string | null;
  wrongGuesses: number;
};

export function FillBlankRunner({
  title,
  questions,
  backHref = "/fill-blanks",
}: FillBlankRunnerProps) {
  const initialQuestions = useMemo(() => shuffle(questions), [questions]);
  const [orderedQuestions, setOrderedQuestions] = useState(() =>
    initialQuestions,
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState<string[]>(() =>
    splitMask(initialQuestions[0]?.answerMask ?? ""),
  );
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    questions.reduce((total, question) => total + question.timeLimitSeconds, 0),
  );
  const [isFinished, setIsFinished] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentQuestion = orderedQuestions[currentIndex];
  const totalSeconds = useMemo(
    () =>
      orderedQuestions.reduce(
        (total, question) => total + question.timeLimitSeconds,
        0,
      ),
    [orderedQuestions],
  );
  const correctCount = results.filter((result) => result.isCorrect).length;
  const wrongCount = results.filter((result) => !result.isCorrect).length;
  const remainingRights = MAX_WRONG_GUESSES - wrongGuesses;
  const isSolved =
    currentQuestion != null && isFullyRevealed(revealed, currentQuestion.answerMask);

  const finishRemainingAsWrong = useCallback(() => {
    const answeredIds = new Set(results.map((result) => result.questionId));
    const blankResults = orderedQuestions
      .filter((question) => !answeredIds.has(question.id))
      .map((question) => ({
        questionId: question.id,
        prompt: question.prompt,
        isCorrect: false,
        correctAnswer: "Sure bitti",
        explanation: null,
        wrongGuesses: MAX_WRONG_GUESSES,
      }));

    setResults((items) => [...items, ...blankResults]);
    setIsFinished(true);
  }, [orderedQuestions, results]);

  useEffect(() => {
    if (isFinished || isPending) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          finishRemainingAsWrong();
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [finishRemainingAsWrong, isFinished, isPending]);

  function guessLetter(letter: string) {
    if (
      !currentQuestion ||
      isPending ||
      isFinished ||
      guessedLetters.includes(letter)
    ) {
      return;
    }

    setMessage(null);
    setGuessedLetters((letters) => [...letters, letter]);

    startTransition(async () => {
      const response = await guessFillBlankLetterAction({
        questionId: currentQuestion.id,
        topicSlug: currentQuestion.topicSlug,
        letter,
      });

      if (!response.ok) {
        setMessage(response.message);
        setGuessedLetters((letters) =>
          letters.filter((guessed) => guessed !== letter),
        );
        return;
      }

      if (response.isMatch) {
        setFeedback("correct");
        setRevealed((chars) => {
          const next = [...chars];

          for (const match of response.matches) {
            next[match.position] = match.character;
          }

          const solved = isFullyRevealed(next, currentQuestion.answerMask);

          if (solved) {
            window.setTimeout(() => completeCurrentQuestion(true), 650);
          }

          return next;
        });
        window.setTimeout(() => setFeedback(null), 450);
        return;
      }

      setFeedback("wrong");
      setWrongGuesses((value) => {
        const nextWrongGuesses = value + 1;

        if (nextWrongGuesses >= MAX_WRONG_GUESSES) {
          window.setTimeout(() => completeCurrentQuestion(false), 650);
        }

        return nextWrongGuesses;
      });
      window.setTimeout(() => setFeedback(null), 450);
    });
  }

  function completeCurrentQuestion(isCorrect: boolean) {
    if (!currentQuestion) {
      return;
    }

    startTransition(async () => {
      const response = await revealFillBlankAnswerAction({
        questionId: currentQuestion.id,
        topicSlug: currentQuestion.topicSlug,
      });

      const result: AnswerResult = {
        questionId: currentQuestion.id,
        prompt: currentQuestion.prompt,
        isCorrect,
        correctAnswer: response.ok ? response.correctAnswer : "Gosterilemedi",
        explanation: response.ok ? response.explanation : null,
        wrongGuesses,
      };

      setResults((items) => [...items, result]);
      advanceToNextQuestion();
    });
  }

  function skipQuestion() {
    completeCurrentQuestion(false);
  }

  function advanceToNextQuestion() {
    setFeedback(null);
    setMessage(null);
    setGuessedLetters([]);
    setWrongGuesses(0);

    setCurrentIndex((index) => {
      if (index >= orderedQuestions.length - 1) {
        setIsFinished(true);
        return index;
      }

      const nextIndex = index + 1;
      setRevealed(splitMask(orderedQuestions[nextIndex]?.answerMask ?? ""));

      return nextIndex;
    });
  }

  function restart() {
    const nextQuestions = shuffle(questions);

    setOrderedQuestions(nextQuestions);
    setCurrentIndex(0);
    setRevealed(splitMask(nextQuestions[0]?.answerMask ?? ""));
    setGuessedLetters([]);
    setWrongGuesses(0);
    setResults([]);
    setFeedback(null);
    setMessage(null);
    setRemainingSeconds(
      nextQuestions.reduce(
        (total, question) => total + question.timeLimitSeconds,
        0,
      ),
    );
    setIsFinished(false);
  }

  if (orderedQuestions.length === 0 || !currentQuestion) {
    return (
      <div className="rounded-lg border border-dashed border-orange-200 p-6 text-sm text-orange-900/60">
        Bu konu icin yayinda kelime tahmini sorusu yok.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3" aria-label={title}>
      <section className="rounded-lg border border-orange-200/80 bg-white/65 p-3 shadow-lg shadow-orange-950/5 backdrop-blur-xl sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2 rounded-md border border-orange-200/70 bg-white/55 px-2.5 py-2 text-xs text-orange-950/70 sm:px-3">
          <span className="font-medium">
            {currentIndex + 1}/{orderedQuestions.length}
          </span>
          <span className="text-emerald-700">Dogru {correctCount}</span>
          <span className={remainingRights <= 2 ? "text-red-700" : undefined}>
            Hak {remainingRights}
          </span>
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="size-3" />
            {formatDuration(Math.max(0, remainingSeconds))}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs text-orange-900/55">
            {currentQuestion.topicTitle}
          </p>
          <h2 className="text-base font-semibold leading-6 sm:text-lg sm:leading-7">
            {currentQuestion.prompt}
          </h2>
        </div>

        {currentQuestion.hint ? (
          <div className="mt-3 flex gap-2 rounded-lg border border-orange-200/70 bg-orange-50/70 p-2.5 text-sm leading-5 text-orange-950 sm:p-3 sm:leading-6">
            <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-orange-700" />
            <span>{currentQuestion.hint}</span>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap justify-center gap-1.5 rounded-lg border border-orange-200/70 bg-white/55 p-3 sm:gap-2 sm:p-4">
          {revealed.map((char, index) => (
            <span
              key={`${currentQuestion.id}-${index}`}
              className={cn(
                "flex h-10 min-w-8 items-center justify-center rounded-md border border-orange-200 bg-white/80 px-2 text-lg font-semibold shadow-sm sm:h-11 sm:min-w-9 sm:text-xl",
                char === " " && "border-transparent bg-transparent shadow-none",
                char !== "_" && char !== " " && "text-orange-950",
              )}
            >
              {char === " " ? "\u00a0" : char}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5 sm:grid-cols-10 sm:gap-2">
          {LETTERS.map((letter) => {
            const isGuessed = guessedLetters.includes(letter);

            return (
              <button
                key={letter}
                type="button"
                disabled={isGuessed || isPending || isFinished || isSolved}
                onClick={() => guessLetter(letter)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md border border-orange-200 bg-white/75 text-sm font-semibold shadow-sm transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-45",
                  isGuessed && "bg-orange-100 text-orange-950",
                )}
              >
                {letter}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p
            className={cn(
              "text-sm font-medium",
              feedback === "correct" && "text-emerald-700",
              feedback === "wrong" && "text-red-700",
              !feedback && "text-orange-900/60",
            )}
          >
            {feedback === "correct"
              ? "Harf var"
              : feedback === "wrong"
                ? "Harf yok"
                : `Yanlis hakki: ${remainingRights}/${MAX_WRONG_GUESSES}`}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || isFinished}
            onClick={skipQuestion}
          >
            Pas gec
          </Button>
        </div>

        {message ? <p className="mt-3 text-sm text-destructive">{message}</p> : null}
      </section>

      {isFinished ? (
        <ResultPanel
          backHref={backHref}
          correctCount={correctCount}
          elapsedSeconds={Math.max(0, totalSeconds - remainingSeconds)}
          results={results}
          totalQuestions={orderedQuestions.length}
          wrongCount={wrongCount}
          onRestart={restart}
        />
      ) : null}
    </div>
  );
}

function ResultPanel({
  backHref,
  correctCount,
  elapsedSeconds,
  results,
  totalQuestions,
  wrongCount,
  onRestart,
}: {
  backHref: string;
  correctCount: number;
  elapsedSeconds: number;
  results: AnswerResult[];
  totalQuestions: number;
  wrongCount: number;
  onRestart: () => void;
}) {
  const accuracy =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const tone =
    accuracy >= 75 ? "strong" : accuracy >= 50 ? "medium" : "weak";
  const missed = results.filter((result) => !result.isCorrect);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-orange-950/30 p-3 backdrop-blur-md sm:items-center sm:p-4">
      <section
        className={cn(
          "my-4 w-full max-w-2xl rounded-lg border p-4 shadow-xl backdrop-blur-xl sm:my-auto sm:p-5",
          tone === "strong" &&
            "border-emerald-600/40 bg-emerald-50/92 text-emerald-950",
          tone === "medium" &&
            "border-orange-500/50 bg-orange-50/92 text-orange-950",
          tone === "weak" && "border-red-500/40 bg-red-50/92 text-red-950",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium opacity-80">
              Kelime tahmini sonucu
            </p>
            <h2 className="mt-1 text-2xl font-semibold">%{accuracy} dogru</h2>
          </div>
          <div className="flex items-center gap-2">
            {tone === "strong" ? (
              <CheckCircle2Icon className="size-7 text-emerald-700" />
            ) : (
              <XCircleIcon
                className={cn(
                  "size-7",
                  tone === "medium" ? "text-orange-700" : "text-red-700",
                )}
              />
            )}
            <Button asChild variant="ghost" size="icon" aria-label="Kapat">
              <Link href={backHref}>
                <XIcon />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <ResultStat label="Dogru" value={correctCount} />
          <ResultStat label="Yanlis" value={wrongCount} />
          <ResultStat label="Toplam" value={totalQuestions} />
          <ResultStat label="Sure" value={formatDuration(elapsedSeconds)} />
        </div>

        {missed.length ? (
          <div className="mt-5 rounded-md border bg-white/45 p-3">
            <h3 className="text-sm font-semibold">Tekrar bakilacaklar</h3>
            <div className="mt-3 max-h-[38svh] space-y-3 overflow-y-auto pr-1 sm:max-h-60">
              {missed.map((item) => (
                <article key={item.questionId} className="rounded-md border bg-white/55 p-3">
                  <p className="text-sm font-medium leading-6">{item.prompt}</p>
                  <p className="mt-2 text-xs leading-5 opacity-80">
                    Dogru cevap: {item.correctAnswer}
                  </p>
                  {item.explanation ? (
                    <p className="mt-2 text-xs leading-5 opacity-80">
                      {item.explanation}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
          <Button type="button" onClick={onRestart}>
            <RotateCcwIcon />
            Yeniden coz
          </Button>
          <Button asChild variant="outline">
            <Link href={backHref}>Konu sec</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Ana sayfa</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function ResultStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs opacity-70">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function splitMask(mask: string) {
  return Array.from(mask ?? "");
}

function isFullyRevealed(chars: string[], mask?: string | null) {
  if (!mask) {
    return false;
  }

  const maskChars = splitMask(mask);

  return (
    maskChars.length > 0 &&
    chars.length === maskChars.length &&
    maskChars.every((maskChar, index) => maskChar !== "_" || chars[index] !== "_")
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
