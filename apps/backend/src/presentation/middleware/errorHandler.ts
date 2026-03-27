/**
 * エラーハンドリングミドルウェア
 */
import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error("[ErrorHandler] Error occurred:", error);

  if (error.message.startsWith("Origin not allowed by CORS:")) {
    res.status(403).json({
      status: "error",
      error: "CORS origin is not allowed",
    });
    return;
  }

  res.status(500).json({
    status: "error",
    error: error.message || "Internal server error",
  });
};
