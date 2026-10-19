"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { loadFlavor, storeFlavor } from "@/lib/flavor";

const FlavorContext = createContext<{
  flavor: boolean;
  setFlavor: (flavor: boolean) => void;
} | null>(null);

export function FlavorProvider({
  defaultOn,
  children,
}: {
  defaultOn: boolean;
  children: React.ReactNode;
}) {
  const [flavor, setFlavorState] = useState(defaultOn);

  useEffect(() => {
    const stored = loadFlavor();
    if (stored !== null) setFlavorState(stored);
  }, []);

  function setFlavor(next: boolean) {
    setFlavorState(next);
    storeFlavor(next);
  }

  return (
    <FlavorContext.Provider value={{ flavor, setFlavor }}>
      {children}
    </FlavorContext.Provider>
  );
}

export function useFlavor() {
  const value = useContext(FlavorContext);
  if (!value) throw new Error("useFlavor must be used within FlavorProvider");
  return value;
}

export function FlavorToggle() {
  const { flavor, setFlavor } = useFlavor();

  return (
    <label className="flavor-toggle" title="Show extra wording">
      <span>Flavor</span>
      <input
        className="sr-only"
        type="checkbox"
        role="switch"
        checked={flavor}
        onChange={(event) => setFlavor(event.target.checked)}
      />
      <span className="switch" aria-hidden="true" />
    </label>
  );
}
