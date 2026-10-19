"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Clock3 } from "lucide-react";
import DepthPanel from "./depth-panel";
import LibraryView from "./library-view";
import Reader from "./reader";
import Sidebar, { type View } from "./sidebar";
import SourceEditor from "./source-editor";
import { HelpDialog, Notices, ReadingDialogs } from "./overlays";
import { FlavorProvider, FlavorToggle, useFlavor } from "./use-flavor";
import { useLibrary } from "./use-library";
import { useReading } from "./use-reading";
import { workspaceTitle } from "@/lib/flavor";
import {
  loadSidebarCollapsed,
  storeSidebarCollapsed,
  takeHandoff,
} from "@/lib/library";
import { formatTime } from "@/lib/reading";

export default function Workspace() {
  return (
    <FlavorProvider defaultOn={false}>
      <WorkspaceScreen />
    </FlavorProvider>
  );
}

function WorkspaceScreen() {
  const reading = useReading({ hasExample: false });
  const { flavor } = useFlavor();
  const library = useLibrary(reading);
  const [view, setView] = useState<View>("workspace");
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCollapsed, toggleSidebar] = useSidebarCollapsed();
  const { restore, setPlaying } = reading;
  const isModalOpen =
    isHelpOpen || reading.evidence !== null || reading.passwordPrompt;

  useEffect(() => {
    const handoff = takeHandoff();
    if (handoff) restore(handoff);
    // A handoff from the home page must be consumed once, on mount only.
  }, []);

  useEffect(() => {
    const article =
      view === "library"
        ? "Reading library"
        : reading.title.trim() || reading.brief?.title.trim() || "Workspace";
    document.title = workspaceTitle(article);
  }, [view, reading.title, reading.brief?.title]);

  function changeView(next: View) {
    setView(next);
    setPlaying(false);
  }

  return (
    <div className={`app-shell ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        view={view}
        libraryCount={library.library.length}
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
        onNew={() => {
          reading.newReading();
          setView("workspace");
        }}
        onView={changeView}
        onHelp={() => {
          setIsHelpOpen(true);
          setPlaying(false);
        }}
      />
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            {flavor && (
              <>
                <span>My space</span>
                <ChevronRight size={13} />
              </>
            )}
            <strong>
              {view === "workspace" ? "Workspace" : "Reading library"}
            </strong>
          </div>
          <div className="topbar-end">
            {view === "workspace" && reading.brief && (
              <div className="reading-stats">
                <span>
                  <Clock3 size={13} />
                  {formatTime(reading.readingTime)} reading
                </span>
                {reading.reduction > 0 && (
                  <span>{reading.reduction}% fewer words</span>
                )}
              </div>
            )}
            <FlavorToggle />
          </div>
        </header>
        <main id="main-content" className="main-content app-content">
          <Notices reading={reading} />
          {view === "library" ? (
            <LibraryView
              library={library.library}
              onOpen={(saved) => {
                library.open(saved);
                setView("workspace");
              }}
              onDelete={library.remove}
              onBack={() => setView("workspace")}
            />
          ) : (
            <>
              <h1 className="sr-only">Workspace</h1>
              <div className="compose-grid">
                <SourceEditor reading={reading} />
                <section
                  className="depth-column"
                  aria-labelledby="depth-heading"
                >
                  <div className="column-heading">
                    <h2 id="depth-heading">Choose your depth</h2>
                    {flavor && <span>Keep what matters</span>}
                  </div>
                  <DepthPanel reading={reading} isStacked />
                </section>
              </div>
              <Reader
                reading={reading}
                modalOpen={isModalOpen}
                isSaved={Boolean(reading.savedId)}
                onSave={library.save}
              />
            </>
          )}
        </main>
      </div>
      {isHelpOpen && <HelpDialog onClose={() => setIsHelpOpen(false)} />}
      <ReadingDialogs reading={reading} />
    </div>
  );
}

function useSidebarCollapsed() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => setIsCollapsed(loadSidebarCollapsed()), []);

  function toggle() {
    const next = !isCollapsed;
    setIsCollapsed(next);
    storeSidebarCollapsed(next);
  }

  return [isCollapsed, toggle] as const;
}
