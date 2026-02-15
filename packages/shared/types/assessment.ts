export type AssessmentStatus = "success" | "error";

export type WordErrorType =
  | "None"
  | "Mispronunciation"
  | "Omission"
  | "Insertion"
  | "UnexpectedBreak"
  | "MissingBreak"
  | "Monotone";

export interface AssessmentRequest {
  referenceText: string;
}

export interface AssessmentScores {
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  prosodyScore: number;
  pronScore: number;
}

export interface WordAssessment {
  word: string;
  accuracyScore: number;
  errorType: WordErrorType;
  phonemes: PhonemeAssessment[];
}

export interface PhonemeAssessment {
  phoneme: string;
  accuracyScore: number;
}

export interface AssessmentResult {
  recognizedText: string;
  scores: AssessmentScores;
  words: WordAssessment[];
}

export interface SuccessResponse<T> {
  status: "success";
  result: T;
}

export interface ErrorResponse {
  status: "error";
  error: string;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export type AssessmentApiResponse = ApiResponse<AssessmentResult>;

export interface HealthCheckResponse {
  status: "ok";
  timestamp: string;
}
