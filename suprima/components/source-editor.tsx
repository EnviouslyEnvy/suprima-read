"use client";

import { useRef } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  FileText,
  Sparkles,
  Upload,
} from "lucide-react";
import { details, MAX_SOURCE_LENGTH } from "@/lib/reading";
import type { Reading } from "./use-reading";

export default function SourceEditor({ reading }: { reading: Reading }) {
  const { tab, setTab, brief, busy } = reading;

  return (
    <div className="editor-card">
      <div
        className="editor-tabs"
        role="tablist"
        aria-label="Text views"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          event.stopPropagation();
          const next =
            event.key === "Home"
              ? "source"
              : event.key === "End"
                ? "brief"
                : tab === "source"
                  ? "brief"
                  : "source";
          setTab(next);
          document.getElementById(`${next}-tab`)?.focus();
        }}
      >
        <button
          id="source-tab"
          role="tab"
          aria-selected={tab === "source"}
          aria-controls="source-panel"
          tabIndex={tab === "source" ? 0 : -1}
          className={tab === "source" ? "selected" : ""}
          onClick={() => setTab("source")}
        >
          <FileText size={15} />
          Original text
        </button>
        <button
          id="brief-tab"
          role="tab"
          aria-selected={tab === "brief"}
          aria-controls="brief-panel"
          tabIndex={tab === "brief" ? 0 : -1}
          className={tab === "brief" ? "selected" : ""}
          onClick={() => setTab("brief")}
        >
          <Sparkles size={15} />
          Reading brief{brief && <span className="tab-dot" />}
        </button>
        <button
          className="example-button"
          onClick={reading.loadExample}
          disabled={busy}
        >
          Try an example
          <ArrowUpRight size={12} />
        </button>
      </div>
      {tab === "source" ? (
        <SourcePanel reading={reading} />
      ) : (
        <BriefPanel reading={reading} />
      )}
    </div>
  );
}

function SourcePanel({ reading }: { reading: Reading }) {
  const { source, title, busy } = reading;
  const uploadRef = useRef<HTMLInputElement>(null);

  return (
    <div
      id="source-panel"
      className="source-panel"
      role="tabpanel"
      aria-labelledby="source-tab"
    >
      <label className="sr-only" htmlFor="reading-title">
        Reading title
      </label>
      <input
        id="reading-title"
        className="title-input"
        placeholder="Give this reading a title…"
        maxLength={160}
        value={title}
        disabled={busy}
        onChange={(e) => reading.setTitle(e.target.value)}
      />
      <label className="sr-only" htmlFor="source-text">
        Original text
      </label>
      <textarea
        id="source-text"
        className="source-input"
        placeholder={
          "Paste something you'd like to understand. A long article, a chapter, a research note…\n\nWe'll help you find the thread."
        }
        value={source}
        maxLength={MAX_SOURCE_LENGTH}
        disabled={busy}
        onChange={(e) => reading.changeSource(e.target.value)}
      />
      <div className="editor-footer">
        <span>
          {reading.sourceWords.toLocaleString()} words
          <span className="footer-divider">·</span>
          {source.length.toLocaleString()} / 100,000 characters
        </span>
        <button
          className="text-button"
          onClick={() => uploadRef.current?.click()}
          disabled={busy}
        >
          <Upload size={14} />
          Upload text
        </button>
        <input
          ref={uploadRef}
          className="sr-only"
          type="file"
          tabIndex={-1}
          accept=".txt,.md,.markdown,text/plain,text/markdown"
          aria-label="Upload a text file"
          onChange={async (e) => {
            await reading.uploadFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function BriefPanel({ reading }: { reading: Reading }) {
  const { brief, kind, preparedDetail } = reading;

  return (
    <div
      id="brief-panel"
      role="tabpanel"
      aria-labelledby="brief-tab"
      className="brief-panel"
    >
      {brief ? (
        <>
          <div className="brief-meta">
            <span className="tag">
              {kind === "example"
                ? "Prepared example"
                : kind === "original"
                  ? "Original wording"
                  : details.find((d) => d.id === preparedDetail)?.label}
            </span>
            <button
              className="icon-button"
              aria-label="Download reading brief"
              title="Download reading brief"
              onClick={reading.download}
            >
              <ArrowDownToLine size={16} />
            </button>
          </div>
          <h3>{brief.title}</h3>
          <p className="brief-overview">{brief.overview}</p>
          {brief.sections.map((section, i) => (
            <article className="brief-section" key={i}>
              <h4>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {section.heading}
              </h4>
              <p>{section.text}</p>
              {section.sourceSentences.length > 0 && (
                <button
                  className="source-link"
                  onClick={() => {
                    reading.setEvidence(i);
                    reading.setPlaying(false);
                  }}
                >
                  View source passages
                  <ArrowUpRight size={12} />
                </button>
              )}
            </article>
          ))}
          {brief.takeaways.length > 0 && (
            <div className="takeaways">
              <h4>The ideas to keep</h4>
              {brief.takeaways.map((t, i) => (
                <p key={i}>
                  <Check size={14} />
                  {t}
                </p>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="brief-empty">
          <Sparkles size={28} strokeWidth={1.2} />
          <h3>A clearer version is next.</h3>
          <p>Add your text, choose a depth, and prepare your reading.</p>
          <button className="text-button" onClick={() => reading.setTab("source")}>
            Back to original text
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
