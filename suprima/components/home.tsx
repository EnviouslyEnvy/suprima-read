"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3 } from "lucide-react";
import Brand from "./brand";
import DepthPanel from "./depth-panel";
import Reader from "./reader";
import SourceEditor from "./source-editor";
import { Notices, ReadingDialogs } from "./overlays";
import { FlavorProvider, FlavorToggle, useFlavor } from "./use-flavor";
import { useReading } from "./use-reading";
import { HOME_TITLE } from "@/lib/flavor";
import { storeHandoff } from "@/lib/library";
import { formatTime } from "@/lib/reading";

export default function Home() {
  return (
    <FlavorProvider defaultOn>
      <HomeScreen />
    </FlavorProvider>
  );
}

function HomeScreen() {
  const reading = useReading({ hasExample: true });
  const { flavor } = useFlavor();
  const router = useRouter();
  const isModalOpen = reading.evidence !== null || reading.passwordPrompt;

  useEffect(() => {
    document.title = HOME_TITLE;
  }, []);

  function continueInWorkspace() {
    storeHandoff(reading.snapshot());
    router.push("/workspace");
  }

  return (
    <div className="home-shell">
      <header className="home-header">
        <Brand href="/" />
        <nav className="home-nav" aria-label="Main navigation">
          <FlavorToggle />
          <Link className="primary-button" href="/workspace">
            Open workspace
            <ArrowRight size={15} />
          </Link>
        </nav>
      </header>
      <main id="main-content" className="main-content">
        <div className={`page-heading ${flavor ? "" : "is-plain"}`}>
          <div>
            {flavor && (
              <div className="eyebrow">
                <span className="small-line" />A CLEARER WAY TO READ
              </div>
            )}
            <h1>
              Big ideas.
              <br />
              <em>One word at a time.</em>
            </h1>
            {flavor && (
              <p>
                Turn a wall of text into a clear train of thought. Then give it
                your undivided attention.
              </p>
            )}
          </div>
          {flavor && (
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
          )}
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
              text={
                flavor
                  ? "An article, an essay, a thought worth your time."
                  : undefined
              }
            />
            <SourceEditor reading={reading} />
            <div className="depth-heading">
              <span className="step-number">02</span>
              <h2>Choose your depth</h2>
              {flavor && (
                <span className="depth-note">Keep what matters to you</span>
              )}
            </div>
            <DepthPanel reading={reading} />
          </section>
          <div className="reader-wrapper">
            <StepHeading
              number="03"
              title="Find your focus"
              text={
                flavor ? "One place to look. Your pace to choose." : undefined
              }
            />
            <Reader reading={reading} modalOpen={isModalOpen} />
          </div>
        </div>
        <div className="workspace-footer">
          {flavor && (
            <div className="footer-thought">
              <span className="tiny-brand" aria-hidden="true">
                ≋
              </span>
              Understanding is the destination. Speed is just a setting.
            </div>
          )}
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
  text?: string;
}) {
  return (
    <div className="step-heading">
      <span className="step-number">{number}</span>
      <div>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
    </div>
  );
}
