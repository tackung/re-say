import type {
  AssessmentResult,
  WordAssessment,
} from "../../../../../packages/shared/types/assessment";

export type PracticePhrase = {
  en: string;
  ja: string;
};

export type PracticePackage = {
  topic: string;
  mode: "curated" | "free-text";
  phrases: PracticePhrase[];
};

export type PracticeContents = {
  packages: PracticePackage[];
};

export type SentenceToken = {
  token: string;
  assessment?: WordAssessment;
};

export type ScoreLabel = {
  key: keyof AssessmentResult["scores"];
  label: string;
  helpText: string;
};
