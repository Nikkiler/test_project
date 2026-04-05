"use client";

import {
  createContext, useContext, useState, useEffect, useRef, ReactNode,
} from "react";
import type { ThemeId, ThemeStrings } from "./theme";
import { THEMES } from "./theme";

interface ThemeCtx {
  themeId: ThemeId;
  t: ThemeStrings;
}

const ThemeContext = createContext<ThemeCtx>({
  themeId: "default",
  t: THEMES.default,
});

export function useTheme(): ThemeCtx {
  return useContext(ThemeContext);
}

// ↑↑↓↓←→←→BA — the classic Konami sequence
const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>("default");
  const themeRef = useRef<ThemeId>("default");

  // Sync ref so the keydown handler always sees the latest value
  useEffect(() => { themeRef.current = themeId; }, [themeId]);

  function applyTheme(id: ThemeId) {
    setThemeId(id);
    document.documentElement.dataset.theme = id;
    localStorage.setItem("chat.theme", id);
  }

  // Restore persisted theme on mount (client-only)
  useEffect(() => {
    const saved = localStorage.getItem("chat.theme") as ThemeId | null;
    if (saved === "wh40k") applyTheme("wh40k");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Konami code listener — ignores key events when an input is focused
  useEffect(() => {
    let seq: string[] = [];

    function onKey(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      seq = [...seq, e.key].slice(-KONAMI.length);
      if (seq.join(",") === KONAMI.join(",")) {
        applyTheme(themeRef.current === "default" ? "wh40k" : "default");
        seq = [];
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ThemeContext.Provider value={{ themeId, t: THEMES[themeId] }}>
      {children}
    </ThemeContext.Provider>
  );
}
