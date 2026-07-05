"use client";
// src/components/ThemeSync.tsx

import { useEffect } from "react";
import { BUILTIN_THEMES, applyTheme } from "../lib/themes";
import { loadSettings, loadCustomThemes } from "../lib/settings";

/**
 * The dashboard page (`/`) applies the saved theme itself, since it also
 * needs to react live to theme switching. Every other route just needs the
 * saved theme applied once on mount — this component does that so pages
 * like /projects don't fall back to the default CSS values in globals.css.
 */
export function ThemeSync() {
  useEffect(() => {
    const settings = loadSettings();
    const customThemes = loadCustomThemes();
    const allThemes = [...BUILTIN_THEMES, ...customThemes];
    const active = allThemes.find(t => t.name === settings.themeName) ?? BUILTIN_THEMES[0];
    applyTheme(active.colors);
  }, []);

  return null;
}