"use client";

import { useEffect, useState } from "react";
import {
  LIBRARY_LIMIT,
  loadLibrary,
  storeLibrary,
  type Saved,
} from "@/lib/library";
import type { Reading } from "./use-reading";

export function useLibrary(reading: Reading) {
  const { setError, setNotice, setSavedId } = reading;
  const [library, setLibrary] = useState<Saved[]>([]);

  useEffect(() => {
    try {
      setLibrary(loadLibrary());
    } catch {
      setError(
        "Your saved readings could not be loaded. Your current workspace is still available.",
      );
    }
  }, [setError]);

  function save() {
    const session = reading.snapshot();
    if (!session.brief) return;
    const record: Saved = {
      ...session,
      brief: session.brief,
      id: reading.savedId || crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [
      record,
      ...library.filter((s) => s.id !== record.id),
    ].slice(0, LIBRARY_LIMIT);
    try {
      storeLibrary(updated);
      setLibrary(updated);
      setSavedId(record.id);
      setNotice("Reading and position saved to this browser.");
    } catch {
      setError(
        "Browser storage is full or unavailable. Download your brief to keep a copy.",
      );
    }
  }
  function remove(id: string) {
    const updated = library.filter((s) => s.id !== id);
    try {
      storeLibrary(updated);
      setLibrary(updated);
      if (id === reading.savedId) setSavedId(null);
      setNotice("Reading removed from this browser.");
    } catch {
      setError(
        "The saved reading could not be removed. Browser storage is unavailable.",
      );
    }
  }
  function open(saved: Saved) {
    reading.restore(saved, saved.id);
  }

  return { library, save, remove, open };
}
