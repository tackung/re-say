/**
 * Controller: 発音評価
 */
import { Request, Response, NextFunction } from "express";
import { IPronunciationAssessmentService } from "../../application/services/PronunciationAssessmentService.js";
import { IFileStorage } from "../../infrastructure/storage/FileStorage.js";
import { AssessmentApiResponse, HealthCheckResponse } from "../../domain/types/assessment.js";
import { IAzureSpeechClient } from "../../infrastructure/azureSpeech/AzureSpeechClient.js";

export class AssessmentController {
  constructor(
    private readonly assessmentService: IPronunciationAssessmentService,
    private readonly fileStorage: IFileStorage,
    private readonly azureSpeechClient: IAzureSpeechClient,
  ) {}

  healthCheck = (_req: Request, res: Response): void => {
    const payload: HealthCheckResponse = {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
    res.json(payload);
  };

  assess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          status: "error",
          error: "No audio file provided",
        } as AssessmentApiResponse);
        return;
      }

      const referenceTextRaw = req.body.referenceText;
      const referenceText = typeof referenceTextRaw === "string" ? referenceTextRaw.trim() : "";

      if (!referenceText) {
        await this.fileStorage.deleteFile(req.file.path);
        res.status(400).json({
          status: "error",
          error: "Reference text is required",
        } as AssessmentApiResponse);
        return;
      }

      const result = await this.assessmentService.assessFromFile(req.file.path, referenceText);

      await this.fileStorage.deleteFile(req.file.path);

      res.json({
        status: "success",
        result,
      } as AssessmentApiResponse);
    } catch (error) {
      if (req.file) {
        await this.fileStorage.deleteFile(req.file.path).catch(console.error);
      }
      next(error);
    }
  };

  synthesize = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const textRaw = req.body?.text;
      const text = typeof textRaw === "string" ? textRaw.trim() : "";

      if (!text) {
        res.status(400).json({
          status: "error",
          error: "Text is required",
        });
        return;
      }

      if (text.length > 500) {
        res.status(400).json({
          status: "error",
          error: "Text must be 500 characters or less",
        });
        return;
      }

      const audioData = await this.azureSpeechClient.synthesizeTextToSpeech(text);

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", audioData.length.toString());
      res.send(audioData);
    } catch (error) {
      next(error);
    }
  };
}
