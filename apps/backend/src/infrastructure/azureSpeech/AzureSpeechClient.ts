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
}

export class AzureSpeechClient implements IAzureSpeechClient {
  private readonly environment: Environment;

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
      Granularity: "Word",
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
      })),
    };
  }

  /**
   * エラータイプを正規化
   */
  private normalizeErrorType(
    errorType?: string,
  ): "None" | "Mispronunciation" | "Omission" | "Insertion" {
    if (!errorType || errorType === "None") return "None";
    if (errorType === "Mispronunciation") return "Mispronunciation";
    if (errorType === "Omission") return "Omission";
    if (errorType === "Insertion") return "Insertion";
    return "None";
  }
}
