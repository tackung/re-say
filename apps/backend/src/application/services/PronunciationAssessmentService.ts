/**
 * Application Service: 発音評価サービス
 */
import { IAzureSpeechClient } from "../../infrastructure/azureSpeech/AzureSpeechClient.js";
import { PronunciationAssessmentEntity } from "../../domain/entities/PronunciationAssessmentEntity.js";
import { AssessmentResult } from "../../domain/types/assessment.js";

export interface IPronunciationAssessmentService {
  assessFromAudio(audioData: Buffer, referenceText: string): Promise<AssessmentResult>;
}

export class PronunciationAssessmentService implements IPronunciationAssessmentService {
  constructor(private readonly azureSpeechClient: IAzureSpeechClient) {}

  /**
   * 音声ファイルから発音評価を実行
   */
  async assessFromAudio(audioData: Buffer, referenceText: string): Promise<AssessmentResult> {
    console.log("[PronunciationAssessmentService] Starting assessment...");
    console.log("[PronunciationAssessmentService] Reference text:", referenceText);
    console.log("[PronunciationAssessmentService] Audio buffer size:", audioData.length, "bytes");

    // Azure Speech API で評価
    const result = await this.azureSpeechClient.assessPronunciation(audioData, referenceText);

    // ドメインエンティティに変換
    const entity = PronunciationAssessmentEntity.fromPlainObject(result);
    console.log(
      "[PronunciationAssessmentService] Assessment completed. Overall score:",
      entity.getOverallScore(),
    );

    return entity.toPlainObject();
  }
}
