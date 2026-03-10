import { useEffect, useRef } from "react";
import type { Settings } from "../lib/settings";
import type { ThemeEntry } from "../lib/themes";
import { SettingsPanel } from "./SettingsPanel";
import { SEARCH_URLS, QUICK_LINKS } from "../lib/settings";

interface TopBarProps {
  settings:          Settings;
  activeTheme:       ThemeEntry;
  showSettings:      boolean;
  collapsed:         boolean;
  setShowSettings:   (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowThemeModal: (v: boolean) => void;
  onToggleCollapse:  () => void;
  saveSettings:      (s: Settings) => void;
}

function resolveInput(q: string, searchEngine: Settings["searchEngine"]): string {
  if (/^https?:\/\//i.test(q)) return q;
  const looksLikeUrl =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*\.)+[a-zA-Z]{2,}(:\d+)?(\/\S*)?$/.test(q) ||
    /^localhost(:\d+)?(\/\S*)?$/.test(q);
  if (looksLikeUrl) return "https://" + q;
  return SEARCH_URLS[searchEngine] + encodeURIComponent(q);
}

export function TopBar({
  settings,
  activeTheme,
  showSettings,
  collapsed,
  setShowSettings,
  setShowThemeModal,
  onToggleCollapse,
  saveSettings,
}: TopBarProps) {
  const settingsRef = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  // Close settings panel on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    if (showSettings) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showSettings, setShowSettings]);

  // Focus search when entering collapsed mode
  useEffect(() => {
    if (collapsed) setTimeout(() => inputRef.current?.focus(), 60);
  }, [collapsed]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = (inputRef.current?.value ?? "").trim();
    if (!q) return;
    window.location.href = resolveInput(q, settings.searchEngine);
  };

  return (
    <div
      className="flex items-center border-b border-border bg-surface relative z-10 transition-all duration-300 px-4 gap-0"
      style={{ height: collapsed ? 56 : 40 }}
    >
      {/* ── Esc / Back — always far left ── */}
      <button
        onClick={onToggleCollapse}
        className={`flex items-center gap-1.5 text-[11px] border px-2.5 py-0.5 tracking-widest transition-colors shrink-0 whitespace-nowrap font-mono
          ${collapsed
            ? "border-green text-green hover:opacity-70"
            : "border-border2 text-muted hover:text-red-400 hover:border-red-400"
          }`}
      >
        <span>⎋</span>{collapsed ? "back" : "esc"}
      </button>

      {/* ── Flexible center area ── */}
      <div className="flex-1 flex items-center justify-center">
        {!collapsed ? (
          <span className="text-[10px] text-dim tracking-widest">_</span>
        ) : (
          <div className="flex items-center gap-0">
            {/* Left links */}
            <div className="flex items-center gap-1 mr-3">
              {QUICK_LINKS.slice(0, 3).map(l => (
                <a key={l.label} href={l.href}
                  className="text-[9px] tracking-[0.06em] text-muted border border-border px-2 py-0.5 hover:text-green hover:border-green transition-colors font-mono whitespace-nowrap">
                  {l.label}
                </a>
              ))}
            </div>

            {/* Search bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="search-glow flex items-center border border-border2 h-7 shrink-0"
              style={{ width: 300 }}
            >
              <span className="hidden sm:block px-2.5 text-[9px] text-muted tracking-[0.08em] border-r border-border2 whitespace-nowrap select-none font-mono">
                {settings.searchEngine}
              </span>
              <input
                ref={inputRef}
                type="text"
                placeholder="search or url..."
                autoComplete="off"
                spellCheck={false}
                className="flex-1 bg-transparent border-none outline-none text-[11px] text-tx px-2.5 placeholder:text-muted caret-green font-mono min-w-0"
              />
              <button type="submit"
                className="border-l border-border2 px-2.5 h-full text-[10px] text-muted hover:text-green transition-colors font-mono">
                ↵
              </button>
            </form>

            {/* Right links */}
            <div className="flex items-center gap-1 ml-3">
              {QUICK_LINKS.slice(3).map(l => (
                <a key={l.label} href={l.href}
                  className="text-[9px] tracking-[0.06em] text-muted border border-border px-2 py-0.5 hover:text-green hover:border-green transition-colors font-mono whitespace-nowrap">
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Settings — always far right ── */}
      <div className="relative shrink-0" ref={settingsRef}>
        <button
          onClick={() => setShowSettings(v => !v)}
          className="flex items-center gap-1.5 text-[11px] text-muted border border-border2 px-2.5 py-0.5 tracking-widest hover:text-tx hover:border-muted transition-colors font-mono"
        >
          <span>⚙</span>settings
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