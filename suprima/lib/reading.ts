export type Detail = "quick" | "balanced" | "deep";
export type Kind = "example" | "ai" | "original";
export type Section = {
  heading: string;
  text: string;
  sourceSentences: number[];
};
export type Brief = {
  title: string;
  overview: string;
  sections: Section[];
  takeaways: string[];
};
export type Token = { word: string; section: number; endSection: boolean };

export const MAX_SOURCE_LENGTH = 100_000;
export const details: {
  id: Detail;
  label: string;
  description: string;
  ratio: number;
}[] = [
  {
    id: "quick",
    label: "The essentials",
    description: "A quick overview",
    ratio: 0.2,
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Ideas + key context",
    ratio: 0.45,
  },
  {
    id: "deep",
    label: "In depth",
    description: "Keep the nuance",
    ratio: 0.75,
  },
];

export function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/u).length : 0;
}
export function sentences(text: string): string[] {
  const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
  return [...segmenter.segment(text)]
    .map((s) => s.segment.trim())
    .filter(Boolean);
}
export function tokenize(sections: Section[]): Token[] {
  return sections.flatMap((section, index) => {
    const words = section.text.trim().split(/\s+/u).filter(Boolean);
    return words.map((word, i) => ({
      word,
      section: index,
      endSection: i === words.length - 1,
    }));
  });
}
export function isSentenceEnd(word: string) {
  return /[.!?][”’"')\]]*$/u.test(word);
}
export function wordDelay(token: Token, wpm: number, smart: boolean) {
  const base = 60_000 / Math.max(100, Math.min(700, wpm));
  if (!smart) return base;
  const length = [...token.word].length;
  let multiplier = length > 12 ? 1.4 : length > 8 ? 1.15 : 1;
  if (isSentenceEnd(token.word)) multiplier += 1.3;
  else if (/[,;:—][”’"')\]]*$/u.test(token.word)) multiplier += 0.5;
  if (token.endSection) multiplier += 2;
  return base * multiplier;
}
export function focusParts(word: string) {
  const chars = [...word];
  const letterIndices = chars
    .map((c, i) => (/[\p{L}\p{N}]/u.test(c) ? i : -1))
    .filter((i) => i >= 0);
  const length = letterIndices.length;
  const pivot =
    length <= 1 ? 0 : length <= 5 ? 1 : length <= 9 ? 2 : length <= 13 ? 3 : 4;
  const index = letterIndices[Math.min(pivot, Math.max(0, length - 1))] ?? 0;
  return {
    before: chars.slice(0, index).join(""),
    focus: chars[index] ?? "",
    after: chars.slice(index + 1).join(""),
  };
}
export function sentencePosition(
  tokens: Token[],
  current: number,
  direction: -1 | 1,
) {
  if (direction === 1) {
    for (let i = current; i < tokens.length - 1; i++)
      if (isSentenceEnd(tokens[i].word) || tokens[i].endSection) return i + 1;
    return Math.max(0, tokens.length - 1);
  }
  let start = current;
  while (
    start > 0 &&
    !isSentenceEnd(tokens[start - 1].word) &&
    !tokens[start - 1].endSection
  )
    start--;
  if (current - start > 2) return start;
  start = Math.max(0, start - 1);
  while (
    start > 0 &&
    !isSentenceEnd(tokens[start - 1].word) &&
    !tokens[start - 1].endSection
  )
    start--;
  return start;
}
export function formatTime(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
export function originalBrief(source: string, title: string): Brief {
  const paragraphs = source
    .split(/\n\s*\n/u)
    .map((p) => p.trim())
    .filter(Boolean);
  const groupSize = Math.max(1, Math.ceil(paragraphs.length / 12));
  const groups = Array.from(
    { length: Math.ceil(paragraphs.length / groupSize) },
    (_, i) => paragraphs.slice(i * groupSize, (i + 1) * groupSize).join("\n\n"),
  );
  return {
    title: title.trim() || "Untitled reading",
    overview: "Your original words, at your own pace.",
    sections: groups.map((text, i) => ({
      heading: `Part ${i + 1}`,
      text,
      sourceSentences: [],
    })),
    takeaways: [],
  };
}
