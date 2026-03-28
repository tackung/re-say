/**
 * Routes: 発音評価関連
 */
import { Router } from "express";
import multer from "multer";
import { AssessmentController } from "../controllers/AssessmentController.js";
import { authenticateFirebaseUser } from "../middleware/authenticateFirebaseUser.js";

export const createAssessmentRoutes = (controller: AssessmentController): Router => {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  router.get("/health", controller.healthCheck);
  router.post("/assess", authenticateFirebaseUser, upload.single("audio"), controller.assess);
  router.post("/tts", authenticateFirebaseUser, controller.synthesize);

  return router;
};
