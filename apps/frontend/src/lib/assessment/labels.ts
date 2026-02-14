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
  if (score >= 80) return "#4caf50";
  if (score >= 60) return "#ff9800";
  return "#f44336";
};

export const getErrorTypeLabel = (errorType: WordErrorType): string => {
  return ERROR_LABELS[errorType];
};
