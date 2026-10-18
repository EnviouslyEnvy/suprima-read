"use client";

import { useState } from "react";
import { ArrowRight, Check, FileText, X } from "lucide-react";
import Dialog from "./dialog";
import type { Reading } from "./use-reading";

export function Notices({ reading }: { reading: Reading }) {
  const { error, notice } = reading;

  return (
    <>
      {error && (
        <div className="alert error" role="alert">
          <span>{error}</span>
          <button
            className="icon-button"
            onClick={() => reading.setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={16} />
          {notice}
        </div>
      )}
    </>
  );
}

export function ReadingDialogs({ reading }: { reading: Reading }) {
  const { brief, evidence, passwordPrompt } = reading;

  return (
    <>
      {evidence !== null && brief && (
        <EvidenceDialog reading={reading} section={evidence} />
      )}
      {passwordPrompt && (
        <PasswordDialog
          onClose={() => reading.setPasswordPrompt(false)}
          onSubmit={reading.submitPassword}
        />
      )}
    </>
  );
}

export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="A little guidance" onClose={onClose}>
      <div className="help-content">
        <p className="dialog-intro">
          Make a long read feel a little more approachable.
        </p>
        <ol>
          <li>
            <strong>Bring your words.</strong> Paste text or upload a .txt or
            .md file.
          </li>
          <li>
            <strong>Choose your depth.</strong> Keep the essentials, key
            context, or more nuance.
          </li>
          <li>
            <strong>Review the brief.</strong> Check the wording and open
            source passages for context.
          </li>
          <li>
            <strong>Find your pace.</strong> Start slowly. Pause or revisit any
            sentence when needed.
          </li>
        </ol>
        <div className="help-shortcuts">
          <h3>A few useful shortcuts</h3>
          {shortcuts.map(([keys, label]) => (
            <p key={label}>
              <span>
                {keys.map((key) => (
                  <kbd key={key}>{key}</kbd>
                ))}
              </span>
              <span>{label}</span>
            </p>
          ))}
        </div>
        <p className="help-note">
          A summary can lose nuance. Source links help you check context, but
          are not a guarantee of accuracy. The original is always available.
          This tool does not measure comprehension.
        </p>
      </div>
    </Dialog>
  );
}

function EvidenceDialog({
  reading,
  section,
}: {
  reading: Reading;
  section: number;
}) {
  const heading = reading.brief?.sections[section]?.heading;
  const ids = reading.brief?.sections[section]?.sourceSentences ?? [];

  return (
    <Dialog
      title={`Source · ${heading}`}
      onClose={() => reading.setEvidence(null)}
    >
      <div className="evidence-content">
        <p className="dialog-intro">
          Original passages linked to this idea. Read them in context before
          relying on the brief.
        </p>
        {ids.map((id) => (
          <p key={id}>
            <span className="source-number">{id + 1}</span>
            {reading.sourceSentences[id] || "Source passage unavailable."}
          </p>
        ))}
        <button
          className="primary-button"
          onClick={() => {
            reading.setEvidence(null);
            reading.setTab("source");
          }}
        >
          View the complete original
          <FileText size={16} />
        </button>
      </div>
    </Dialog>
  );
}

function PasswordDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (password: string) => void;
}) {
  const [password, setPassword] = useState("");

  return (
    <Dialog title="Your reading-space password" onClose={onClose}>
      <form
        className="password-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(password);
        }}
      >
        <p className="dialog-intro">
          Enter the password set by the owner of this reading space. It stays
          in memory for this visit.
        </p>
        <label htmlFor="app-password">Password</label>
        <input
          id="app-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="primary-button" type="submit">
          Continue preparation
          <ArrowRight size={16} />
        </button>
      </form>
    </Dialog>
  );
}

const shortcuts: [string[], string][] = [
  [["space"], "Play or pause"],
  [["←", "→"], "Previous or next sentence"],
  [["↑", "↓"], "Adjust speed by 25 WPM"],
  [["f"], "Enter or leave focus view"],
  [["esc"], "Leave focus view"],
];
