import { TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AssessmentApiResponse,
  AssessmentResult,
} from "../../../../packages/shared/types/assessment";
import { convertToWav } from "../lib/audio/wavConverter";
import { assessPronunciation, synthesizeExampleSpeech } from "../services/assessmentApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FREE_TEXT_MAX_LENGTH } from "./pronunciation-assessment/constants";
import {
  initialPackageIndex,
  isFreeTextPackage,
  practicePackages,
} from "./pronunciation-assessment/content";
import { AssessmentResultsCard } from "./pronunciation-assessment/AssessmentResultsCard";
import { PracticeContextCard } from "./pronunciation-assessment/PracticeContextCard";
import {
  buildSentenceTokens,
  getSupportedMimeType,
  hasMultibyteCharacters,
} from "./pronunciation-assessment/utils";

const PronunciationAssessment = () => {
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(initialPackageIndex);
  const [selectedPhraseIndex, setSelectedPhraseIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(18);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [freeModeSentenceInput, setFreeModeSentenceInput] = useState("");
  const [isSynthesizingSpeech, setIsSynthesizingSpeech] = useState(false);
  const [isPlayingExampleSpeech, setIsPlayingExampleSpeech] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const exampleAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const selectedPackage =
    selectedPackageIndex >= 0 ? practicePackages[selectedPackageIndex] : undefined;
  const isFreeMode = selectedPackage ? isFreeTextPackage(selectedPackage) : false;
  const availablePhrases = selectedPackage?.phrases ?? [];
  const selectedPhrase =
    availablePhrases.length > 0
      ? availablePhrases[Math.min(selectedPhraseIndex, availablePhrases.length - 1)]
      : undefined;
  const referenceText = isFreeMode ? freeModeSentenceInput.trim() : (selectedPhrase?.en ?? "");

  const hasExceededFreeTextLength =
    isFreeMode && freeModeSentenceInput.length > FREE_TEXT_MAX_LENGTH;
  const freeModeInputError =
    isFreeMode && hasMultibyteCharacters(freeModeSentenceInput)
      ? "⚠ 英文のみに対応しています"
      : hasExceededFreeTextLength
        ? `⚠ ${FREE_TEXT_MAX_LENGTH}文字以内で入力してください`
        : null;

  const sentenceTokens = useMemo(
    () => buildSentenceTokens(referenceText, result?.words ?? []),
    [referenceText, result?.words],
  );

  const stopExampleSpeech = useCallback((): void => {
    const audio = exampleAudioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.onended = null;
    audio.onerror = null;

    const sourceUrl = audio.src;
    exampleAudioRef.current = null;

    if (sourceUrl.startsWith("blob:")) {
      URL.revokeObjectURL(sourceUrl);
    }

    setIsPlayingExampleSpeech(false);
  }, []);

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
    if (isFreeMode && freeModeInputError) {
      setError(freeModeInputError);
      return;
    }

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
      stopExampleSpeech();
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

  const playExampleSpeech = async (): Promise<void> => {
    if (isPlayingExampleSpeech) {
      stopExampleSpeech();
      return;
    }

    if (isFreeMode && freeModeInputError) {
      setError(freeModeInputError);
      return;
    }

    if (!referenceText) {
      setError("Practice sentence is not selected.");
      return;
    }

    setError(null);
    setIsSynthesizingSpeech(true);

    try {
      const audioBlob = await synthesizeExampleSpeech(referenceText);
      const audioUrl = URL.createObjectURL(audioBlob);

      stopExampleSpeech();

      const audio = new Audio(audioUrl);
      exampleAudioRef.current = audio;

      audio.onended = () => {
        if (audioUrl.startsWith("blob:")) {
          URL.revokeObjectURL(audioUrl);
        }
        if (exampleAudioRef.current === audio) {
          exampleAudioRef.current = null;
        }
        setIsPlayingExampleSpeech(false);
      };

      audio.onerror = () => {
        if (audioUrl.startsWith("blob:")) {
          URL.revokeObjectURL(audioUrl);
        }
        if (exampleAudioRef.current === audio) {
          exampleAudioRef.current = null;
        }
        setIsPlayingExampleSpeech(false);
        setError("Failed to play example speech.");
      };

      await audio.play();
      setIsPlayingExampleSpeech(true);
    } catch (caught) {
      stopExampleSpeech();
      setError(caught instanceof Error ? caught.message : "Failed to synthesize speech");
    } finally {
      setIsSynthesizingSpeech(false);
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

  useEffect(() => {
    if (!isFreeMode) {
      return;
    }
    setResult(null);
    setError(null);
  }, [freeModeSentenceInput, isFreeMode]);

  useEffect(() => {
    stopExampleSpeech();
  }, [referenceText, stopExampleSpeech]);

  useEffect(() => () => stopExampleSpeech(), [stopExampleSpeech]);

  return (
    <div className="space-y-6">
      <PracticeContextCard
        practicePackages={practicePackages}
        selectedPackageIndex={selectedPackageIndex}
        onSelectPackage={setSelectedPackageIndex}
        isFreeMode={isFreeMode}
        availablePhrases={availablePhrases}
        selectedPhraseIndex={selectedPhraseIndex}
        onSelectPhrase={setSelectedPhraseIndex}
        freeModeSentenceInput={freeModeSentenceInput}
        onFreeModeInputChange={setFreeModeSentenceInput}
        freeModeInputError={freeModeInputError}
        sentenceTokens={sentenceTokens}
        selectedPhraseJa={selectedPhrase?.ja}
        onMovePhraseSelection={movePhraseSelection}
        onChooseRandomPhrase={chooseRandomPhrase}
        isRecording={isRecording}
        isLoading={isLoading}
        isSynthesizingSpeech={isSynthesizingSpeech}
        isPlayingExampleSpeech={isPlayingExampleSpeech}
        referenceText={referenceText}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onPlayExampleSpeech={playExampleSpeech}
      />

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

      {result && <AssessmentResultsCard result={result} />}
    </div>
  );
};

export default PronunciationAssessment;
