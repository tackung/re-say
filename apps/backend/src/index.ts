/**
 * Backend Entry Point
 */
import express from "express";
import cors from "cors";

import { Environment } from "./infrastructure/config/environment.js";
import { AzureSpeechClient } from "./infrastructure/azureSpeech/AzureSpeechClient.js";

import { PronunciationAssessmentService } from "./application/services/PronunciationAssessmentService.js";

import { AssessmentController } from "./presentation/controllers/AssessmentController.js";
import { createAssessmentRoutes } from "./presentation/routes/assessmentRoutes.js";
import { errorHandler } from "./presentation/middleware/errorHandler.js";

const environment = Environment.getInstance();
const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || environment.corsAllowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: false,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  }),
);
app.use(express.json());

const azureSpeechClient = new AzureSpeechClient();
const assessmentService = new PronunciationAssessmentService(azureSpeechClient);
const assessmentController = new AssessmentController(assessmentService, azureSpeechClient);

app.use("/api", createAssessmentRoutes(assessmentController));
app.use(errorHandler);

app.listen(environment.port, () => {
  console.log(`Server running on http://localhost:${environment.port}`);
  console.log(`Azure Speech Region: ${environment.azureSpeechRegion}`);
  console.log(`Azure Speech Key configured: Yes`);
  console.log(`Environment: ${environment.nodeEnv}`);
});
