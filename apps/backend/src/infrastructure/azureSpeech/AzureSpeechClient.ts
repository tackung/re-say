/**
 * Azure Speech Service クライアント
 */
import { Environment } from "../config/environment.js";
import { AssessmentResult } from "../../domain/types/assessment.js";

export interface AzurePronunciationParams {
  ReferenceText: string;
  GradingSystem: "FivePoint" | "HundredMark";
  Granularity: "Phoneme" | "Word" | "FullText";
  Dimension: "Basic" | "Comprehensive";
  EnableProsodyAssessment: string;
}

export interface AzureWordResult {
  Word: string;
  AccuracyScore?: number;
  ErrorType?: string;
  Phonemes?: AzurePhonemeResult[];
}

export interface AzurePhonemeResult {
  Phoneme: string;
  AccuracyScore?: number;
}

export interface AzureNBestResult {
  Display: string;
  AccuracyScore?: number;
  FluencyScore?: number;
  CompletenessScore?: number;
  ProsodyScore?: number;
  PronScore?: number;
  Words?: AzureWordResult[];
}

export interface AzureSpeechApiResponse {
  RecognitionStatus: string;
  DisplayText?: string;
  NBest?: AzureNBestResult[];
}

export interface IAzureSpeechClient {
  assessPronunciation(audioData: Buffer, referenceText: string): Promise<AssessmentResult>;
  synthesizeTextToSpeech(text: string): Promise<Buffer>;
}

export class AzureSpeechClient implements IAzureSpeechClient {
  private readonly environment: Environment;
  private static readonly TTS_PRIMARY_VOICE = "en-US-GuyNeural";
  private static readonly TTS_FALLBACK_VOICE = "en-US-BrandonNeural";

  constructor() {
    this.environment = Environment.getInstance();
  }

  /**
   * 発音評価を実行
   */
  async assessPronunciation(audioData: Buffer, referenceText: string): Promise<AssessmentResult> {
    const params: AzurePronunciationParams = {
      ReferenceText: referenceText,
      GradingSystem: "HundredMark",
      Granularity: "Phoneme",
      Dimension: "Comprehensive",
      EnableProsodyAssessment: "True",
    };

    const pronunciationAssessmentParamsBase64 = Buffer.from(JSON.stringify(params)).toString(
      "base64",
    );

    const region = this.environment.azureSpeechRegion;
    const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;

    console.log("[AzureSpeechClient] Calling Azure Speech API...");
    console.log("[AzureSpeechClient] URL:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": this.environment.azureSpeechKey,
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
        Accept: "application/json",
        "Pronunciation-Assessment": pronunciationAssessmentParamsBase64,
      },
      body: audioData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AzureSpeechClient] Azure API error:", response.status, errorText);
      throw new Error(`Azure Speech API error: ${response.status} - ${errorText}`);
    }

    const rawResult: unknown = await response.json();
    const azureResult = rawResult as AzureSpeechApiResponse;
    console.log("[AzureSpeechClient] Azure API response received");

    return this.parseAzureResponse(azureResult);
  }

  /**
   * テキストを音声に変換
   */
  async synthesizeTextToSpeech(text: string): Promise<Buffer> {
    const normalizedText = text.trim();
    if (!normalizedText) {
      throw new Error("Text is required for speech synthesis");
    }

    const voices = [AzureSpeechClient.TTS_PRIMARY_VOICE, AzureSpeechClient.TTS_FALLBACK_VOICE];
    let lastError = "Unknown speech synthesis error";

    for (const voiceName of voices) {
      const result = await this.trySynthesizeWithVoice(normalizedText, voiceName);
      if (result.ok) {
        return result.audioData;
      }
      lastError = result.errorDetail;
    }

    throw new Error(lastError);
  }

  private async trySynthesizeWithVoice(
    text: string,
    voiceName: string,
  ): Promise<{ ok: true; audioData: Buffer } | { ok: false; errorDetail: string }> {
    const ssml = this.buildSsml(text, voiceName);
    const region = this.environment.azureSpeechRegion;
    const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

    console.log("[AzureSpeechClient] Calling Azure TTS API...");
    console.log("[AzureSpeechClient] TTS voice:", voiceName);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": this.environment.azureSpeechKey,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
        "User-Agent": "re-say",
      },
      body: ssml,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorDetail = `Azure TTS API error (${voiceName}): ${response.status} - ${errorText}`;
      console.error("[AzureSpeechClient]", errorDetail);
      return { ok: false, errorDetail };
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    return { ok: true, audioData: audioBuffer };
  }

  private buildSsml(text: string, voiceName: string): string {
    const escapedText = this.escapeForXml(text);
    return `<speak version="1.0" xml:lang="en-US"><voice name="${voiceName}">${escapedText}</voice></speak>`;
  }

  private escapeForXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * Azure API レスポンスをパース
   */
  private parseAzureResponse(azureResult: AzureSpeechApiResponse): AssessmentResult {
    if (azureResult.RecognitionStatus !== "Success") {
      throw new Error(`Recognition failed: ${azureResult.RecognitionStatus}`);
    }

    const nBest = azureResult.NBest?.[0];
    if (!nBest) {
      throw new Error("No recognition results available");
    }

    return {
      recognizedText: azureResult.DisplayText || nBest.Display,
      scores: {
        accuracyScore: nBest.AccuracyScore || 0,
        fluencyScore: nBest.FluencyScore || 0,
        completenessScore: nBest.CompletenessScore || 0,
        prosodyScore: nBest.ProsodyScore || 0,
        pronScore: nBest.PronScore || 0,
      },
      words: (nBest.Words || []).map((word) => ({
        word: word.Word,
        accuracyScore: word.AccuracyScore || 0,
        errorType: this.normalizeErrorType(word.ErrorType),
        phonemes: (word.Phonemes || []).map((phoneme) => ({
          phoneme: phoneme.Phoneme,
          accuracyScore: phoneme.AccuracyScore || 0,
        })),
      })),
    };
  }

  /**
   * エラータイプを正規化
   */
  private normalizeErrorType(
    errorType?: string,
  ):
    | "None"
    | "Mispronunciation"
    | "Omission"
    | "Insertion"
    | "UnexpectedBreak"
    | "MissingBreak"
    | "Monotone" {
    if (!errorType || errorType === "None") return "None";
    if (errorType === "Mispronunciation") return "Mispronunciation";
    if (errorType === "Omission") return "Omission";
    if (errorType === "Insertion") return "Insertion";
    if (errorType === "UnexpectedBreak") return "UnexpectedBreak";
    if (errorType === "MissingBreak") return "MissingBreak";
    if (errorType === "Monotone") return "Monotone";
    return "None";
  }
}
