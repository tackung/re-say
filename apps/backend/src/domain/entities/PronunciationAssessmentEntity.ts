/**
 * ドメインエンティティ: 発音評価結果
 */
import { AssessmentResult, AssessmentScores, WordAssessment } from "../types/assessment.js";

export class PronunciationAssessmentEntity {
  constructor(
    public readonly recognizedText: string,
    public readonly scores: AssessmentScores,
    public readonly words: WordAssessment[],
  ) {}

  /**
   * 総合評価スコアを取得
   */
  getOverallScore(): number {
    return this.scores.pronScore;
  }

  /**
   * 合格判定（仮に70点以上を合格とする）
   */
  isPassed(threshold: number = 70): boolean {
    return this.getOverallScore() >= threshold;
  }

  /**
   * エラーがある単語のリストを取得
   */
  getErrorWords(): WordAssessment[] {
    return this.words.filter((word) => word.errorType !== "None");
  }

  /**
   * プレーンオブジェクトに変換
   */
  toPlainObject(): AssessmentResult {
    return {
      recognizedText: this.recognizedText,
      scores: { ...this.scores },
      words: this.words.map((w) => ({ ...w })),
    };
  }

  /**
   * プレーンオブジェクトからエンティティを作成
   */
  static fromPlainObject(data: AssessmentResult): PronunciationAssessmentEntity {
    return new PronunciationAssessmentEntity(data.recognizedText, data.scores, data.words);
  }
}
