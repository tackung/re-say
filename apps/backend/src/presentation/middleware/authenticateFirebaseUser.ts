import { NextFunction, Request, Response } from "express";
import { DecodedIdToken } from "firebase-admin/auth";
import { Environment } from "../../infrastructure/config/environment.js";
import { getFirebaseAuth } from "../../infrastructure/firebase/firebaseAdmin.js";

declare module "express-serve-static-core" {
  interface Request {
    firebaseUser?: DecodedIdToken;
  }
}

const extractBearerToken = (authorizationHeader: string | undefined): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

export const authenticateFirebaseUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const environment = Environment.getInstance();

  if (environment.skipAuthInDev) {
    next();
    return;
  }

  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      status: "error",
      error: "Unauthorized",
    });
    return;
  }

  try {
    const decodedToken = await getFirebaseAuth().verifyIdToken(token);
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error("[Auth] Firebase token verification failed:", error);
    res.status(401).json({
      status: "error",
      error: "Unauthorized",
    });
  }
};
