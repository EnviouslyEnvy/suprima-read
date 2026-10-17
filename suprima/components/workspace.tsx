"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  Layers,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { z } from "zod";
import Reader from "./reader";
import Dialog from "./dialog";
import { briefSchema } from "@/lib/brief-schema";
import {
  details,
  formatTime,
  MAX_SOURCE_LENGTH,
  originalBrief,
  sentences,
  tokenize,
  wordCount,
  wordDelay,
  type Brief,
  type Detail,
} from "@/lib/reading";
import { sampleBrief, sampleSource, sampleTitle } from "@/lib/sample";

type Kind = "example" | "ai" | "original";
const storedBriefSchema = briefSchema.extend({
  sections: z
    .array(
      z.object({
        heading: z.string(),
        text: z.string().max(MAX_SOURCE_LENGTH),
        sourceSentences: z.array(z.number().int().nonnegative()),
      }),
    )
    .min(1)
    .max(15),
  takeaways: z.array(z.string()).max(5),
});
const savedSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string().max(MAX_SOURCE_LENGTH),
  brief: storedBriefSchema,
  kind: z.enum(["example", "ai", "original"]),
  detail: z.enum(["quick", "balanced", "deep"]),
  createdAt: z.string().datetime(),
  position: z.number().int().nonnegative(),
  wpm: z.number().min(100).max(700),
  smart: z.boolean(),
});
type Saved = z.infer<typeof savedSchema>;
const LIBRARY_KEY = "suprima-library-v1";

export default function Workspace() {
  const [source, setSource] = useState(sampleSource);
  const [title, setTitle] = useState(sampleTitle);
  const [brief, setBrief] = useState<Brief | null>(sampleBrief);
  const [kind, setKind] = useState<Kind>("example");
  const [detail, setDetail] = useState<Detail>("balanced");
  const [preparedDetail, setPreparedDetail] = useState<Detail>("balanced");
  const [tab, setTab] = useState<"source" | "brief">("source");
  const [view, setView] = useState<"workspace" | "library">("workspace");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [wpm, setWpm] = useState(250);
  const [smart, setSmart] = useState(true);
  const [focus, setFocus] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [library, setLibrary] = useState<Saved[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [evidence, setEvidence] = useState<number | null>(null);
  const [passwordPrompt, setPasswordPrompt] = useState(false);
  const [appPassword, setAppPassword] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LIBRARY_KEY);
      if (stored)
        setLibrary(z.array(savedSchema).max(12).parse(JSON.parse(stored)));
    } catch {
      setError(
        "Your saved readings could not be loaded. Your current workspace is still available.",
      );
    }
    return () => requestRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  function changeSource(value: string) {
    setSource(value);
    setBrief(null);
    setIndex(0);
    setPlaying(false);
    setSavedId(null);
    setError("");
  }
  function newReading() {
    requestRef.current?.abort();
    setBusy(false);
    changeSource("");
    setTitle("");
    setTab("source");
    setView("workspace");
    setFocus(false);
  }
  function loadExample() {
    requestRef.current?.abort();
    setBusy(false);
    setSource(sampleSource);
    setTitle(sampleTitle);
    setBrief(sampleBrief);
    setKind("example");
    setDetail("balanced");
    setPreparedDetail("balanced");
    setPlaying(false);
    setIndex(0);
    setTab("source");
    setSavedId(null);
    setError("");
  }
  function readOriginal() {
    setBrief(originalBrief(source, title));
    setKind("original");
    setIndex(0);
    setPlaying(false);
    setTab("brief");
    setError("");
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
        if (data.needsPassword) {
          setPasswordPrompt(true);
          setPasswordInput("");
        }
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
      setNotice("Text imported. Choose your reading depth below.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "The file could not be read.",
      );
    } finally {
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }

  function saveReading() {
    if (!brief) return;
    const record: Saved = {
      id: savedId || crypto.randomUUID(),
      title: brief.title,
      source,
      brief,
      kind,
      detail: preparedDetail,
      createdAt: new Date().toISOString(),
      position: index,
      wpm,
      smart,
    };
    const updated = [
      record,
      ...library.filter((s) => s.id !== record.id),
    ].slice(0, 12);
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(updated));
      setLibrary(updated);
      setSavedId(record.id);
      setNotice("Reading and position saved to this browser.");
    } catch {
      setError(
        "Browser storage is full or unavailable. Download your brief to keep a copy.",
      );
    }
  }
  function openSaved(saved: Saved) {
    requestRef.current?.abort();
    setBusy(false);
    setSource(saved.source);
    setTitle(saved.title);
    setBrief(saved.brief);
    setKind(saved.kind);
    setDetail(saved.detail);
    setPreparedDetail(saved.detail);
    setIndex(Math.min(saved.position, tokenize(saved.brief.sections).length));
    setWpm(saved.wpm);
    setSmart(saved.smart);
    setSavedId(saved.id);
    setPlaying(false);
    setView("workspace");
    setTab("brief");
    setError("");
  }
  function deleteSaved(id: string) {
    const updated = library.filter((s) => s.id !== id);
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(updated));
      setLibrary(updated);
      if (id === savedId) setSavedId(null);
      setNotice("Reading removed from this browser.");
    } catch {
      setError(
        "The saved reading could not be removed. Browser storage is unavailable.",
      );
    }
  }
  function download() {
    if (!brief) return;
    const text = `${brief.title}\n\n${brief.overview}\n\n${brief.sections.map((s) => `${s.heading}\n${s.text}`).join("\n\n")}\n\n${brief.takeaways.length ? `Key ideas\n${brief.takeaways.map((t) => `• ${t}`).join("\n")}` : ""}`;
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${brief.title.replace(/[^\p{L}\p{N} -]/gu, "").slice(0, 80) || "reading-brief"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Suprima home">
          <i className="brand-mark">
            <b />
            <b />
            <b />
          </i>
          suprima<span className="brand-dot">.</span>
        </a>
        <button className="new-reading" onClick={newReading}>
          <Plus size={17} />
          New reading
        </button>
        <div className="nav-label">YOUR SPACE</div>
        <nav aria-label="Main navigation">
          <button
            className={`nav-item ${view === "workspace" ? "active" : ""}`}
            onClick={() => {
              setView("workspace");
              setPlaying(false);
            }}
          >
            <Layers size={18} />
            Workspace
            <ChevronRight size={14} className="nav-chevron" />
          </button>
          <button
            className={`nav-item ${view === "library" ? "active" : ""}`}
            onClick={() => {
              setView("library");
              setPlaying(false);
            }}
          >
            <BookOpen size={18} />
            Reading library<span className="nav-count">{library.length}</span>
          </button>
        </nav>
        <div className="sidebar-note">
          <div className="note-decoration" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h3>
            Make space
            <br />
            for understanding.
          </h3>
          <p>
            Less scrolling.
            <br />
            More of what stays with you.
          </p>
        </div>
        <div className="sidebar-bottom">
          <button
            className="help-button"
            onClick={() => {
              setHelp(true);
              setPlaying(false);
            }}
          >
            <CircleHelp size={17} />A little guidance
            <ArrowUpRight size={14} />
          </button>
          <div className="local-label">
            <span className="live-dot" />
            Your personal reading space
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span>My space</span>
            <ChevronRight size={13} />
            <strong>
              {view === "workspace" ? "Workspace" : "Reading library"}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="desktop-only">Read with intention.</span>
            <button
              className="icon-button"
              aria-label="Reading guidance"
              title="Reading guidance"
              onClick={() => {
                setHelp(true);
                setPlaying(false);
              }}
            >
              <CircleHelp size={16} />
            </button>
            <div className="profile-mark" aria-label="Personal workspace">
              S
            </div>
          </div>
        </header>
        <main id="main-content" className="main-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="small-line" />
                {view === "workspace"
                  ? "A CLEARER WAY TO READ"
                  : "GOOD IDEAS, KEPT CLOSE"}
              </div>
              <h1>
                {view === "workspace" ? (
                  <>
                    Big ideas.
                    <br />
                    <em>One word at a time.</em>
                  </>
                ) : (
                  <>
                    Your reading
                    <br />
                    <em>collection.</em>
                  </>
                )}
              </h1>
              <p>
                {view === "workspace"
                  ? "Turn a wall of text into a clear train of thought. Then give it your undivided attention."
                  : "Return to an idea, pick up your pace, or start where you left off."}
              </p>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="art-line">
                information
                <span />
              </div>
              <div className="art-line">
                understanding
                <span />
              </div>
              <div className="art-focus">
                clar<span>i</span>ty
                <span className="art-axis" />
              </div>
              <div className="art-caption">LESS NOISE. MORE MEANING.</div>
            </div>
          </div>

          {error && (
            <div className="alert error" role="alert">
              <span>{error}</span>
              <button
                className="icon-button"
                onClick={() => setError("")}
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

          {view === "library" ? (
            <section className="library-section">
              <div className="library-top">
                <span>
                  {library.length} saved{" "}
                  {library.length === 1 ? "reading" : "readings"}
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
                  <p>
                    Save a reading from your workspace to return to it here.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => setView("workspace")}
                  >
                    Back to workspace
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="library-grid">
                  {library.map((saved) => (
                    <article className="saved-card" key={saved.id}>
                      <div className="saved-card-top">
                        <span className="tag">
                          {saved.kind === "original"
                            ? "Original text"
                            : saved.kind === "example"
                              ? "Example brief"
                              : "Reading brief"}
                        </span>
                        <button
                          className="icon-button"
                          aria-label={`Delete ${saved.title}`}
                          onClick={() => deleteSaved(saved.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <h2>{saved.title}</h2>
                      <p>{saved.brief.overview}</p>
                      <div className="saved-meta">
                        <span>
                          {wordCount(
                            saved.brief.sections.map((s) => s.text).join(" "),
                          )}{" "}
                          words
                        </span>
                        <span>
                          {new Date(saved.createdAt).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )}
                        </span>
                      </div>
                      <button
                        className="saved-open"
                        onClick={() => openSaved(saved)}
                      >
                        Continue reading
                        <ArrowUpRight size={18} />
                      </button>
                    </article>
                  ))}
                </div>
              )}
              <p className="library-footnote">
                Up to 12 readings are kept here. Clearing your browser data
                removes them. Download a brief to keep a separate copy.
              </p>
            </section>
          ) : (
            <>
              <div className="workspace-grid">
                <section
                  className="preparation-column"
                  aria-label="Prepare a reading"
                >
                  <div className="step-heading">
                    <span className="step-number">01</span>
                    <div>
                      <h2>Bring your words</h2>
                      <p>An article, an essay, a thought worth your time.</p>
                    </div>
                  </div>
                  <div className="editor-card">
                    <div
                      className="editor-tabs"
                      role="tablist"
                      aria-label="Text views"
                      onKeyDown={(event) => {
                        if (
                          !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                            event.key,
                          )
                        )
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
                        onClick={loadExample}
                        disabled={busy}
                      >
                        Try an example
                        <ArrowUpRight size={12} />
                      </button>
                    </div>
                    {tab === "source" ? (
                      <div
                        id="source-panel"
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
                          onChange={(e) => setTitle(e.target.value)}
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
                          onChange={(e) => changeSource(e.target.value)}
                        />
                        <div className="editor-footer">
                          <span>
                            {sourceWords.toLocaleString()} words
                            <span className="footer-divider">·</span>
                            {source.length.toLocaleString()} / 100,000
                            characters
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
                            onChange={(e) => uploadFile(e.target.files?.[0])}
                          />
                        </div>
                      </div>
                    ) : (
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
                                    : details.find(
                                        (d) => d.id === preparedDetail,
                                      )?.label}
                              </span>
                              <button
                                className="icon-button"
                                aria-label="Download reading brief"
                                title="Download reading brief"
                                onClick={download}
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
                                      setEvidence(i);
                                      setPlaying(false);
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
                            <p>
                              Add your text, choose a depth, and prepare your
                              reading below.
                            </p>
                            <button
                              className="text-button"
                              onClick={() => setTab("source")}
                            >
                              Back to original text
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="depth-heading">
                    <span className="step-number">02</span>
                    <h2>Choose your depth</h2>
                    <span>Keep what matters to you</span>
                  </div>
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
                        onClick={() => setDetail(d.id)}
                      >
                        <div>
                          <span className="depth-icon">
                            {d.id === "quick" ? (
                              <FileText size={16} />
                            ) : d.id === "balanced" ? (
                              <Layers size={16} />
                            ) : (
                              <BookOpen size={16} />
                            )}
                          </span>
                          <span className="radio-dot" />
                        </div>
                        <strong>{d.label}</strong>
                        <small>{d.description}</small>
                      </button>
                    ))}
                  </div>
                  <button
                    className="prepare-button"
                    disabled={busy || source.trim().length < 80}
                    onClick={() => prepare()}
                  >
                    {busy ? (
                      <LoaderCircle size={18} className="spin" />
                    ) : (
                      <Sparkles size={18} />
                    )}
                    <span>
                      {busy ? "Finding the thread…" : "Prepare my reading"}
                    </span>
                    {!busy && <ArrowRight size={18} />}
                  </button>
                  {busy ? (
                    <button
                      className="cancel-button"
                      onClick={() => {
                        requestRef.current?.abort();
                        setBusy(false);
                      }}
                    >
                      Cancel preparation
                    </button>
                  ) : (
                    <div className="preparation-note">
                      <span>
                        Clear wording. Connected ideas. Room to think.
                      </span>
                      <button
                        className="text-button"
                        onClick={readOriginal}
                        disabled={!source.trim()}
                      >
                        Read original
                        <ArrowUpRight size={12} />
                      </button>
                    </div>
                  )}
                  <p className="privacy-note">
                    <ShieldCheck size={13} />
                    Preparing a brief sends this text to the AI service. Saving
                    stays in this browser.
                  </p>
                </section>
                <div className="reader-wrapper">
                  <div className="step-heading reader-step">
                    <span className="step-number">03</span>
                    <div>
                      <h2>Find your focus</h2>
                      <p>One place to look. Your pace to choose.</p>
                    </div>
                    {brief && (
                      <button
                        className="icon-button save-button"
                        onClick={saveReading}
                        aria-label="Save reading to library"
                        title="Save reading and current position"
                      >
                        {savedId ? (
                          <Bookmark size={18} fill="currentColor" />
                        ) : (
                          <Bookmark size={18} />
                        )}
                      </button>
                    )}
                  </div>
                  <Reader
                    brief={brief}
                    kind={kind}
                    index={index}
                    setIndex={setIndex}
                    playing={playing}
                    setPlaying={setPlaying}
                    wpm={wpm}
                    setWpm={setWpm}
                    smart={smart}
                    setSmart={setSmart}
                    focus={focus}
                    setFocus={setFocus}
                    modalOpen={help || evidence !== null || passwordPrompt}
                  />
                </div>
              </div>
              <div className="workspace-footer">
                <div className="footer-thought">
                  <span className="tiny-brand" aria-hidden="true">
                    ≋
                  </span>
                  Understanding is the destination. Speed is just a setting.
                </div>
                {brief && (
                  <div className="reading-stats">
                    <span>
                      <Clock3 size={13} />
                      {formatTime(readingTime)} reading
                    </span>
                    {reduction > 0 && <span>{reduction}% fewer words</span>}
                    <button className="text-button" onClick={saveReading}>
                      {savedId ? <Check size={14} /> : <Bookmark size={14} />}
                      Save reading
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {help && (
        <Dialog title="A little guidance" onClose={() => setHelp(false)}>
          <div className="help-content">
            <p className="dialog-intro">
              Make a long read feel a little more approachable.
            </p>
            <ol>
              <li>
                <strong>Bring your words.</strong> Paste text or upload a .txt
                or .md file.
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
                <strong>Find your pace.</strong> Start slowly. Pause or revisit
                any sentence when needed.
              </li>
            </ol>
            <div className="help-shortcuts">
              <h3>A few useful shortcuts</h3>
              <p>
                <kbd>space</kbd>
                <span>Play or pause</span>
              </p>
              <p>
                <span>
                  <kbd>←</kbd> <kbd>→</kbd>
                </span>
                <span>Previous or next sentence</span>
              </p>
              <p>
                <span>
                  <kbd>↑</kbd> <kbd>↓</kbd>
                </span>
                <span>Adjust speed by 25 WPM</span>
              </p>
              <p>
                <kbd>esc</kbd>
                <span>Leave focus view</span>
              </p>
            </div>
            <p className="help-note">
              A summary can lose nuance. Source links help you check context,
              but are not a guarantee of accuracy. The original is always
              available. This tool does not measure comprehension.
            </p>
          </div>
        </Dialog>
      )}
      {evidence !== null && brief && (
        <Dialog
          title={`Source · ${brief.sections[evidence]?.heading}`}
          onClose={() => setEvidence(null)}
        >
          <div className="evidence-content">
            <p className="dialog-intro">
              Original passages linked to this idea. Read them in context before
              relying on the brief.
            </p>
            {brief.sections[evidence]?.sourceSentences.map((id) => (
              <p key={id}>
                <span className="source-number">{id + 1}</span>
                {sourceSentences[id] || "Source passage unavailable."}
              </p>
            ))}
            <button
              className="primary-button"
              onClick={() => {
                setEvidence(null);
                setTab("source");
              }}
            >
              View the complete original
              <FileText size={16} />
            </button>
          </div>
        </Dialog>
      )}
      {passwordPrompt && (
        <Dialog
          title="Your reading-space password"
          onClose={() => setPasswordPrompt(false)}
        >
          <form
            className="password-form"
            onSubmit={(event) => {
              event.preventDefault();
              setAppPassword(passwordInput);
              setPasswordPrompt(false);
              prepare(passwordInput);
            }}
          >
            <p className="dialog-intro">
              Enter the password set by the owner of this reading space. It
              stays in memory for this visit.
            </p>
            <label htmlFor="app-password">Password</label>
            <input
              id="app-password"
              type="password"
              autoComplete="current-password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
            />
            <button className="primary-button" type="submit">
              Continue preparation
              <ArrowRight size={16} />
            </button>
          </form>
        </Dialog>
      )}
    </div>
  );
}
