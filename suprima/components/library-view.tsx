"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { LIBRARY_LIMIT, type Saved } from "@/lib/library";
import { wordCount } from "@/lib/reading";

export default function LibraryView({
  library,
  onOpen,
  onDelete,
  onBack,
}: {
  library: Saved[];
  onOpen: (saved: Saved) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <section className="library-section" aria-labelledby="library-heading">
      <div className="view-heading">
        <h1 id="library-heading">Reading library</h1>
        <p>Return to an idea, pick up your pace, or start where you left off.</p>
      </div>
      <div className="library-top">
        <span>
          {library.length} saved {library.length === 1 ? "reading" : "readings"}
        </span>
        <span>
          <ShieldCheck size={14} />
          Stored only in this browser
        </span>
      </div>
      {library.length === 0 ? (
        <div className="library-empty">
          <Bookmark size={34} strokeWidth={1.2} />
          <h2>A home for your next good idea.</h2>
          <p>Save a reading from your workspace to return to it here.</p>
          <button className="primary-button" onClick={onBack}>
            Back to workspace
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="library-grid">
          {library.map((saved) => (
            <article className="saved-card" key={saved.id}>
              <div className="saved-card-top">
                <span className="tag">{kindLabels[saved.kind]}</span>
                <button
                  className="icon-button"
                  aria-label={`Delete ${saved.title}`}
                  onClick={() => onDelete(saved.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h2>{saved.title}</h2>
              <p>{saved.brief.overview}</p>
              <div className="saved-meta">
                <span>
                  {wordCount(saved.brief.sections.map((s) => s.text).join(" "))}{" "}
                  words
                </span>
                <span>
                  {new Date(saved.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <button className="saved-open" onClick={() => onOpen(saved)}>
                Continue reading
                <ArrowUpRight size={18} />
              </button>
            </article>
          ))}
        </div>
      )}
      <p className="library-footnote">
        Up to {LIBRARY_LIMIT} readings are kept here. Clearing your browser data
        removes them. Download a brief to keep a separate copy.
      </p>
    </section>
  );
}

const kindLabels: Record<Saved["kind"], string> = {
  original: "Original text",
  example: "Example brief",
  ai: "Reading brief",
};
