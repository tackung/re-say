import { WordErrorType } from "../../../../../packages/shared/types/assessment";

const ERROR_LABELS: Record<WordErrorType, string> = {
  None: "Good",
  Mispronunciation: "Mispronunciation",
  Omission: "Omitted",
  Insertion: "Inserted",
  UnexpectedBreak: "Unexpected Break",
  MissingBreak: "Missing Break",
  Monotone: "Monotone",
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-400 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

export const getErrorTypeLabel = (errorType: WordErrorType): string => {
  return ERROR_LABELS[errorType];
};
