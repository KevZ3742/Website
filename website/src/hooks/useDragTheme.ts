import { useEffect, useRef, useState } from "react";
import { parseSVGTheme, type ThemeEntry } from "../lib/themes";
import type { Settings } from "../lib/settings";

interface UseDragThemeOptions {
  allThemes:        ThemeEntry[];
  customThemes:     ThemeEntry[];
  settings:         Settings;
  saveCustomThemes: (themes: ThemeEntry[]) => void;
  saveSettings:     (s: Settings) => void;
  // FIX 1: external ref indicating a select-tool handle is currently being dragged
  handleDragActiveRef?: React.RefObject<boolean>;
}

export function useDragTheme({
  allThemes,
  customThemes,
  settings,
  saveCustomThemes,
  saveSettings,
  handleDragActiveRef,
}: UseDragThemeOptions) {
  const [isDragging, setIsDragging] = useState(false);
  // Track whether this is a file drag (has Files in dataTransfer) vs pointer drag
  const isFileDragRef = useRef(false);

  useEffect(() => {
    const onOver  = (e: DragEvent) => {
      // Only show the drop overlay for actual file drags, not pointer-captured handle drags
      const hasFiles = e.dataTransfer?.types?.includes("Files") ?? false;
      if (!hasFiles) return;
      // Also suppress if a select handle is actively being dragged
      if (handleDragActiveRef?.current) return;
      e.preventDefault();
      isFileDragRef.current = true;
      setIsDragging(true);
    };
    const onLeave = (e: DragEvent) => {
      if (!e.relatedTarget) {
        setIsDragging(false);
        isFileDragRef.current = false;
      }
    };
    const onDrop  = async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      isFileDragRef.current = false;

      // FIX 1: never process a drop while a handle is being dragged
      if (handleDragActiveRef?.current) return;

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
  }, [allThemes, customThemes, settings, saveCustomThemes, saveSettings, handleDragActiveRef]);

  return isDragging;
}