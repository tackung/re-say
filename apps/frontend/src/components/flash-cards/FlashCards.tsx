import { ChevronLeft, ChevronRight, LoaderCircle, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { synthesizeExampleSpeech } from "@/services/assessmentApi";
import { ankiPackages } from "./content";

const SWIPE_THRESHOLD_PX = 64;
const TAP_MOVEMENT_THRESHOLD_PX = 10;

type PointerStart = {
  x: number;
  y: number;
};

function FlashCards() {
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(0);
  const packageEntry = ankiPackages[selectedPackageIndex] ?? ankiPackages[0];
  const phrases = useMemo(() => packageEntry?.phrases ?? [], [packageEntry?.phrases]);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSynthesizingSpeech, setIsSynthesizingSpeech] = useState(false);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const pointerStartRef = useRef<PointerStart | null>(null);
  const speechAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechRequestIdRef = useRef(0);

  const currentPhrase = phrases[cardIndex];
  const totalCards = phrases.length;
  const primaryText = isFlipped ? currentPhrase?.answer : currentPhrase?.question;
  const translationText = isFlipped ? currentPhrase?.answerJa : currentPhrase?.questionJa;

  const stopSpeech = useCallback((): void => {
    const audio = speechAudioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.onended = null;
    audio.onerror = null;

    const sourceUrl = audio.src;
    speechAudioRef.current = null;

    if (sourceUrl.startsWith("blob:")) {
      URL.revokeObjectURL(sourceUrl);
    }

    setIsPlayingSpeech(false);
  }, []);

  const cancelSpeech = useCallback((): void => {
    speechRequestIdRef.current += 1;
    stopSpeech();
    setIsSynthesizingSpeech(false);
  }, [stopSpeech]);

  const moveCard = useCallback(
    (direction: "prev" | "next"): void => {
      if (totalCards === 0) {
        return;
      }

      cancelSpeech();
      setError(null);
      setIsFlipped(false);
      setCardIndex((current) => {
        if (direction === "prev") {
          return current === 0 ? totalCards - 1 : current - 1;
        }

        return current === totalCards - 1 ? 0 : current + 1;
      });
    },
    [cancelSpeech, totalCards],
  );

  const selectPackage = (index: number): void => {
    if (index === selectedPackageIndex) {
      return;
    }

    cancelSpeech();
    setSelectedPackageIndex(index);
    setCardIndex(0);
    setIsFlipped(false);
    setError(null);
  };

  const playSpeech = async (): Promise<void> => {
    if (isPlayingSpeech) {
      stopSpeech();
      return;
    }

    if (!currentPhrase) {
      setError("No flash card is available.");
      return;
    }

    setError(null);
    setIsSynthesizingSpeech(true);

    const requestId = speechRequestIdRef.current + 1;
    speechRequestIdRef.current = requestId;

    try {
      const audioBlob = await synthesizeExampleSpeech(currentPhrase.answer);

      if (speechRequestIdRef.current !== requestId) {
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);

      stopSpeech();

      const audio = new Audio();
      audio.preload = "auto";
      audio.setAttribute("playsinline", "true");
      audio.src = audioUrl;
      speechAudioRef.current = audio;

      audio.onended = () => {
        if (audioUrl.startsWith("blob:")) {
          URL.revokeObjectURL(audioUrl);
        }
        if (speechAudioRef.current === audio) {
          speechAudioRef.current = null;
        }
        setIsPlayingSpeech(false);
      };

      audio.onerror = () => {
        if (audioUrl.startsWith("blob:")) {
          URL.revokeObjectURL(audioUrl);
        }
        if (speechAudioRef.current === audio) {
          speechAudioRef.current = null;
        }
        setIsPlayingSpeech(false);
        setError("Failed to play answer speech.");
      };

      audio.load();
      await audio.play();
      setIsPlayingSpeech(true);
    } catch (caught) {
      if (speechRequestIdRef.current !== requestId) {
        return;
      }

      stopSpeech();
      setError(caught instanceof Error ? caught.message : "Failed to synthesize answer speech.");
    } finally {
      if (speechRequestIdRef.current === requestId) {
        setIsSynthesizingSpeech(false);
      }
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>): void => {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>): void => {
    const pointerStart = pointerStartRef.current;
    pointerStartRef.current = null;

    if (!pointerStart) {
      return;
    }

    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX >= SWIPE_THRESHOLD_PX && absX > absY * 1.25) {
      moveCard(deltaX < 0 ? "next" : "prev");
      return;
    }

    if (absX <= TAP_MOVEMENT_THRESHOLD_PX && absY <= TAP_MOVEMENT_THRESHOLD_PX) {
      setIsFlipped((current) => !current);
    }
  };

  const handlePointerCancel = (): void => {
    pointerStartRef.current = null;
  };

  useEffect(() => () => cancelSpeech(), [cancelSpeech]);

  if (!packageEntry || !currentPhrase) {
    return (
      <Alert>
        <RotateCcw className="size-4" />
        <AlertTitle>No flash cards</AlertTitle>
        <AlertDescription>
          Add at least one valid anki package with question and answer pairs.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-[minmax(0,26rem)_1fr] md:items-end">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Topic
          </span>
          <select
            value={selectedPackageIndex}
            onChange={(event) => selectPackage(Number(event.target.value))}
            className="w-full rounded-xl border border-slate-300/80 bg-white/90 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
          >
            {ankiPackages.map((entry, index) => (
              <option key={entry.topic} value={index}>
                {entry.topic}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1 md:items-end">
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
            Current card
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              {packageEntry.topic}
            </h1>
            <p className="text-sm font-semibold text-slate-600">
              {cardIndex + 1} / {totalCards}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="group block w-full touch-pan-y rounded-xl text-left outline-none focus-visible:ring-[3px] focus-visible:ring-orange-300"
        aria-label={isFlipped ? "Show question" : "Show answer"}
      >
        <Card className="min-h-[22rem] overflow-hidden border-slate-900/10 bg-white/85 py-0 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.55)] transition-transform duration-200 group-active:scale-[0.99] dark:border-white/10 dark:bg-slate-900/70">
          <CardContent className="flex min-h-[22rem] flex-col justify-between gap-8 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold tracking-[0.14em] uppercase",
                  isFlipped ? "bg-cyan-100 text-cyan-800" : "bg-orange-100 text-orange-800",
                )}
              >
                {isFlipped ? "Answer" : "Question"}
              </span>
              <span className="text-xs font-medium text-slate-400">
                {isFlipped ? "Tap to return" : "Tap to reveal"}
              </span>
            </div>

            <div className="flex flex-1 items-center">
              <div className="w-full space-y-5 text-center">
                <p
                  className={cn(
                    "text-balance font-bold leading-tight tracking-normal text-slate-950",
                    isFlipped ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl",
                  )}
                >
                  {primaryText}
                </p>
                <p className="mx-auto max-w-3xl text-balance text-base font-normal leading-relaxed text-slate-600 sm:text-lg">
                  {translationText}
                </p>
              </div>
            </div>

            <div className="text-center text-xs font-medium text-slate-500">
              Swipe left for next. Swipe right for previous.
            </div>
          </CardContent>
        </Card>
      </button>

      <div className="grid grid-cols-3 gap-2 sm:mx-auto sm:max-w-lg sm:gap-3">
        <Button
          type="button"
          onClick={() => moveCard("prev")}
          size="lg"
          variant="outline"
          className="h-12 rounded-full border-slate-300/80 bg-white/90 px-3 text-sm shadow-sm"
        >
          <ChevronLeft className="size-4" />
          Prev
        </Button>
        <Button
          type="button"
          onClick={playSpeech}
          disabled={isSynthesizingSpeech}
          size="lg"
          className={cn(
            "h-12 rounded-full px-3 text-sm text-white shadow-lg",
            isPlayingSpeech
              ? "bg-slate-700 shadow-slate-500/35 hover:bg-slate-600"
              : "bg-sky-600 shadow-sky-500/35 hover:bg-sky-500",
          )}
        >
          {isSynthesizingSpeech ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : isPlayingSpeech ? (
            <VolumeX className="size-4" />
          ) : (
            <Volume2 className="size-4" />
          )}
          Speak
        </Button>
        <Button
          type="button"
          onClick={() => moveCard("next")}
          size="lg"
          variant="outline"
          className="h-12 rounded-full border-slate-300/80 bg-white/90 px-3 text-sm shadow-sm"
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <VolumeX className="size-4" />
          <AlertTitle>Speech failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default FlashCards;
