import { z } from "zod";
import { briefSchema } from "./brief-schema";
import { MAX_SOURCE_LENGTH, type Brief } from "./reading";

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
const sessionSchema = z.object({
  title: z.string(),
  source: z.string().max(MAX_SOURCE_LENGTH),
  brief: storedBriefSchema.nullable(),
  kind: z.enum(["example", "ai", "original"]),
  detail: z.enum(["quick", "balanced", "deep"]),
  position: z.number().int().nonnegative(),
  wpm: z.number().min(100).max(700),
  smart: z.boolean(),
});
const savedSchema = sessionSchema.extend({
  id: z.string(),
  brief: storedBriefSchema,
  createdAt: z.string().datetime(),
});
export type Session = z.infer<typeof sessionSchema>;
export type Saved = z.infer<typeof savedSchema>;

const LIBRARY_KEY = "suprima-library-v1";
const HANDOFF_KEY = "suprima-handoff-v1";
const SIDEBAR_KEY = "suprima-sidebar-collapsed";
export const LIBRARY_LIMIT = 12;

export function loadLibrary(): Saved[] {
  const stored = localStorage.getItem(LIBRARY_KEY);
  return stored
    ? z.array(savedSchema).max(LIBRARY_LIMIT).parse(JSON.parse(stored))
    : [];
}
export function storeLibrary(library: Saved[]) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
}

export function storeHandoff(session: Session) {
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(session));
  } catch {}
}
export function takeHandoff(): Session | null {
  try {
    const stored = sessionStorage.getItem(HANDOFF_KEY);
    sessionStorage.removeItem(HANDOFF_KEY);
    return stored ? sessionSchema.parse(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}

export function loadSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
}
export function storeSidebarCollapsed(isCollapsed: boolean) {
  try {
    localStorage.setItem(SIDEBAR_KEY, isCollapsed ? "1" : "0");
  } catch {}
}

export function downloadBrief(brief: Brief) {
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
