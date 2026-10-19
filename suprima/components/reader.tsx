"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  Check,
  ChevronDown,
  Expand,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { pick } from "@/lib/flavor";
import {
  focusParts,
  formatTime,
  sentencePosition,
  wordDelay,
} from "@/lib/reading";
import type { Reading } from "./use-reading";
import { useFlavor } from "./use-flavor";

type Playback = ReturnType<typeof usePlayback>;
type PartProps = { reading: Reading; playback: Playback };

export default function Reader({
  reading,
  modalOpen,
  isSaved = false,
  onSave,
}: {
  reading: Reading;
  modalOpen: boolean;
  isSaved?: boolean;
  onSave?: () => void;
}) {
  const playback = usePlayback(reading, modalOpen);
  const { flavor } = useFlavor();
  const { brief, tokens, focus } = reading;

  return (
    <>
      <section className="reader-card" aria-label="One word reader">
        <div className="reader-top">
          <span className="eyebrow">
            <span className="live-dot" />
            {pick(flavor, "Reader", "THE FOCUS READER")}
          </span>
          <div className="reader-actions">
            {onSave && brief && (
              <button
                className="icon-button light"
                onClick={onSave}
                aria-label="Save reading to library"
                title="Save reading and current position"
              >
                <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} />
              </button>
            )}
            <button
              className="focus-button"
              disabled={!tokens.length}
              onClick={() => reading.setFocus(true)}
              title="Focus view (F)"
            >
              <Expand size={14} />
              Focus
            </button>
          </div>
        </div>
        <SectionPicker reading={reading} playback={playback} />
        <WordStage word={playback.token?.word} />
        <div className="reader-caption" role="status">
          {playback.done ? (
            <>
              <Check size={14} />{" "}
              {pick(
                flavor,
                "Reading complete.",
                "Reading complete. Let the ideas settle.",
              )}
            </>
          ) : reading.playing ? (
            flavor ? "One word. One moment. Keep going." : null
          ) : reading.kind === "example" && brief ? (
            pick(
              flavor,
              "Example. Press play.",
              "A prepared example. Press play to try it.",
            )
          ) : brief ? (
            flavor ? "Settle in. Start when you're ready." : null
          ) : (
            "Prepare a brief, or read the original, to begin."
          )}
        </div>
        <div className="reader-body">
          <PlaybackControls reading={reading} playback={playback} />
          <ReadingProgress reading={reading} playback={playback} />
          <ReaderSettings reading={reading} />
          <div className="shortcut-hint">
            <kbd>space</kbd> play / pause <span>·</span> <kbd>←</kbd>
            <kbd>→</kbd> sentence <span>·</span> <kbd>f</kbd> focus
          </div>
        </div>
      </section>
      {focus && <FocusScreen reading={reading} playback={playback} />}
    </>
  );
}

function FocusScreen({ reading, playback }: PartProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const { flavor } = useFlavor();
  const isIdle = useIdle(reading.playing);

  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>(".play-button")?.focus();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={`focus-screen ${isIdle ? "is-idle" : ""}`}
      aria-label="Focus reader"
      onClose={() => {
        if (!ref.current?.open) playback.exitFocus();
      }}
    >
      <WordStage word={playback.token?.word} />
      {playback.done && (
        <p className="focus-done" role="status">
          <Check size={15} />{" "}
          {pick(
            flavor,
            "Reading complete.",
            "Reading complete. Let the ideas settle.",
          )}
        </p>
      )}
      <header className="focus-chrome focus-header">
        <SectionPicker reading={reading} playback={playback} />
        <button className="focus-exit" onClick={playback.exitFocus}>
          <X size={16} />
          Exit
          <kbd>esc</kbd>
        </button>
      </header>
      <footer className="focus-chrome focus-footer">
        <ReadingProgress reading={reading} playback={playback} />
        <PlaybackControls reading={reading} playback={playback} />
        <ReaderSettings reading={reading} />
      </footer>
    </dialog>
  );
}

function SectionPicker({ reading, playback }: PartProps) {
  const { flavor } = useFlavor();
  const { brief } = reading;
  if (!brief)
    return (
      <div className="reading-label">
        {pick(flavor, "No reading", "A little space for your next big idea")}
      </div>
    );
  const total = pad(brief.sections.length);

  return (
    <label className="reading-label section-picker">
      <span className="sr-only">Jump to section</span>
      <select
        value={playback.section}
        onChange={(e) => playback.jumpToSection(Number(e.target.value))}
      >
        {brief.sections.map((s, i) => (
          <option key={i} value={i}>
            {`${pad(i + 1)} / ${total} · ${s.heading}`}
          </option>
        ))}
      </select>
      <ChevronDown size={12} aria-hidden="true" />
    </label>
  );
}

function WordStage({ word }: { word?: string }) {
  const { before, focus, after } = focusParts(word || "clarity");

  return (
    <div className="word-stage" aria-hidden="true">
      <span className="anchor-notch top" />
      <div
        className={`reading-word ${word && [...word].length > 18 ? "is-long" : ""}`}
      >
        <span className="word-before">{before}</span>
        <span className="word-pivot">{focus}</span>
        <span className="word-after">{after}</span>
      </div>
      <span className="anchor-notch bottom" />
    </div>
  );
}

function PlaybackControls({ reading, playback }: PartProps) {
  const { playing, tokens } = reading;
  const isEmpty = !tokens.length;

  return (
    <div className="playback-controls">
      <button
        className="icon-button light"
        aria-label="Restart reading"
        title="Restart reading"
        disabled={isEmpty}
        onClick={playback.restart}
      >
        <RotateCcw size={17} />
      </button>
      <button
        className="icon-button light"
        aria-label="Previous sentence"
        title="Previous sentence (←)"
        disabled={isEmpty}
        onClick={() => playback.seek(-1)}
      >
        <SkipBack size={20} />
      </button>
      <button
        className="play-button"
        aria-label={
          playing
            ? "Pause reading"
            : playback.done
              ? "Read again"
              : "Play reading"
        }
        disabled={isEmpty}
        onClick={playback.toggle}
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
        disabled={isEmpty}
        onClick={() => playback.seek(1)}
      >
        <SkipForward size={20} />
      </button>
      <span className="controls-spacer" />
    </div>
  );
}

function ReadingProgress({ reading, playback }: PartProps) {
  const { tokens, index } = reading;
  const { done, position } = playback;
  const progress = tokens.length
    ? done
      ? 100
      : (position / Math.max(1, tokens.length - 1)) * 100
    : 0;

  return (
    <div className="reading-progress">
      <input
        aria-label="Reading position"
        type="range"
        min="0"
        max={Math.max(1, tokens.length - 1)}
        value={position}
        disabled={!tokens.length}
        style={{ "--progress": `${progress}%` } as React.CSSProperties}
        onChange={(e) => playback.jump(Number(e.target.value))}
      />
      <div>
        <span>
          {tokens.length ? (done ? tokens.length : index + 1) : 0}{" "}
          <span className="dim">of {tokens.length} words</span>
        </span>
        <span>
          {formatTime(playback.remaining)} <span className="dim">left</span>
        </span>
      </div>
    </div>
  );
}

function ReaderSettings({ reading }: { reading: Reading }) {
  const speedId = useId();
  const { flavor } = useFlavor();
  const { wpm, smart } = reading;

  return (
    <div className="reader-settings">
      <div className="speed-controls">
        <div>
          <label htmlFor={speedId}>Reading pace</label>
          <span className="speed-value">
            {wpm}
            <small> WPM</small>
          </span>
        </div>
        <input
          id={speedId}
          type="range"
          min="100"
          max="700"
          step="25"
          value={wpm}
          onChange={(e) => reading.setWpm(Number(e.target.value))}
        />
      </div>
      <label className="pause-setting">
        <span>
          <span className="setting-title">
            {pick(flavor, "Pause on punctuation", "Thoughtful pauses")}
          </span>
          <small>Extra time for punctuation and longer words</small>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={smart}
          onChange={(e) => reading.setSmart(e.target.checked)}
        />
        <span className="switch" aria-hidden="true" />
      </label>
    </div>
  );
}

function usePlayback(reading: Reading, modalOpen: boolean) {
  const {
    tokens,
    index,
    setIndex,
    playing,
    setPlaying,
    wpm,
    setWpm,
    smart,
    focus,
    setFocus,
  } = reading;
  const token = tokens[index];
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
  function jump(to: number) {
    setPlaying(false);
    setIndex(to);
  }
  function seek(direction: -1 | 1) {
    jump(sentencePosition(tokens, position, direction));
  }
  function restart() {
    jump(0);
  }
  function jumpToSection(target: number) {
    jump(Math.max(0, tokens.findIndex((t) => t.section === target)));
  }
  function exitFocus() {
    setFocus(false);
    setPlaying(false);
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
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (
        modalOpen ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        target.closest(
          "input, textarea, select, [contenteditable=true], [role=tab]",
        )
      )
        return;
      const actions: Record<string, () => void> = {
        ArrowLeft: () => seek(-1),
        ArrowRight: () => seek(1),
        ArrowUp: () => setWpm((v) => Math.min(700, v + 25)),
        ArrowDown: () => setWpm((v) => Math.max(100, v - 25)),
        KeyF: () => (focus ? exitFocus() : tokens.length && setFocus(true)),
      };
      if (event.code === "Space" && !target.closest("button"))
        actions.Space = toggle;
      const action = actions[event.code];
      if (!action) return;
      event.preventDefault();
      action();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return {
    token,
    done,
    position,
    section,
    remaining,
    toggle,
    jump,
    seek,
    restart,
    jumpToSection,
    exitFocus,
  };
}

function useIdle(isActive: boolean, delay = 2200) {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    let timer = window.setTimeout(() => setIsIdle(true), delay);
    function wake() {
      setIsIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIsIdle(true), delay);
    }
    window.addEventListener("pointermove", wake);
    window.addEventListener("keydown", wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("keydown", wake);
      setIsIdle(false);
    };
  }, [isActive, delay]);

  return isActive && isIdle;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
