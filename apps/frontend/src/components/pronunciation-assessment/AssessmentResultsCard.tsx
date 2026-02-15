import { CircleHelp, LoaderCircle, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AssessmentResult } from "../../../../../packages/shared/types/assessment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getScoreColor } from "../../lib/assessment/labels";
import { cn } from "../../lib/utils";
import { synthesizeExampleSpeech } from "../../services/assessmentApi";
import { SCORE_LABELS, WORD_PHONEME_HELP_TEXT } from "./constants";
import { getPhonemeBadgeClass, getScoreBarClass } from "./utils";

type AssessmentResultsCardProps = {
  result: AssessmentResult;
};

export const AssessmentResultsCard = ({ result }: AssessmentResultsCardProps) => {
  const [isSynthesizingWordAudio, setIsSynthesizingWordAudio] = useState(false);
  const [playingWordKey, setPlayingWordKey] = useState<string | null>(null);
  const [wordAudioError, setWordAudioError] = useState<string | null>(null);
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopWordAudio = useCallback((): void => {
    const audio = wordAudioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.onended = null;
    audio.onerror = null;

    const sourceUrl = audio.src;
    wordAudioRef.current = null;

    if (sourceUrl.startsWith("blob:")) {
      URL.revokeObjectURL(sourceUrl);
    }

    setPlayingWordKey(null);
  }, []);

  const playWordAudio = useCallback(
    async (wordText: string, wordKey: string): Promise<void> => {
      if (playingWordKey === wordKey) {
        stopWordAudio();
        return;
      }

      setWordAudioError(null);
      setIsSynthesizingWordAudio(true);

      try {
        const audioBlob = await synthesizeExampleSpeech(wordText);
        const audioUrl = URL.createObjectURL(audioBlob);

        stopWordAudio();

        const audio = new Audio(audioUrl);
        wordAudioRef.current = audio;

        audio.onended = () => {
          if (audioUrl.startsWith("blob:")) {
            URL.revokeObjectURL(audioUrl);
          }
          if (wordAudioRef.current === audio) {
            wordAudioRef.current = null;
          }
          setPlayingWordKey(null);
        };

        audio.onerror = () => {
          if (audioUrl.startsWith("blob:")) {
            URL.revokeObjectURL(audioUrl);
          }
          if (wordAudioRef.current === audio) {
            wordAudioRef.current = null;
          }
          setPlayingWordKey(null);
          setWordAudioError("Failed to play word audio.");
        };

        await audio.play();
        setPlayingWordKey(wordKey);
      } catch (caught) {
        stopWordAudio();
        setWordAudioError(caught instanceof Error ? caught.message : "Failed to synthesize word");
      } finally {
        setIsSynthesizingWordAudio(false);
      }
    },
    [playingWordKey, stopWordAudio],
  );

  useEffect(() => () => stopWordAudio(), [stopWordAudio]);

  return (
    <Card className="border-slate-900/10 bg-white/90 shadow-2xl dark:border-white/10 dark:bg-slate-950/70">
      <CardHeader>
        <CardTitle>Assessment Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="text-xs tracking-[0.2em] text-slate-500 uppercase">Overall Score</div>
          <div className={`mt-2 text-6xl font-black ${getScoreColor(result.scores.pronScore)}`}>
            {result.scores.pronScore.toFixed(1)}
          </div>
          <div className="text-sm text-slate-500">out of 100</div>
        </div>

        <div className="space-y-4">
          {SCORE_LABELS.map((score) => (
            <div key={score.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {score.label}
                  </span>
                  <div className="group relative inline-flex items-center">
                    <button
                      type="button"
                      aria-label={`${score.label} help`}
                      title={score.helpText}
                      className="inline-flex size-4 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 transition-colors hover:border-sky-400 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                    >
                      <CircleHelp className="size-3" />
                    </button>
                    <div className="pointer-events-none absolute top-6 left-1/2 z-20 w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-2.5 text-xs leading-relaxed text-slate-700 opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                      {score.helpText}
                    </div>
                  </div>
                </div>
                <span className={`font-semibold ${getScoreColor(result.scores[score.key])}`}>
                  {result.scores[score.key].toFixed(1)}
                </span>
              </div>
              <Progress
                value={result.scores[score.key]}
                className={`h-2.5 ${getScoreBarClass(result.scores[score.key])}`}
              />
            </div>
          ))}
        </div>

        {result.words.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-[0.14em] text-slate-500 uppercase">
                Word / Phoneme Breakdown
              </h3>
              <div className="group relative inline-flex items-center">
                <button
                  type="button"
                  aria-label="Word / Phoneme score help"
                  title={WORD_PHONEME_HELP_TEXT}
                  className="inline-flex size-5 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 transition-colors hover:border-sky-400 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  <CircleHelp className="size-3.5" />
                </button>
                <div className="pointer-events-none absolute top-7 left-1/2 z-20 w-72 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-2.5 text-xs leading-relaxed text-slate-700 opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                  {WORD_PHONEME_HELP_TEXT}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {result.words.map((word, index) => {
                const wordKey = `${word.word}-${index}`;
                const isCurrentWordPlaying = playingWordKey === wordKey;
                return (
                  <div key={wordKey} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{word.word}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => playWordAudio(word.word, wordKey)}
                          disabled={isSynthesizingWordAudio}
                          className="h-8 border-slate-300/80 bg-white/90 px-3 text-xs"
                        >
                          {isSynthesizingWordAudio && !isCurrentWordPlaying ? (
                            <LoaderCircle className="size-3.5 animate-spin" />
                          ) : isCurrentWordPlaying ? (
                            <VolumeX className="size-3.5" />
                          ) : (
                            <Volume2 className="size-3.5" />
                          )}
                          {isCurrentWordPlaying ? "Stop" : "Listen"}
                        </Button>
                      </div>
                      <span
                        className={`text-sm font-semibold ${getScoreColor(word.accuracyScore)}`}
                      >
                        {word.accuracyScore.toFixed(1)}
                      </span>
                    </div>
                    {word.phonemes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {word.phonemes.map((phoneme, phonemeIndex) => (
                          <span
                            key={`${phoneme.phoneme}-${phonemeIndex}`}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                              getPhonemeBadgeClass(phoneme.accuracyScore),
                            )}
                          >
                            <span>{phoneme.phoneme}</span>
                            <span>{phoneme.accuracyScore.toFixed(0)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {wordAudioError && (
              <p className="text-xs font-medium text-rose-600">{wordAudioError}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
