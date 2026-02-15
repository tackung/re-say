import type { ScoreLabel } from "./types";

export const FREE_TEXT_MAX_LENGTH = 100;

export const SCORE_LABELS: ScoreLabel[] = [
  {
    key: "accuracyScore",
    label: "Accuracy（正確性）",
    helpText: "音素がネイティブ発音にどれだけ近いかを示します。",
  },
  {
    key: "fluencyScore",
    label: "Fluency（流暢さ）",
    helpText: "話すテンポや単語間のつながりの自然さを示します。",
  },
  {
    key: "completenessScore",
    label: "Completeness（完成度）",
    helpText: "参照文に対して、必要な単語をどれだけ言えたかを示します。",
  },
  {
    key: "prosodyScore",
    label: "Prosody（韻律）",
    helpText: "抑揚、リズム、アクセントなど話し方の自然さを示します。",
  },
];

export const WORD_PHONEME_HELP_TEXT =
  "単語スコアは音素スコアの単純平均ではありません。音素境界や連結発話の影響で音素が低くても、単語全体が通じると単語スコアは高くなる場合があります。";
