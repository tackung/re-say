import { ChevronLeft, ChevronRight, Dice5, Mic, OctagonMinus, Sparkles, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AssessmentApiResponse, AssessmentResult, WordAssessment } from "../../../../packages/shared/types/assessment";
import { convertToWav } from "../lib/audio/wavConverter";
import { cn } from "../lib/utils";
import { assessPronunciation } from "../services/assessmentApi";
import contents from "../data/contents.json";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type PracticePhrase = {
  en: string;
  ja: string;
};

type PracticePackage = {
  topic: string;
  phrases: PracticePhrase[];
};

type PracticeContents = {
  packages: PracticePackage[];
};

const practiceContents = contents as PracticeContents;
const practicePackages = practiceContents.packages.filter((entry) => entry.phrases.length > 0);
const initialPackageIndex = practicePackages.length > 0 ? 0 : -1;

type SentenceToken = {
  token: string;
  assessment?: WordAssessment;
};

const normalizeWord = (value: string): string => value.toLowerCase().replace(/[^a-z0-9']/g, "");

const buildSentenceTokens = (referenceText: string, words: WordAssessment[]): SentenceToken[] => {
  const tokens = referenceText.split(/\s+/).filter(Boolean);
  let cursor = 0;

  return tokens.map((token) => {
    const tokenNormalized = normalizeWord(token);
    if (!tokenNormalized) {
      return { token };
    }

    let matchedAssessment: WordAssessment | undefined;
    for (let offset = 0; offset < 3; offset += 1) {
      const candidate = words[cursor + offset];
      if (!candidate) {
        break;
      }
      if (normalizeWord(candidate.word) === tokenNormalized) {
        matchedAssessment = candidate;
        cursor += offset + 1;
        break;
      }
    }

    return { token, assessment: matchedAssessment };
  });
};

const getSupportedMimeType = (): string => {
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
    return "audio/ogg;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/mp4")) {
    return "audio/mp4";
  }
  return "audio/webm";
};

const PronunciationAssessment = () => {
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(initialPackageIndex);
  const [selectedPhraseIndex, setSelectedPhraseIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(18);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const selectedPackage =
    selectedPackageIndex >= 0 ? practicePackages[selectedPackageIndex] : undefined;
  const availablePhrases = selectedPackage?.phrases ?? [];
  const selectedPhrase =
    availablePhrases.length > 0 ? availablePhrases[Math.min(selectedPhraseIndex, availablePhrases.length - 1)] : undefined;
  const referenceText = selectedPhrase?.en ?? "";
  const sentenceTokens = useMemo(
    () => buildSentenceTokens(referenceText, result?.words ?? []),
    [referenceText, result?.words],
  );

  const movePhraseSelection = (direction: "prev" | "next"): void => {
    if (availablePhrases.length === 0) {
      return;
    }

    setSelectedPhraseIndex((current) => {
      if (direction === "prev") {
        return current === 0 ? availablePhrases.length - 1 : current - 1;
      }
      return current === availablePhrases.length - 1 ? 0 : current + 1;
    });
  };

  const chooseRandomPhrase = (): void => {
    if (availablePhrases.length === 0) {
      return;
    }
    const randomIndex = Math.floor(Math.random() * availablePhrases.length);
    setSelectedPhraseIndex(randomIndex);
  };

  const processAudio = async (audioBlob: Blob): Promise<void> => {
    if (!referenceText) {
      setError("Practice sentence is not selected.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const wavBlob = await convertToWav(audioBlob);
      const data: AssessmentApiResponse = await assessPronunciation(wavBlob, referenceText);

      if (data.status === "error") {
        throw new Error(data.error);
      }

      setResult(data.result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to process audio");
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await processAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      setResult(null);
    } catch {
      setError("Failed to access microphone. Please check your permissions.");
    }
  };

  const stopRecording = (): void => {
    if (!mediaRecorderRef.current || !isRecording) {
      return;
    }

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  useEffect(() => {
    if (!isLoading) {
      setLoadingProgress(18);
      return;
    }

    const intervalId = window.setInterval(() => {
      setLoadingProgress((previous) => (previous >= 86 ? 18 : previous + 12));
    }, 420);

    return () => window.clearInterval(intervalId);
  }, [isLoading]);

  useEffect(() => {
    setSelectedPhraseIndex(0);
    setResult(null);
    setError(null);
  }, [selectedPackageIndex]);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [selectedPhraseIndex]);

  const getScoreToneClass = (score: number): string => {
    if (score >= 80) {
      return "text-emerald-600 dark:text-emerald-400";
    }
    if (score >= 60) {
      return "text-amber-600 dark:text-amber-400";
    }
    return "text-rose-600 dark:text-rose-400";
  };

  const getScoreBarClass = (score: number): string => {
    if (score >= 80) {
      return "[&>div]:bg-emerald-500";
    }
    if (score >= 60) {
      return "[&>div]:bg-amber-500";
    }
    return "[&>div]:bg-rose-500";
  };

  const getWordTokenClass = (assessment?: WordAssessment): string => {
    if (!assessment) {
      return "text-slate-700";
    }
    if (assessment.errorType !== "None" || assessment.accuracyScore < 60) {
      return "text-rose-700";
    }
    if (assessment.accuracyScore < 80) {
      return "text-amber-700";
    }
    return "text-emerald-700";
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-900/10 bg-white/80 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.55)] backdrop-blur dark:border-white/10 dark:bg-slate-900/65">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="size-5 text-orange-500" />
            Practice Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">Package</span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {practicePackages.map((pkg, index) => (
                <button
                  key={pkg.topic}
                  type="button"
                  onClick={() => setSelectedPackageIndex(index)}
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
            <label className="space-y-1.5">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">Sentence</span>
              <select
                value={selectedPhraseIndex}
                onChange={(event) => setSelectedPhraseIndex(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-300/80 bg-white/90 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              >
                {availablePhrases.map((phrase, index) => (
                  <option key={`${index}-${phrase.en}`} value={index}>
                    {index + 1}. {phrase.en}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-orange-500 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-white uppercase">
                Read This
              </span>
              <div className="flex items-center gap-1.5">
                <Button onClick={() => movePhraseSelection("prev")} variant="outline" size="sm" className="h-8 border-slate-300/80 bg-white/90 px-2.5 text-xs">
                  <ChevronLeft className="size-3.5" />
                  Prev.
                </Button>
                <Button onClick={chooseRandomPhrase} variant="outline" size="sm" className="h-8 border-slate-300/80 bg-white/90 px-3 text-xs">
                  <Dice5 className="size-3.5" />
                  Random
                </Button>
                <Button onClick={() => movePhraseSelection("next")} variant="outline" size="sm" className="h-8 border-slate-300/80 bg-white/90 px-2.5 text-xs">
                  Next
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-orange-200 bg-white px-4 py-4 shadow-sm">
              <div className="flex flex-wrap gap-x-2 gap-y-2">
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
                  <span className="text-xl font-bold leading-relaxed tracking-wide text-slate-900 sm:text-2xl">
                    No sentence available.
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600">
              {selectedPhrase?.ja ?? "日本語訳はありません。"}
            </div>
            <div className="mt-5 flex justify-center">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  disabled={isLoading || !referenceText}
                  size="lg"
                  className="h-12 rounded-full bg-emerald-600 px-8 text-base text-white shadow-lg shadow-emerald-500/35 hover:bg-emerald-500"
                >
                  <Mic className="size-4" />
                  Speak
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  className="h-12 rounded-full bg-rose-600 px-8 text-base text-white shadow-lg shadow-rose-500/35 hover:bg-rose-500"
                >
                  <OctagonMinus className="size-4" />
                  Stop
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Analyzing pronunciation</CardTitle>
            <CardDescription>Scoring from Azure Speech Service...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={loadingProgress} className="h-2.5 [&>div]:bg-orange-500" />
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertTitle>Assessment failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className="border-slate-900/10 bg-white/90 shadow-2xl dark:border-white/10 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Assessment Results</CardTitle>
            <CardDescription className="text-base">Recognized: {result.recognizedText}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="text-xs tracking-[0.2em] text-slate-500 uppercase">Overall Score</div>
              <div className={`mt-2 text-6xl font-black ${getScoreToneClass(result.scores.pronScore)}`}>
                {result.scores.pronScore.toFixed(1)}
              </div>
              <div className="text-sm text-slate-500">out of 100</div>
            </div>

            <div className="space-y-4">
              {[
                { key: "Accuracy", value: result.scores.accuracyScore },
                { key: "Fluency", value: result.scores.fluencyScore },
                { key: "Completeness", value: result.scores.completenessScore },
                { key: "Prosody", value: result.scores.prosodyScore },
              ].map((score) => (
                <div key={score.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{score.key}</span>
                    <span className={`font-semibold ${getScoreToneClass(score.value)}`}>{score.value.toFixed(1)}</span>
                  </div>
                  <Progress value={score.value} className={`h-2.5 ${getScoreBarClass(score.value)}`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PronunciationAssessment;
