import { useCallback } from "react";
import type { WeatherData } from "../hooks/useWeather";
import type { Settings } from "../lib/settings";

interface BottomBarProps {
  weather:      WeatherData | null;
  weatherErr:   boolean;
  now:          Date | null;
  settings:     Settings;
  saveSettings: (s: Settings) => void;
}

function displayTemp(t: number, unit: Settings["tempUnit"]) {
  return unit === "F" ? `${Math.round(t * 9 / 5 + 32)}°F` : `${t}°C`;
}

export function BottomBar({ weather, weatherErr, now, settings, saveSettings }: BottomBarProps) {
  const tz = now
    ? now.toLocaleDateString("en-US", { timeZoneName: "short" })
        .split(",")[1]?.trim().split(" ").pop() ?? ""
    : "";

  const toggleTempUnit = useCallback(() =>
    saveSettings({ ...settings, tempUnit: settings.tempUnit === "F" ? "C" : "F" }),
  [settings, saveSettings]);

  return (
    <div className="flex items-center justify-between px-5 border-t border-border bg-surface relative z-10 text-[11px] text-muted">
      <div className="flex items-center gap-3">
        {weather ? (
          <button
            onClick={toggleTempUnit}
            className="flex items-center gap-3 hover:text-tx transition-colors group"
            title={`Switch to °${settings.tempUnit === "F" ? "C" : "F"}`}
          >
            <span className="text-sm">{weather.icon}</span>
            <div className="flex flex-col leading-snug text-left">
              <span className="text-[12px] text-tx group-hover:text-green transition-colors">
                {displayTemp(weather.temp, settings.tempUnit)} · {weather.city}
              </span>
              <span className="text-[10px] tracking-[0.06em]">{weather.condition}</span>
            </div>
          </button>
        ) : weatherErr ? (
          <span className="text-[10px]">weather unavailable</span>
        ) : (
          <span className="text-[10px]">locating...</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green" />online
        </span>
        <span className="text-dim">{tz}</span>
      </div>
    </div>
  );
}