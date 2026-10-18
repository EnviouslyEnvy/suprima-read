"use client";

import Link from "next/link";
import {
  BookOpen,
  CircleHelp,
  House,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from "lucide-react";
import Brand from "./brand";

export type View = "workspace" | "library";

export default function Sidebar({
  view,
  libraryCount,
  isCollapsed,
  onToggle,
  onNew,
  onView,
  onHelp,
}: {
  view: View;
  libraryCount: number;
  isCollapsed: boolean;
  onToggle: () => void;
  onNew: () => void;
  onView: (view: View) => void;
  onHelp: () => void;
}) {
  const label = (text: string) => (isCollapsed ? text : undefined);

  return (
    <aside className="sidebar" aria-label="Sidebar">
      <div className="sidebar-head">
        <Brand href="/" />
      </div>
      <button
        className="new-reading"
        onClick={onNew}
        aria-label={label("New reading")}
        title={label("New reading")}
      >
        <Plus size={17} />
        <span className="nav-text">New reading</span>
      </button>
      <div className="nav-label">YOUR SPACE</div>
      <nav aria-label="Main navigation">
        {navItems.map(({ id, text, icon }) => (
          <button
            key={id}
            className={`nav-item ${view === id ? "active" : ""}`}
            aria-current={view === id ? "page" : undefined}
            aria-label={label(text)}
            title={label(text)}
            onClick={() => onView(id)}
          >
            {icon}
            <span className="nav-text">{text}</span>
            {id === "library" && (
              <span className="nav-count">{libraryCount}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button
          className="nav-item"
          onClick={onHelp}
          aria-label={label("A little guidance")}
          title={label("A little guidance")}
        >
          <CircleHelp size={18} />
          <span className="nav-text">A little guidance</span>
        </button>
        <Link
          className="nav-item"
          href="/"
          aria-label={label("Home")}
          title={label("Home")}
        >
          <House size={18} />
          <span className="nav-text">Home</span>
        </Link>
        <button
          className="nav-item sidebar-toggle"
          onClick={onToggle}
          aria-label={label(isCollapsed ? "Expand sidebar" : "Collapse sidebar")}
          aria-expanded={!isCollapsed}
          title={label(isCollapsed ? "Expand sidebar" : "Collapse sidebar")}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
          <span className="nav-text">
            {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          </span>
        </button>
      </div>
    </aside>
  );
}

const navItems: { id: View; text: string; icon: React.ReactNode }[] = [
  { id: "workspace", text: "Workspace", icon: <Layers size={18} /> },
  { id: "library", text: "Reading library", icon: <BookOpen size={18} /> },
];
