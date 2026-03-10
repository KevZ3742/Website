import { useEffect, useState } from "react";
import { parseSVGTheme, type ThemeEntry } from "../lib/themes";
import type { Settings } from "../lib/settings";

interface UseDragThemeOptions {
  allThemes:        ThemeEntry[];
  customThemes:     ThemeEntry[];
  settings:         Settings;
  saveCustomThemes: (themes: ThemeEntry[]) => void;
  saveSettings:     (s: Settings) => void;
}

export function useDragTheme({
  allThemes,
  customThemes,
  settings,
  saveCustomThemes,
  saveSettings,
}: UseDragThemeOptions) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const onOver  = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onLeave = (e: DragEvent) => { if (!e.relatedTarget) setIsDragging(false); };
    const onDrop  = async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (!file?.name.endsWith(".svg")) return;

      const text   = await file.text();
      const colors = parseSVGTheme(text);
      if (!colors) return;

      const base = file.name.replace(".svg", "");
      let name = base, i = 1;
      while (allThemes.find(t => t.name === name)) name = `${base}-${i++}`;

      const entry: ThemeEntry = { name, display: name, category: "Custom", colors, isCustom: true };
      const updated = [...customThemes, entry];
      saveCustomThemes(updated);
      saveSettings({ ...settings, themeName: name });
    };

    document.addEventListener("dragover",  onOver);
    document.addEventListener("dragleave", onLeave);
    document.addEventListener("drop",      onDrop);
    return () => {
      document.removeEventListener("dragover",  onOver);
      document.removeEventListener("dragleave", onLeave);
      document.removeEventListener("drop",      onDrop);
    };
  }, [allThemes, customThemes, settings, saveCustomThemes, saveSettings]);

  return isDragging;
}