"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { briefSchema } from "@/lib/brief-schema";
import { downloadBrief, type Session } from "@/lib/library";
import {
  MAX_SOURCE_LENGTH,
  originalBrief,
  sentences,
  tokenize,
  wordCount,
  wordDelay,
  type Brief,
  type Detail,
  type Kind,
} from "@/lib/reading";
import { sampleBrief, sampleSource, sampleTitle } from "@/lib/sample";

export type Reading = ReturnType<typeof useReading>;

export function useReading({ hasExample }: { hasExample: boolean }) {
  const [source, setSource] = useState(hasExample ? sampleSource : "");
  const [title, setTitle] = useState(hasExample ? sampleTitle : "");
  const [brief, setBrief] = useState<Brief | null>(
    hasExample ? sampleBrief : null,
  );
  const [kind, setKind] = useState<Kind>("example");
  const [detail, setDetail] = useState<Detail>("balanced");
  const [preparedDetail, setPreparedDetail] = useState<Detail>("balanced");
  const [tab, setTab] = useState<"source" | "brief">("source");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [wpm, setWpm] = useState(250);
  const [smart, setSmart] = useState(true);
  const [focus, setFocus] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<number | null>(null);
  const [passwordPrompt, setPasswordPrompt] = useState(false);
  const [appPassword, setAppPassword] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  const sourceWords = wordCount(source);
  const tokens = useMemo(() => tokenize(brief?.sections ?? []), [brief]);
  const sourceSentences = useMemo(() => sentences(source), [source]);
  const readingTime = useMemo(
    () => tokens.reduce((ms, token) => ms + wordDelay(token, wpm, smart), 0),
    [tokens, wpm, smart],
  );
  const reduction =
    sourceWords && tokens.length
      ? Math.round((1 - tokens.length / sourceWords) * 100)
      : 0;

  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  function stopRequest() {
    requestRef.current?.abort();
    setBusy(false);
  }
  function changeSource(value: string) {
    setSource(value);
    setBrief(null);
    setIndex(0);
    setPlaying(false);
    setSavedId(null);
    setError("");
  }
  function newReading() {
    stopRequest();
    changeSource("");
    setTitle("");
    setTab("source");
    setFocus(false);
  }
  function loadExample() {
    restore({
      title: sampleTitle,
      source: sampleSource,
      brief: sampleBrief,
      kind: "example",
      detail: "balanced",
      position: 0,
      wpm,
      smart,
    });
    setTab("source");
  }
  function readOriginal() {
    setBrief(originalBrief(source, title));
    setKind("original");
    setIndex(0);
    setPlaying(false);
    setTab("brief");
    setError("");
  }
  function restore(session: Session, id: string | null = null) {
    stopRequest();
    setSource(session.source);
    setTitle(session.title);
    setBrief(session.brief);
    setKind(session.kind);
    setDetail(session.detail);
    setPreparedDetail(session.detail);
    setIndex(
      session.brief
        ? Math.min(session.position, tokenize(session.brief.sections).length)
        : 0,
    );
    setWpm(session.wpm);
    setSmart(session.smart);
    setSavedId(id);
    setPlaying(false);
    setTab(session.brief ? "brief" : "source");
    setError("");
  }
  function snapshot(): Session {
    return {
      title: brief?.title ?? title,
      source,
      brief,
      kind,
      detail: preparedDetail,
      position: index,
      wpm,
      smart,
    };
  }

  async function prepare(password = appPassword) {
    if (source.trim().length < 80) {
      setError(
        "Add at least 80 characters so there is enough context to prepare a brief.",
      );
      return;
    }
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true);
    setError("");
    setPlaying(false);
    try {
      const response = await fetch("/api/prepare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(password ? { "x-app-password": password } : {}),
        },
        body: JSON.stringify({ source, title, detail }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.needsPassword) setPasswordPrompt(true);
        throw new Error(
          data.error || "Preparation could not finish. Please try again.",
        );
      }
      const nextBrief = briefSchema.parse(data.brief);
      setBrief(nextBrief);
      setKind("ai");
      setPreparedDetail(detail);
      setIndex(0);
      setTab("brief");
      setSavedId(null);
      setNotice("Your reading brief is ready.");
    } catch (error) {
      if (!controller.signal.aborted)
        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        );
    } finally {
      if (requestRef.current === controller) setBusy(false);
    }
  }
  function submitPassword(password: string) {
    setAppPassword(password);
    setPasswordPrompt(false);
    prepare(password);
  }

  async function uploadFile(file?: File) {
    if (!file) return;
    try {
      if (!/\.(txt|md|markdown)$/i.test(file.name))
        throw new Error("Choose a plain text (.txt) or Markdown (.md) file.");
      if (file.size > 600_000)
        throw new Error("Choose a file smaller than 600 KB.");
      const text = (await file.text()).replace(/^\uFEFF/u, "");
      if (text.length > MAX_SOURCE_LENGTH)
        throw new Error(
          "This file exceeds 100,000 characters. Try a smaller section.",
        );
      if (text.includes("\0"))
        throw new Error("This file does not appear to contain plain text.");
      if (!text.trim())
        throw new Error("This file is empty. Choose a file with text.");
      changeSource(text);
      setTitle(file.name.replace(/\.(txt|md|markdown)$/i, "").slice(0, 160));
      setNotice("Text imported. Choose your reading depth.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "The file could not be read.",
      );
    }
  }

  function download() {
    if (brief) downloadBrief(brief);
  }

  return {
    source,
    title,
    setTitle,
    brief,
    kind,
    detail,
    setDetail,
    preparedDetail,
    tab,
    setTab,
    index,
    setIndex,
    playing,
    setPlaying,
    wpm,
    setWpm,
    smart,
    setSmart,
    focus,
    setFocus,
    busy,
    error,
    setError,
    notice,
    setNotice,
    savedId,
    setSavedId,
    evidence,
    setEvidence,
    passwordPrompt,
    setPasswordPrompt,
    sourceWords,
    tokens,
    sourceSentences,
    readingTime,
    reduction,
    changeSource,
    newReading,
    loadExample,
    readOriginal,
    restore,
    snapshot,
    prepare,
    cancelPrepare: stopRequest,
    submitPassword,
    uploadFile,
    download,
  };
}
