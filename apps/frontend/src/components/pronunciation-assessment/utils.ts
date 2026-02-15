import type { WordAssessment } from "../../../../../packages/shared/types/assessment";
import { getScoreColor } from "../../lib/assessment/labels";
import type { SentenceToken } from "./types";

const normalizeWord = (value: string): string => value.toLowerCase().replace(/[^a-z0-9']/g, "");

export const hasMultibyteCharacters = (value: string): boolean => /[^\x00-\x7F]/.test(value);

export const buildSentenceTokens = (
  referenceText: string,
  words: WordAssessment[],
): SentenceToken[] => {
  const tokens = referenceText.split(/\s+/).filter(Boolean);
  let cursor = 0;

  return tokens.map((token) => {
    const tokenNormalized = normalizeWord(token);
    if (!tokenNormalized) {
      return { token };
    }

    let matchedAssessment: WordAssessment | undefined;
    for (let offset = 0; offset < 3; offset += 1) {
      const candidate = words[cursor + offset];
      if (!candidate) {
        break;
      }
      if (normalizeWord(candidate.word) === tokenNormalized) {
        matchedAssessment = candidate;
        cursor += offset + 1;
        break;
      }
    }

    return { token, assessment: matchedAssessment };
  });
};

export const getSupportedMimeType = (): string => {
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
    return "audio/ogg;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/mp4")) {
    return "audio/mp4";
  }
  return "audio/webm";
};

export const getScoreBarClass = (score: number): string => {
  if (score >= 80) {
    return "[&>div]:bg-emerald-600";
  }
  if (score >= 60) {
    return "[&>div]:bg-amber-400";
  }
  return "[&>div]:bg-rose-600";
};

export const getWordTokenClass = (assessment?: WordAssessment): string => {
  if (!assessment) {
    return "text-slate-700";
  }
  return getScoreColor(assessment.accuracyScore);
};

export const getPhonemeBadgeClass = (score: number): string => {
  if (score >= 80) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (score >= 60) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-rose-200 bg-rose-50 text-rose-700";
};
