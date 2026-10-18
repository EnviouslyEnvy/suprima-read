"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleHelp, Clock3 } from "lucide-react";
import Brand from "./brand";
import DepthPanel from "./depth-panel";
import Reader from "./reader";
import SourceEditor from "./source-editor";
import { HelpDialog, Notices, ReadingDialogs } from "./overlays";
import { useReading } from "./use-reading";
import { storeHandoff } from "@/lib/library";
import { formatTime } from "@/lib/reading";

export default function Home() {
  const reading = useReading({ hasExample: true });
  const router = useRouter();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const isModalOpen =
    isHelpOpen || reading.evidence !== null || reading.passwordPrompt;

  function continueInWorkspace() {
    storeHandoff(reading.snapshot());
    router.push("/workspace");
  }

  return (
    <div className="home-shell">
      <header className="home-header">
        <Brand href="/" />
        <nav className="home-nav" aria-label="Main navigation">
          <button
            className="subtle-button"
            onClick={() => {
              setIsHelpOpen(true);
              reading.setPlaying(false);
            }}
          >
            <CircleHelp size={16} />
            <span className="desktop-only">A little guidance</span>
          </button>
          <Link className="primary-button" href="/workspace">
            Open workspace
            <ArrowRight size={15} />
          </Link>
        </nav>
      </header>
      <main id="main-content" className="main-content">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="small-line" />A CLEARER WAY TO READ
            </div>
            <h1>
              Big ideas.
              <br />
              <em>One word at a time.</em>
            </h1>
            <p>
              Turn a wall of text into a clear train of thought. Then give it
              your undivided attention.
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

        <Notices reading={reading} />

        <div className="workspace-grid">
          <section
            className="preparation-column"
            aria-label="Prepare a reading"
          >
            <StepHeading
              number="01"
              title="Bring your words"
              text="An article, an essay, a thought worth your time."
            />
            <SourceEditor reading={reading} />
            <div className="depth-heading">
              <span className="step-number">02</span>
              <h2>Choose your depth</h2>
              <span>Keep what matters to you</span>
            </div>
            <DepthPanel reading={reading} />
          </section>
          <div className="reader-wrapper">
            <StepHeading
              number="03"
              title="Find your focus"
              text="One place to look. Your pace to choose."
            />
            <Reader reading={reading} modalOpen={isModalOpen} />
          </div>
        </div>
        <div className="workspace-footer">
          <div className="footer-thought">
            <span className="tiny-brand" aria-hidden="true">
              ≋
            </span>
            Understanding is the destination. Speed is just a setting.
          </div>
          <div className="reading-stats">
            {reading.brief && (
              <span>
                <Clock3 size={13} />
                {formatTime(reading.readingTime)} reading
              </span>
            )}
            {reading.reduction > 0 && (
              <span>{reading.reduction}% fewer words</span>
            )}
            <button className="text-button" onClick={continueInWorkspace}>
              Continue in workspace
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </main>
      {isHelpOpen && <HelpDialog onClose={() => setIsHelpOpen(false)} />}
      <ReadingDialogs reading={reading} />
    </div>
  );
}

function StepHeading({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="step-heading">
      <span className="step-number">{number}</span>
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  );
}
