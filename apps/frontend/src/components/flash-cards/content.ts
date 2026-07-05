import contents from "../../data/anki-contents.json";
import type { AnkiContents, AnkiPackage, AnkiPhrase } from "./types";

const ankiContents = contents as AnkiContents;

const isValidPhrase = (phrase: AnkiPhrase): boolean =>
  phrase.question.trim().length > 0 &&
  phrase.questionJa.trim().length > 0 &&
  phrase.answer.trim().length > 0 &&
  phrase.answerJa.trim().length > 0;

export const ankiPackages = ankiContents.packages
  .filter((entry): entry is AnkiPackage => entry.mode === "anki")
  .map((entry) => ({
    ...entry,
    phrases: entry.phrases.filter(isValidPhrase),
  }))
  .filter((entry) => entry.topic.trim().length > 0 && entry.phrases.length > 0);
