export type AnkiPhrase = {
  question: string;
  questionJa: string;
  answer: string;
  answerJa: string;
};

export type AnkiPackage = {
  topic: string;
  mode: "anki" | string;
  phrases: AnkiPhrase[];
};

export type AnkiContents = {
  packages: AnkiPackage[];
};
