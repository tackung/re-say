import dotenv from "dotenv";
import os from "os";
import path from "path";
import { existsSync } from "fs";

export interface EnvironmentConfig {
  azureSpeechKey: string;
  azureSpeechRegion: string;
  corsAllowedOrigins: string[];
  firebaseProjectId: string | undefined;
  port: number;
  skipAuthInDev: boolean;
  nodeEnv: "development" | "production" | "test";
  uploadDir: string;
}

const ENV_FILE_CANDIDATES = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
];

for (const envFilePath of ENV_FILE_CANDIDATES) {
  if (existsSync(envFilePath)) {
    dotenv.config({ path: envFilePath });
    break;
  }
}

const asNodeEnv = (value: string | undefined): "development" | "production" | "test" => {
  if (value === "development" || value === "production" || value === "test") {
    return value;
  }
  return "development";
};

const asPort = (value: string | undefined): number => {
  if (!value) {
    return 3000;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return parsed;
};

const asAllowedOrigins = (value: string | undefined): string[] => {
  if (!value) {
    return ["http://localhost:5173"];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

const asSkipAuthInDev = (
  value: string | undefined,
  nodeEnv: "development" | "production" | "test",
): boolean => value === "true" && nodeEnv === "development";

export class Environment {
  private static instance: Environment;
  private readonly config: EnvironmentConfig;

  private constructor() {
    const azureSpeechKey = process.env.AZURE_SPEECH_KEY;
    if (!azureSpeechKey || azureSpeechKey.trim().length === 0) {
      throw new Error("AZURE_SPEECH_KEY is not set in environment variables");
    }

    const nodeEnv = asNodeEnv(process.env.NODE_ENV);

    this.config = {
      azureSpeechKey,
      azureSpeechRegion: process.env.AZURE_SPEECH_REGION || "japaneast",
      corsAllowedOrigins: asAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS),
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
      port: asPort(process.env.PORT),
      skipAuthInDev: asSkipAuthInDev(process.env.SKIP_AUTH_IN_DEV, nodeEnv),
      nodeEnv,
      uploadDir: process.env.UPLOAD_DIR || path.join(os.tmpdir(), "re-say-uploads"),
    };
  }

  public static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }

  public get azureSpeechKey(): string {
    return this.config.azureSpeechKey;
  }

  public get azureSpeechRegion(): string {
    return this.config.azureSpeechRegion;
  }

  public get port(): number {
    return this.config.port;
  }

  public get firebaseProjectId(): string | undefined {
    return this.config.firebaseProjectId;
  }

  public get corsAllowedOrigins(): string[] {
    return this.config.corsAllowedOrigins;
  }

  public get nodeEnv(): "development" | "production" | "test" {
    return this.config.nodeEnv;
  }

  public get skipAuthInDev(): boolean {
    return this.config.skipAuthInDev;
  }

  public get uploadDir(): string {
    return this.config.uploadDir;
  }
}
