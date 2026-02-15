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

  res.status(500).json({
    status: "error",
    error: error.message || "Internal server error",
  });
};
