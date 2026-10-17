import { test } from "node:test";
import assert from "node:assert/strict";
import {
  focusParts,
  originalBrief,
  sentencePosition,
  sentences,
  tokenize,
  wordDelay,
} from "../lib/reading.ts";

test("the focus character remains a letter when words have leading quotation marks", () => {
  const word = "“Attention,”";
  const parts = focusParts(word);
  assert.equal(parts.before + parts.focus + parts.after, word);
  assert.match(parts.focus, /\p{L}/u);
  assert.equal(parts.focus, "t");
  assert.equal(focusParts("a").focus, "a");
  assert.equal(
    focusParts("...").before +
      focusParts("...").focus +
      focusParts("...").after,
    "...",
  );
});

test("smart pacing gives sentence and section endings time without changing plain timing", () => {
  const plain = { word: "idea", section: 0, endSection: false };
  const sentence = { ...plain, word: "idea.”" };
  const section = { ...sentence, endSection: true };
  assert.equal(wordDelay(plain, 300, false), 200);
  assert.equal(wordDelay(section, 300, false), 200);
  assert.ok(wordDelay(sentence, 300, true) > wordDelay(plain, 300, true));
  assert.ok(wordDelay(section, 300, true) > wordDelay(sentence, 300, true));
  assert.ok(Number.isFinite(wordDelay(plain, 0, true)));
});

test("rewind returns to the current sentence or the previous one near a sentence start", () => {
  const tokens = tokenize([
    {
      heading: "First",
      text: "First idea ends. A longer second idea ends! Last thought.",
      sourceSentences: [],
    },
  ]);
  assert.equal(sentencePosition(tokens, 7, -1), 3);
  assert.equal(sentencePosition(tokens, 4, -1), 0);
  assert.equal(sentencePosition(tokens, 1, 1), 3);
  assert.equal(sentencePosition(tokens, 7, 1), 8);
  assert.equal(sentencePosition(tokens, 0, -1), 0);
});

test("section boundaries allow sentence navigation even without punctuation", () => {
  const tokens = tokenize([
    { heading: "A", text: "One idea", sourceSentences: [] },
    { heading: "B", text: "Another idea", sourceSentences: [] },
  ]);
  assert.equal(tokens[1].endSection, true);
  assert.equal(tokens[2].section, 1);
  assert.equal(sentencePosition(tokens, 0, 1), 2);
  assert.equal(sentencePosition(tokens, 2, -1), 0);
});

test("original reading preserves every word and creates sections from paragraphs", () => {
  const source =
    "A difficult idea, with context.\n\nThe next idea matters too.";
  const brief = originalBrief(source, "Test reading");
  assert.equal(brief.sections.length, 2);
  assert.deepEqual(
    tokenize(brief.sections).map((t) => t.word),
    source.split(/\s+/u),
  );
  assert.deepEqual(sentences("The value is 3.5. This is another sentence."), [
    "The value is 3.5.",
    "This is another sentence.",
  ]);
});

test("long originals group many paragraphs without dropping words", () => {
  const source = Array.from(
    { length: 40 },
    (_, i) => `Paragraph ${i} keeps its words.`,
  ).join("\n\n");
  const brief = originalBrief(source, "Long original");
  assert.ok(brief.sections.length <= 12);
  assert.deepEqual(
    tokenize(brief.sections).map((token) => token.word),
    source.split(/\s+/u),
  );
});
