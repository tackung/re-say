/**
 * Controller: 発音評価
 */
import { Request, Response, NextFunction } from 'express';
import { IPronunciationAssessmentService } from '../../application/services/PronunciationAssessmentService.js';
import { IFileStorage } from '../../infrastructure/storage/FileStorage.js';
import { AssessmentApiResponse, HealthCheckResponse } from '../../domain/types/assessment.js';

export class AssessmentController {
  constructor(
    private readonly assessmentService: IPronunciationAssessmentService,
    private readonly fileStorage: IFileStorage,
  ) {}

  healthCheck = (_req: Request, res: Response): void => {
    const payload: HealthCheckResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
    res.json(payload);
  };

  assess = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          status: 'error',
          error: 'No audio file provided',
        } as AssessmentApiResponse);
        return;
      }

      const referenceTextRaw = req.body.referenceText;
      const referenceText = typeof referenceTextRaw === 'string' ? referenceTextRaw.trim() : '';

      if (!referenceText) {
        await this.fileStorage.deleteFile(req.file.path);
        res.status(400).json({
          status: 'error',
          error: 'Reference text is required',
        } as AssessmentApiResponse);
        return;
      }

      const result = await this.assessmentService.assessFromFile(req.file.path, referenceText);

      await this.fileStorage.deleteFile(req.file.path);

      res.json({
        status: 'success',
        result,
      } as AssessmentApiResponse);
    } catch (error) {
      if (req.file) {
        await this.fileStorage.deleteFile(req.file.path).catch(console.error);
      }
      next(error);
    }
  };
}
