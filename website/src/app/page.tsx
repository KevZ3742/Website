"use client";

import { useEffect, useMemo, useState } from "react";

import { BUILTIN_THEMES, applyTheme, type ThemeEntry } from "../lib/themes";
import {
  loadSettings, saveSettingsToStorage,
  loadCustomThemes, saveCustomThemesToStorage,
  type Settings,
} from "../lib/settings";

import { useClock }      from "../hooks/useClock";
import { useWeather }    from "../hooks/useWeather";
import { useDragTheme }  from "../hooks/useDragTheme";

import { TopBar }        from "../components/TopBar";
import { ClockDisplay }  from "../components/ClockDisplay";
import { SearchBar }     from "../components/SearchBar";
import { BottomBar }     from "../components/BottomBar";
import { ThemeModal }    from "../components/ThemeModal";

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [settings,     setSettings]     = useState<Settings>(loadSettings);
  const [customThemes, setCustomThemes] = useState<ThemeEntry[]>(loadCustomThemes);
  const [showSettings,     setShowSettings]     = useState(false);
  const [showThemeModal,   setShowThemeModal]   = useState(false);

  const allThemes   = useMemo(() => [...BUILTIN_THEMES, ...customThemes], [customThemes]);
  const activeTheme = allThemes.find(t => t.name === settings.themeName) ?? BUILTIN_THEMES[0];

  const now                    = useClock();
  const { weather, error: weatherErr } = useWeather();

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const saveSettings = (s: Settings) => {
    setSettings(s);
    saveSettingsToStorage(s);
  };

  const saveCustomThemes = (themes: ThemeEntry[]) => {
    setCustomThemes(themes);
    saveCustomThemesToStorage(themes);
  };

  // ── Theme ────────────────────────────────────────────────────────────────────

  useEffect(() => { applyTheme(activeTheme.colors); }, [activeTheme.colors]);

  const isDragging = useDragTheme({ allThemes, customThemes, settings, saveCustomThemes, saveSettings });

  // ── Keyboard ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showThemeModal) { setShowThemeModal(false); return; }
        setShowSettings(false);
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [showThemeModal]);

  // ── Category map for ThemeModal dropdown ─────────────────────────────────────

  const categories = useMemo(
    () => allThemes.reduce<Record<string, ThemeEntry[]>>((acc, t) => {
      (acc[t.category] ||= []).push(t);
      return acc;
    }, {}),
    [allThemes],
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="border-2 border-dashed border-green m-8 absolute inset-0 opacity-50" />
          <span className="text-[11px] text-green tracking-[0.2em] uppercase">drop svg theme</span>
        </div>
      )}

      {/* Theme modal */}
      {showThemeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowThemeModal(false); }}
        >
          <ThemeModal
            themes={allThemes}
            categories={categories}
            activeTheme={activeTheme}
            customThemes={customThemes}
            onSelect={(name) => saveSettings({ ...settings, themeName: name })}
            onDelete={(name) => {
              const updated = customThemes.filter(t => t.name !== name);
              saveCustomThemes(updated);
              if (settings.themeName === name) saveSettings({ ...settings, themeName: "dark" });
            }}
            onClose={() => setShowThemeModal(false)}
          />
        </div>
      )}

      <div className="relative z-10 h-screen grid grid-rows-[40px_1fr_40px] font-mono">
        <TopBar
          settings={settings}
          activeTheme={activeTheme}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          setShowThemeModal={setShowThemeModal}
          saveSettings={saveSettings}
        />

        <main className="flex flex-col items-center justify-center gap-10 px-8">
          <ClockDisplay now={now} timeFormat={settings.timeFormat} />
          <SearchBar searchEngine={settings.searchEngine} />
        </main>

        <BottomBar
          weather={weather}
          weatherErr={weatherErr}
          now={now}
          settings={settings}
          saveSettings={saveSettings}
        />
      </div>
    </>
  );
}