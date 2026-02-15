/**
 * Routes: 発音評価関連
 */
import { Router } from "express";
import multer from "multer";
import { AssessmentController } from "../controllers/AssessmentController.js";

export const createAssessmentRoutes = (
  controller: AssessmentController,
  uploadDir: string,
): Router => {
  const router = Router();
  const upload = multer({
    dest: uploadDir,
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  router.get("/health", controller.healthCheck);
  router.post("/assess", upload.single("audio"), controller.assess);

  return router;
};
