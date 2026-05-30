"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { FlashcardDeckCard } from "@/lib/flashcards/get-flashcards";

type SwipeDeckProps = {
  cards: FlashcardDeckCard[];
};

const swipeThreshold = 76;

export function SwipeDeck({ cards }: SwipeDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isBackVisible, setIsBackVisible] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragX, setDragX] = useState(0);

  const activeCard = cards[activeIndex];
  const progress = useMemo(() => {
    if (!cards.length) return 0;
    return Math.round(((activeIndex + 1) / cards.length) * 100);
  }, [activeIndex, cards.length]);

  const goNext = useCallback(() => {
    setActiveIndex((index) => Math.min(cards.length - 1, index + 1));
    setIsBackVisible(false);
    setDragX(0);
  }, [cards.length]);

  const goPrevious = useCallback(() => {
    setActiveIndex((index) => Math.max(0, index - 1));
    setIsBackVisible(false);
    setDragX(0);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        goNext();
      }

      if (event.key === "ArrowLeft") {
        goPrevious();
      }

      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        setIsBackVisible((value) => !value);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrevious]);

  function finishDrag() {
    if (dragX > swipeThreshold) {
      goNext();
    } else if (dragX < -swipeThreshold) {
      goPrevious();
    } else {
      setDragX(0);
    }

    setDragStartX(null);
  }

  if (!activeCard) {
    return (
      <div className="flex min-h-[58svh] items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Bu konuda yayinda bilgi karti yok.
      </div>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {activeIndex + 1}/{cards.length}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span>{progress}%</span>
      </div>

      <div
        className="relative flex min-h-[58svh] touch-pan-y select-none items-stretch text-left outline-none sm:min-h-[520px] md:pointer-events-none"
        onPointerCancel={finishDrag}
        onPointerDown={(event) => {
          setDragStartX(event.clientX);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (dragStartX == null) return;
          setDragX(event.clientX - dragStartX);
        }}
        onPointerUp={finishDrag}
      >
        <div
          className="absolute inset-0 rounded-xl border bg-background p-6 shadow-lg transition-transform duration-150 ease-out"
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX / 24}deg)`,
          }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-3 text-xs text-muted-foreground">
              <span>{isBackVisible ? "Cevap" : "Soru"}</span>
              {activeCard.hint ? <span>{activeCard.hint}</span> : null}
            </div>

            <div className="flex flex-1 items-center justify-center py-8">
              <p className="text-balance text-center text-2xl font-semibold leading-9 sm:text-3xl sm:leading-10">
                {isBackVisible ? activeCard.back : activeCard.front}
              </p>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              {isBackVisible ? "Kart arka yuzu" : "Kart on yuzu"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[48px_1fr_48px] gap-3 md:hidden">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={goPrevious}
          disabled={activeIndex === 0}
          aria-label="Onceki kart"
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          type="button"
          onClick={() => setIsBackVisible((value) => !value)}
        >
          {isBackVisible ? "Soruyu goster" : "Cevabi goster"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={goNext}
          disabled={activeIndex === cards.length - 1}
          aria-label="Sonraki kart"
        >
          <ChevronRightIcon />
        </Button>
      </div>

      <div className="hidden grid-cols-[1fr_1.2fr_1fr] gap-3 md:grid">
        <Button
          type="button"
          variant="outline"
          onClick={goPrevious}
          disabled={activeIndex === 0}
        >
          Geri
        </Button>
        <Button
          type="button"
          onClick={() => setIsBackVisible((value) => !value)}
        >
          {isBackVisible ? "Soruyu goster" : "Cevabi goster"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={goNext}
          disabled={activeIndex === cards.length - 1}
        >
          Ileri
        </Button>
      </div>
    </section>
  );
}
