import { Mic, OctagonMinus, Sparkles, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AssessmentApiResponse, AssessmentResult } from "../../../../packages/shared/types/assessment";
import { getErrorTypeLabel } from "../lib/assessment/labels";
import { convertToWav } from "../lib/audio/wavConverter";
import { assessPronunciation } from "../services/assessmentApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const REFERENCE_TEXT = "Good morning.";

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
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(18);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const processAudio = async (audioBlob: Blob): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const wavBlob = await convertToWav(audioBlob);
      const data: AssessmentApiResponse = await assessPronunciation(wavBlob, REFERENCE_TEXT);

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

  const getErrorBadgeVariant = (
    errorType: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (errorType === "None") {
      return "secondary";
    }
    if (errorType === "Mispronunciation") {
      return "destructive";
    }
    return "outline";
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-900/10 bg-white/85 shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="size-5 text-orange-500" />
            Practice Phrase
          </CardTitle>
          <CardDescription>Read the phrase naturally, then stop recording for instant scoring.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-xl border border-slate-200/70 bg-white p-5 text-2xl font-semibold tracking-wide text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
            {REFERENCE_TEXT}
          </div>
          <div className="flex justify-center">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={isLoading}
                size="lg"
                className="bg-emerald-600 px-7 text-base text-white hover:bg-emerald-500"
              >
                <Mic className="size-4" />
                Speak
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                size="lg"
                className="bg-rose-600 px-7 text-base text-white hover:bg-rose-500"
              >
                <OctagonMinus className="size-4" />
                Stop
              </Button>
            )}
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

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-[0.18em] text-slate-600 uppercase dark:text-slate-300">
                Word by Word
              </h3>
              <div className="space-y-2">
                {result.words.map((word, index) => (
                  <div
                    key={`${word.word}-${index}`}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <span className="font-medium">{word.word}</span>
                    <span className={`font-semibold ${getScoreToneClass(word.accuracyScore)}`}>
                      {word.accuracyScore.toFixed(1)}
                    </span>
                    <Badge variant={getErrorBadgeVariant(word.errorType)}>{getErrorTypeLabel(word.errorType)}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PronunciationAssessment;
