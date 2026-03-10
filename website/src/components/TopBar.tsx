import { useEffect, useRef } from "react";
import type { Settings } from "../lib/settings";
import type { ThemeEntry } from "../lib/themes";
import { SettingsPanel } from "./SettingsPanel";

interface TopBarProps {
  settings:          Settings;
  activeTheme:       ThemeEntry;
  showSettings:      boolean;
  setShowSettings:   (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowThemeModal: (v: boolean) => void;
  saveSettings:      (s: Settings) => void;
}

export function TopBar({
  settings,
  activeTheme,
  showSettings,
  setShowSettings,
  setShowThemeModal,
  saveSettings,
}: TopBarProps) {
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node))
        setShowSettings(false);
    };
    if (showSettings) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showSettings, setShowSettings]);

  return (
    <div className="flex items-center justify-between px-5 border-b border-border bg-surface relative z-10">
      <button className="flex items-center gap-1.5 text-[11px] text-muted border border-border2 px-2.5 py-0.5 tracking-widest hover:text-red-400 hover:border-red-400 transition-colors">
        <span>⎋</span> esc
      </button>

      <span className="text-[10px] text-dim tracking-widest">_</span>

      <div className="relative" ref={settingsRef}>
        <button
          onClick={() => setShowSettings(v => !v)}
          className="flex items-center gap-1.5 text-[11px] text-muted border border-border2 px-2.5 py-0.5 tracking-widest hover:text-tx hover:border-muted transition-colors"
        >
          <span>⚙</span> settings
        </button>

        {showSettings && (
          <SettingsPanel
            settings={settings}
            activeTheme={activeTheme}
            saveSettings={saveSettings}
            onOpenThemeModal={() => {
              setShowSettings(false);
              setShowThemeModal(true);
            }}
          />
        )}
      </div>
    </div>
  );
}