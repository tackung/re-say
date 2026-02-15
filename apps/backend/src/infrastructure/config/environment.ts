import dotenv from "dotenv";
import path from "path";
import { existsSync } from "fs";

export interface EnvironmentConfig {
  azureSpeechKey: string;
  azureSpeechRegion: string;
  port: number;
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

export class Environment {
  private static instance: Environment;
  private readonly config: EnvironmentConfig;

  private constructor() {
    const azureSpeechKey = process.env.AZURE_SPEECH_KEY;
    if (!azureSpeechKey || azureSpeechKey.trim().length === 0) {
      throw new Error("AZURE_SPEECH_KEY is not set in environment variables");
    }

    this.config = {
      azureSpeechKey,
      azureSpeechRegion: process.env.AZURE_SPEECH_REGION || "japaneast",
      port: asPort(process.env.PORT),
      nodeEnv: asNodeEnv(process.env.NODE_ENV),
      uploadDir: path.resolve(process.cwd(), "../../uploads"),
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

  public get nodeEnv(): "development" | "production" | "test" {
    return this.config.nodeEnv;
  }

  public get uploadDir(): string {
    return this.config.uploadDir;
  }
}
