"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
import { BulletinBoard } from "../components/BulletinBoard";

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [settings,     setSettings]     = useState<Settings>(loadSettings);
  const [customThemes, setCustomThemes] = useState<ThemeEntry[]>(loadCustomThemes);
  const [showSettings,     setShowSettings]     = useState(false);
  const [showThemeModal,   setShowThemeModal]   = useState(false);
  const [collapsed,        setCollapsed]        = useState(false);

  const allThemes   = useMemo(() => [...BUILTIN_THEMES, ...customThemes], [customThemes]);
  const activeTheme = allThemes.find(t => t.name === settings.themeName) ?? BUILTIN_THEMES[0];

  const now                    = useClock();
  const { weather, error: weatherErr } = useWeather(settings.weatherLocation);

  // FIX 1: ref shared between BulletinBoard's SelectOverlay and useDragTheme
  const handleDragActiveRef = useRef(false);

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

  const isDragging = useDragTheme({
    allThemes,
    customThemes,
    settings,
    saveCustomThemes,
    saveSettings,
    handleDragActiveRef,
  });

  // ── Keyboard ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showThemeModal) { setShowThemeModal(false); return; }
        if (showSettings)   { setShowSettings(false);   return; }
        setCollapsed(v => !v);
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [showThemeModal, showSettings]);

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
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="border-2 border-dashed border-green m-8 absolute inset-0 opacity-50" />
          <span className="text-[11px] text-green tracking-[0.2em] uppercase">drop svg theme</span>
        </div>
      )}

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
            onSaveNew={(entry) => {
              saveCustomThemes([...customThemes, entry]);
              saveSettings({ ...settings, themeName: entry.name });
            }}
            onRename={(oldName, newDisplay) => {
              const updated = customThemes.map(t =>
                t.name === oldName ? { ...t, display: newDisplay } : t
              );
              saveCustomThemes(updated);
            }}
            onDelete={(name) => {
              const updated = customThemes.filter(t => t.name !== name);
              saveCustomThemes(updated);
              if (settings.themeName === name) saveSettings({ ...settings, themeName: "dark" });
            }}
            onClose={() => setShowThemeModal(false)}
          />
        </div>
      )}

      <div className="relative z-10 h-screen flex flex-col font-mono">
        <TopBar
          settings={settings}
          activeTheme={activeTheme}
          showSettings={showSettings}
          collapsed={collapsed}
          setShowSettings={setShowSettings}
          setShowThemeModal={setShowThemeModal}
          onToggleCollapse={() => setCollapsed(v => !v)}
          saveSettings={saveSettings}
        />

        <main className="flex-1 min-h-0 relative overflow-hidden">
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-10 px-8 transition-all duration-300"
            style={{
              opacity:   collapsed ? 0 : 1,
              transform: collapsed ? "translateY(-16px)" : "translateY(0)",
              pointerEvents: collapsed ? "none" : "all",
            }}
          >
            <ClockDisplay now={now} timeFormat={settings.timeFormat} />
            <SearchBar searchEngine={settings.searchEngine} />
          </div>

          <div
            className="absolute inset-0 transition-all duration-300"
            style={{
              opacity:   collapsed ? 1 : 0,
              transform: collapsed ? "translateY(0)" : "translateY(16px)",
              pointerEvents: collapsed ? "all" : "none",
              visibility: collapsed ? "visible" : "hidden",
            }}
          >
            <BulletinBoard
              weather={weather}
              timeFormat={settings.timeFormat}
              tempUnit={settings.tempUnit}
              handleDragActiveRef={handleDragActiveRef}
            />
          </div>
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