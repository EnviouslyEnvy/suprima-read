"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  Check,
  Expand,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import {
  focusParts,
  formatTime,
  sentencePosition,
  tokenize,
  wordDelay,
  type Brief,
} from "@/lib/reading";

type Props = {
  brief: Brief | null;
  kind: "example" | "ai" | "original";
  index: number;
  setIndex: (value: number | ((value: number) => number)) => void;
  playing: boolean;
  setPlaying: (value: boolean) => void;
  wpm: number;
  setWpm: (value: number | ((value: number) => number)) => void;
  smart: boolean;
  setSmart: (value: boolean) => void;
  focus: boolean;
  setFocus: (value: boolean) => void;
  modalOpen: boolean;
};

export default function Reader({
  brief,
  kind,
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
  modalOpen,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const tokens = useMemo(() => tokenize(brief?.sections ?? []), [brief]);
  const token = tokens[index];
  const [before, pivot, after] = (() => {
    const p = focusParts(token?.word || "clarity");
    return [p.before, p.focus, p.after];
  })();
  const done = tokens.length > 0 && index >= tokens.length;
  const position = Math.min(index, Math.max(0, tokens.length - 1));
  const section = tokens[position]?.section ?? 0;
  const remaining = useMemo(
    () =>
      tokens
        .slice(index)
        .reduce((total, t) => total + wordDelay(t, wpm, smart), 0),
    [tokens, index, wpm, smart],
  );

  function toggle() {
    if (!tokens.length) return;
    if (done) setIndex(0);
    setPlaying(!playing);
  }
  function seek(direction: -1 | 1) {
    setPlaying(false);
    setIndex(sentencePosition(tokens, position, direction));
  }

  useEffect(() => {
    if (!playing || !token || modalOpen) return;
    const timer = window.setTimeout(
      () => {
        if (index + 1 >= tokens.length) {
          setPlaying(false);
          setIndex(tokens.length);
        } else setIndex(index + 1);
      },
      wordDelay(token, wpm, smart),
    );
    return () => window.clearTimeout(timer);
  }, [
    playing,
    token,
    index,
    tokens.length,
    wpm,
    smart,
    modalOpen,
    setIndex,
    setPlaying,
  ]);

  useEffect(() => {
    function hidden() {
      if (document.hidden) setPlaying(false);
    }
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, [setPlaying]);

  useEffect(() => {
    if (!focus) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sectionRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [focus]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (focus && event.code === "Tab") {
        const controls = [
          ...(sectionRef.current?.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input:not(:disabled), [href]",
          ) ?? []),
        ].filter((el) => el.offsetParent !== null);
        const first = controls[0],
          last = controls[controls.length - 1];
        if (
          event.shiftKey &&
          (target === first || target === sectionRef.current)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (
          !event.shiftKey &&
          (target === last || target === sectionRef.current)
        ) {
          event.preventDefault();
          first?.focus();
        }
      }
      if (!modalOpen && event.code === "Escape") {
        setFocus(false);
        setPlaying(false);
        return;
      }
      if (
        modalOpen ||
        target.closest(
          "input, textarea, select, [contenteditable=true], [role=tab]",
        )
      )
        return;
      if (event.code === "Space" && !target.closest("button")) {
        event.preventDefault();
        toggle();
      }
      if (event.code === "ArrowLeft") {
        event.preventDefault();
        seek(-1);
      }
      if (event.code === "ArrowRight") {
        event.preventDefault();
        seek(1);
      }
      if (event.code === "ArrowUp") {
        event.preventDefault();
        setWpm((v) => Math.min(700, v + 25));
      }
      if (event.code === "ArrowDown") {
        event.preventDefault();
        setWpm((v) => Math.max(100, v - 25));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <section
      ref={sectionRef}
      tabIndex={focus ? -1 : undefined}
      role={focus ? "dialog" : undefined}
      aria-modal={focus || undefined}
      className={`reader-column ${focus ? "is-focused" : ""}`}
      aria-label="One word reader"
    >
      {focus && (
        <div className="focus-toolbar">
          <span className="brand">
            <i className="brand-mark">
              <b />
              <b />
              <b />
            </i>
            suprima
            <span className="focus-brand-label">Your moment of focus</span>
          </span>
          <button
            className="subtle-button"
            onClick={() => {
              setFocus(false);
              setPlaying(false);
            }}
          >
            <ArrowLeft size={16} />
            Back to workspace
            <X size={16} />
          </button>
        </div>
      )}
      <div className="reader-card">
        <div className="reader-top">
          <span className="eyebrow">
            <span className="live-dot" />
            THE FOCUS READER
          </span>
          <button
            className="icon-button light"
            aria-label={focus ? "Exit focus view" : "Enter focus view"}
            title={focus ? "Exit focus view" : "Enter focus view"}
            onClick={() => setFocus(!focus)}
          >
            {focus ? <X size={17} /> : <Expand size={17} />}
          </button>
        </div>
        <div className="reading-label">
          {brief
            ? `${String(section + 1).padStart(2, "0")} / ${String(brief.sections.length).padStart(2, "0")} · ${brief.sections[section]?.heading}`
            : "A little space for your next big idea"}
        </div>
        <div className="word-stage" aria-hidden="true">
          <span className="anchor-notch top" />
          <div
            className="reading-word"
            style={{
              fontSize:
                token && [...token.word].length > 18
                  ? "clamp(20px, 2.8vw, 35px)"
                  : undefined,
            }}
          >
            <span className="word-before">{before}</span>
            <span className="word-pivot">{pivot}</span>
            <span className="word-after">{after}</span>
          </div>
          <span className="anchor-notch bottom" />
        </div>
        <div className="reader-caption" role="status">
          {done ? (
            <>
              <Check size={14} /> Reading complete. Let the ideas settle.
            </>
          ) : playing ? (
            "One word. One moment. Keep going."
          ) : kind === "example" && brief ? (
            "A prepared example. Press play to try it."
          ) : (
            "Settle in. Start when you're ready."
          )}
        </div>
        <div className="playback-controls">
          <button
            className="icon-button light"
            aria-label="Restart reading"
            title="Restart reading"
            disabled={!tokens.length}
            onClick={() => {
              setIndex(0);
              setPlaying(false);
            }}
          >
            <RotateCcw size={17} />
          </button>
          <button
            className="icon-button light"
            aria-label="Previous sentence"
            title="Previous sentence (←)"
            disabled={!tokens.length}
            onClick={() => seek(-1)}
          >
            <SkipBack size={20} />
          </button>
          <button
            className="play-button"
            aria-label={
              playing ? "Pause reading" : done ? "Read again" : "Play reading"
            }
            disabled={!tokens.length}
            onClick={toggle}
          >
            {playing ? (
              <Pause size={23} fill="currentColor" />
            ) : (
              <Play size={23} fill="currentColor" />
            )}
          </button>
          <button
            className="icon-button light"
            aria-label="Next sentence"
            title="Next sentence (→)"
            disabled={!tokens.length}
            onClick={() => seek(1)}
          >
            <SkipForward size={20} />
          </button>
          <span className="controls-spacer" />
        </div>
        <div className="reading-progress">
          <input
            aria-label="Reading position"
            type="range"
            min="0"
            max={Math.max(1, tokens.length - 1)}
            value={position}
            disabled={!tokens.length}
            style={
              {
                "--progress": `${tokens.length ? (done ? 100 : (position / Math.max(1, tokens.length - 1)) * 100) : 0}%`,
              } as React.CSSProperties
            }
            onChange={(e) => {
              setIndex(Number(e.target.value));
              setPlaying(false);
            }}
          />
          <div>
            <span>
              {tokens.length ? (done ? tokens.length : index + 1) : 0}{" "}
              <span className="dim">of {tokens.length} words</span>
            </span>
            <span>
              {formatTime(remaining)} <span className="dim">left</span>
            </span>
          </div>
        </div>
        <div className="speed-controls">
          <div>
            <label htmlFor="speed">Reading pace</label>
            <span className="speed-value">
              {wpm}
              <small> WPM</small>
            </span>
          </div>
          <input
            id="speed"
            type="range"
            min="100"
            max="700"
            step="25"
            value={wpm}
            onChange={(e) => setWpm(Number(e.target.value))}
          />
          <div className="speed-labels">
            <span>Take it slow</span>
            <span>Find your flow</span>
          </div>
        </div>
        <label className="pause-setting">
          <span>
            <span className="setting-title">Thoughtful pauses</span>
            <small>Extra time for punctuation and longer words</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={smart}
            onChange={(e) => setSmart(e.target.checked)}
          />
          <span className="switch" aria-hidden="true" />
        </label>
      </div>
      <div className="shortcut-hint">
        <kbd>space</kbd> play / pause <span>·</span> <kbd>←</kbd>
        <kbd>→</kbd> move by sentence
      </div>
      {brief && (
        <div className="reading-path">
          <div className="path-heading">
            <h3>Your reading path</h3>
            <span>{brief.sections.length} ideas</span>
          </div>
          {brief.sections.map((s, i) => (
            <button
              className={`path-item ${i === section ? "active" : ""}`}
              key={i}
              onClick={() => {
                setPlaying(false);
                setIndex(tokens.findIndex((t) => t.section === i));
              }}
            >
              <span className="path-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{s.heading}</span>
              <span className="path-duration">
                {formatTime(
                  tokens
                    .filter((t) => t.section === i)
                    .reduce((ms, t) => ms + wordDelay(t, wpm, smart), 0),
                )}
              </span>
            </button>
          ))}
        </div>
      )}
      {focus && (
        <div className="focus-bottom">
          There is no rush. Understanding sets the pace.
        </div>
      )}
    </section>
  );
}
