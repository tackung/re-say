import contents from "../../data/contents.json";
import type { PracticeContents, PracticePackage } from "./types";

const practiceContents = contents as PracticeContents;

export const isFreeTextPackage = (entry: PracticePackage): boolean => entry.mode === "free-text";

export const practicePackages = practiceContents.packages.filter(
  (entry) => isFreeTextPackage(entry) || entry.phrases.length > 0,
);

export const initialPackageIndex = practicePackages.length > 0 ? 0 : -1;
