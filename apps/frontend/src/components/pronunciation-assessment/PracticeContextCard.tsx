import {
  ChevronLeft,
  ChevronRight,
  Dice5,
  LoaderCircle,
  Mic,
  OctagonMinus,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "../../lib/utils";
import type { PracticePackage, PracticePhrase, SentenceToken } from "./types";
import { FREE_TEXT_MAX_LENGTH } from "./constants";
import { getWordTokenClass } from "./utils";

type PracticeContextCardProps = {
  practicePackages: PracticePackage[];
  selectedPackageIndex: number;
  onSelectPackage: (index: number) => void;
  isFreeMode: boolean;
  availablePhrases: PracticePhrase[];
  selectedPhraseIndex: number;
  onSelectPhrase: (index: number) => void;
  freeModeSentenceInput: string;
  onFreeModeInputChange: (value: string) => void;
  freeModeInputError: string | null;
  sentenceTokens: SentenceToken[];
  selectedPhraseJa?: string;
  onMovePhraseSelection: (direction: "prev" | "next") => void;
  onChooseRandomPhrase: () => void;
  isRecording: boolean;
  isLoading: boolean;
  isSynthesizingSpeech: boolean;
  isPlayingExampleSpeech: boolean;
  referenceText: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayExampleSpeech: () => void;
};

export const PracticeContextCard = ({
  practicePackages,
  selectedPackageIndex,
  onSelectPackage,
  isFreeMode,
  availablePhrases,
  selectedPhraseIndex,
  onSelectPhrase,
  freeModeSentenceInput,
  onFreeModeInputChange,
  freeModeInputError,
  sentenceTokens,
  selectedPhraseJa,
  onMovePhraseSelection,
  onChooseRandomPhrase,
  isRecording,
  isLoading,
  isSynthesizingSpeech,
  isPlayingExampleSpeech,
  referenceText,
  onStartRecording,
  onStopRecording,
  onPlayExampleSpeech,
}: PracticeContextCardProps) => {
  return (
    <Card className="overflow-hidden border-slate-900/10 bg-white/80 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.55)] backdrop-blur dark:border-white/10 dark:bg-slate-900/65">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Sparkles className="size-5 text-orange-500" />
          Practice Context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <span className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Package
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {practicePackages.map((pkg, index) => (
              <button
                key={pkg.topic}
                type="button"
                onClick={() => onSelectPackage(index)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                  index === selectedPackageIndex
                    ? "border-orange-400/50 bg-orange-500 text-white shadow-md shadow-orange-300/50"
                    : "border-slate-300/70 bg-white/90 text-slate-700 hover:border-orange-300 hover:text-orange-700",
                )}
              >
                {pkg.topic}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {isFreeMode ? (
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Sentence Input
              </span>
              <input
                type="text"
                value={freeModeSentenceInput}
                onChange={(event) => onFreeModeInputChange(event.target.value)}
                placeholder="Type an English sentence to assess pronunciation."
                className="w-full rounded-xl border border-slate-300/80 bg-white/90 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              />
              <p className="text-[11px] text-slate-500">
                {freeModeSentenceInput.length}/{FREE_TEXT_MAX_LENGTH}
              </p>
              {freeModeInputError && (
                <p className="text-xs font-medium text-rose-600">{freeModeInputError}</p>
              )}
            </label>
          ) : (
            <label className="space-y-1.5">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Sentence
              </span>
              <select
                value={selectedPhraseIndex}
                onChange={(event) => onSelectPhrase(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-300/80 bg-white/90 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              >
                {availablePhrases.map((phrase, index) => (
                  <option key={`${index}-${phrase.en}`} value={index}>
                    {index + 1}. {phrase.en}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-orange-500 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-white uppercase">
              Read This
            </span>
            {!isFreeMode && (
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={() => onMovePhraseSelection("prev")}
                  variant="outline"
                  size="sm"
                  className="h-8 border-slate-300/80 bg-white/90 px-2.5 text-xs"
                >
                  <ChevronLeft className="size-3.5" />
                  Prev.
                </Button>
                <Button
                  onClick={onChooseRandomPhrase}
                  variant="outline"
                  size="sm"
                  className="h-8 border-slate-300/80 bg-white/90 px-3 text-xs"
                >
                  <Dice5 className="size-3.5" />
                  Random
                </Button>
                <Button
                  onClick={() => onMovePhraseSelection("next")}
                  variant="outline"
                  size="sm"
                  className="h-8 border-slate-300/80 bg-white/90 px-2.5 text-xs"
                >
                  Next
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-orange-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
              {sentenceTokens.length > 0 ? (
                sentenceTokens.map((item, index) => (
                  <span
                    key={`${item.token}-${index}`}
                    className={cn(
                      "inline-flex flex-col items-center text-center",
                      getWordTokenClass(item.assessment),
                    )}
                  >
                    <span className="text-lg font-bold leading-tight sm:text-xl">{item.token}</span>
                    {item.assessment && (
                      <span className="mt-0.5 text-[10px] font-semibold opacity-70">
                        {item.assessment.accuracyScore.toFixed(0)}
                      </span>
                    )}
                  </span>
                ))
              ) : (
                <span className="text-xl font-semibold leading-relaxed tracking-wide text-slate-300 sm:text-1xl">
                  ☝️上部の入力欄に自由に英文を入力してください
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600">
            {isFreeMode
              ? "Free Mode: 英文を入力して発音評価できます"
              : (selectedPhraseJa ?? "日本語訳はありません")}
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-7">
            {!isRecording ? (
              <Button
                onClick={onStartRecording}
                disabled={
                  isLoading ||
                  isSynthesizingSpeech ||
                  isPlayingExampleSpeech ||
                  !referenceText ||
                  Boolean(freeModeInputError)
                }
                size="lg"
                className="h-12 rounded-full bg-emerald-600 px-8 text-base text-white shadow-lg shadow-emerald-500/35 hover:bg-emerald-500"
              >
                <Mic className="size-4" />
                Speak
              </Button>
            ) : (
              <Button
                onClick={onStopRecording}
                size="lg"
                className="h-12 rounded-full bg-rose-600 px-8 text-base text-white shadow-lg shadow-rose-500/35 hover:bg-rose-500"
              >
                <OctagonMinus className="size-4" />
                Stop
              </Button>
            )}

            <Button
              onClick={onPlayExampleSpeech}
              disabled={isLoading || isRecording || !referenceText || Boolean(freeModeInputError)}
              size="lg"
              className={cn(
                "h-12 rounded-full px-8 text-base text-white shadow-lg",
                isPlayingExampleSpeech
                  ? "bg-slate-700 shadow-slate-500/35 hover:bg-slate-600"
                  : "bg-sky-600 shadow-sky-500/35 hover:bg-sky-500",
              )}
            >
              {isSynthesizingSpeech ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : isPlayingExampleSpeech ? (
                <VolumeX className="size-4" />
              ) : (
                <Volume2 className="size-4" />
              )}
              {isPlayingExampleSpeech ? "Stop" : "Listen"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
