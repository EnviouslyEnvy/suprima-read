"use client";

import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  FileText,
  Layers,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { details, type Detail } from "@/lib/reading";
import type { Reading } from "./use-reading";

export default function DepthPanel({
  reading,
  isStacked = false,
}: {
  reading: Reading;
  isStacked?: boolean;
}) {
  const { busy, detail, source } = reading;

  return (
    <div className={`depth-panel ${isStacked ? "stacked" : ""}`}>
      <div
        className="depth-options"
        role="group"
        aria-label="Reading depth"
      >
        {details.map((d) => (
          <button
            key={d.id}
            className={`depth-option ${detail === d.id ? "selected" : ""}`}
            disabled={busy}
            aria-pressed={detail === d.id}
            onClick={() => reading.setDetail(d.id)}
          >
            <span className="depth-icon">{depthIcons[d.id]}</span>
            <span className="depth-text">
              <strong>{d.label}</strong>
              <small>{d.description}</small>
            </span>
          </button>
        ))}
      </div>
      <button
        className="prepare-button"
        disabled={busy || source.trim().length < 80}
        onClick={() => reading.prepare()}
      >
        {busy ? (
          <LoaderCircle size={18} className="spin" />
        ) : (
          <Sparkles size={18} />
        )}
        <span>{busy ? "Finding the thread…" : "Prepare my reading"}</span>
        {!busy && <ArrowRight size={18} />}
      </button>
      {busy ? (
        <button className="cancel-button" onClick={reading.cancelPrepare}>
          Cancel preparation
        </button>
      ) : (
        <div className="preparation-note">
          <span>Or skip the brief and keep every word.</span>
          <button
            className="text-button"
            onClick={reading.readOriginal}
            disabled={!source.trim()}
          >
            Read original
            <ArrowUpRight size={12} />
          </button>
        </div>
      )}
      <p className="privacy-note">
        <ShieldCheck size={13} />
        Preparing a brief sends this text to the AI service. Saving stays in
        this browser.
      </p>
    </div>
  );
}

const depthIcons: Record<Detail, React.ReactNode> = {
  quick: <FileText size={16} />,
  balanced: <Layers size={16} />,
  deep: <BookOpen size={16} />,
};
