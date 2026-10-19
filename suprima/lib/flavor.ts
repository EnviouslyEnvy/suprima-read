import type { Detail } from "./reading";

const FLAVOR_KEY = "suprima-flavor";
export const HOME_TITLE = "Suprima — A clearer way to read";

export function loadFlavor(): boolean | null {
  try {
    const stored = localStorage.getItem(FLAVOR_KEY);
    if (stored === "1") return true;
    if (stored === "0") return false;
    return null;
  } catch {
    return null;
  }
}

export function storeFlavor(flavor: boolean) {
  try {
    localStorage.setItem(FLAVOR_KEY, flavor ? "1" : "0");
  } catch {}
}

export function pick(flavor: boolean, plain: string, fancy: string) {
  return flavor ? fancy : plain;
}

export function workspaceTitle(name: string) {
  return `Suprima - ${name.trim() || "Workspace"}`;
}

const depthLabels: Record<Detail, [string, string]> = {
  quick: ["Short", "The essentials"],
  balanced: ["Balanced", "Balanced"],
  deep: ["In depth", "In depth"],
};

export function depthLabel(id: Detail, flavor: boolean) {
  const [plain, fancy] = depthLabels[id];
  return pick(flavor, plain, fancy);
}
