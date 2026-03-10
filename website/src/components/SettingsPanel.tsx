import { useState, useRef } from "react";
import type { Settings } from "../lib/settings";
import type { ThemeEntry } from "../lib/themes";
import { SettingRow, SettingOpt } from "./ui";

interface SettingsPanelProps {
  settings:          Settings;
  activeTheme:       ThemeEntry;
  saveSettings:      (s: Settings) => void;
  onOpenThemeModal:  () => void;
}

export function SettingsPanel({
  settings,
  activeTheme,
  saveSettings,
  onOpenThemeModal,
}: SettingsPanelProps) {
  const [locationDraft, setLocationDraft] = useState(settings.weatherLocation ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  const commitLocation = () => {
    const trimmed = locationDraft.trim();
    if (trimmed !== (settings.weatherLocation ?? "")) {
      saveSettings({ ...settings, weatherLocation: trimmed });
    }
  };

  const clearLocation = () => {
    setLocationDraft("");
    saveSettings({ ...settings, weatherLocation: "" });
    inputRef.current?.focus();
  };

  const isOverriding = !!(settings.weatherLocation?.trim());

  return (
    <div className="absolute top-[calc(100%+8px)] right-0 w-64 bg-surface border border-border2 p-5 z-50 shadow-2xl">
      <SettingRow label="search">
        {(["google", "ddg", "bing"] as Settings["searchEngine"][]).map(e => (
          <SettingOpt key={e} active={settings.searchEngine === e}
            onClick={() => saveSettings({ ...settings, searchEngine: e })}>{e}</SettingOpt>
        ))}
      </SettingRow>

      <SettingRow label="temp">
        {(["C", "F"] as Settings["tempUnit"][]).map(u => (
          <SettingOpt key={u} active={settings.tempUnit === u}
            onClick={() => saveSettings({ ...settings, tempUnit: u })}>°{u}</SettingOpt>
        ))}
      </SettingRow>

      <SettingRow label="clock">
        {(["24h", "12h"] as Settings["timeFormat"][]).map(f => (
          <SettingOpt key={f} active={settings.timeFormat === f}
            onClick={() => saveSettings({ ...settings, timeFormat: f })}>{f}</SettingOpt>
        ))}
      </SettingRow>

      {/* Location override */}
      <div className="mt-3.5 pt-3.5 border-t border-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-tx tracking-[0.04em]">location</span>
          {isOverriding && (
            <span className="text-[9px] text-green tracking-[0.06em]">override active</span>
          )}
        </div>
        <div className={`flex items-center border transition-colors ${isOverriding ? "border-green" : "border-border2"} bg-bg`}>
          <input
            ref={inputRef}
            type="text"
            value={locationDraft}
            onChange={e => setLocationDraft(e.target.value)}
            onBlur={commitLocation}
            onKeyDown={e => {
              if (e.key === "Enter") { commitLocation(); inputRef.current?.blur(); }
              if (e.key === "Escape") { setLocationDraft(settings.weatherLocation ?? ""); inputRef.current?.blur(); }
            }}
            placeholder="city, country..."
            spellCheck={false}
            className="flex-1 bg-transparent outline-none text-[10px] text-tx font-mono px-2 py-1.5 placeholder:text-muted caret-green min-w-0"
          />
          {locationDraft && (
            <button
              onMouseDown={e => e.preventDefault()} // prevent blur before click
              onClick={clearLocation}
              className="px-2 text-[11px] text-muted hover:text-red-400 transition-colors"
              title="Clear (use browser location)"
            >×</button>
          )}
        </div>
        <p className="text-[9px] text-muted mt-1 tracking-[0.04em] leading-relaxed">
          {isOverriding ? `weather for "${settings.weatherLocation}"` : "using browser geolocation"}
        </p>
      </div>

      <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-border">
        <span className="text-[11px] text-tx tracking-[0.04em]">theme</span>
        <button
          onClick={onOpenThemeModal}
          className="flex items-center gap-1.5 text-[10px] text-muted border border-border2 px-2 py-0.5 hover:text-tx hover:border-muted transition-colors"
        >
          <span
            className="w-2.5 h-2.5 border border-border2"
            style={{ background: activeTheme.colors.background }}
          />
          {activeTheme.display}
          <span className="text-dim">›</span>
        </button>
      </div>
    </div>
  );
}