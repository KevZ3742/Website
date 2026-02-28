"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  city: string;
}

function describeWMO(code: number): { label: string; icon: string } {
  if (code === 0)  return { label: "clear",         icon: "○" };
  if (code <= 2)   return { label: "partly cloudy", icon: "◑" };
  if (code === 3)  return { label: "overcast",      icon: "●" };
  if (code <= 49)  return { label: "foggy",         icon: "≋" };
  if (code <= 59)  return { label: "drizzle",       icon: "·" };
  if (code <= 69)  return { label: "rain",          icon: "▾" };
  if (code <= 79)  return { label: "snow",          icon: "✦" };
  if (code <= 84)  return { label: "showers",       icon: "▿" };
  if (code <= 99)  return { label: "storm",         icon: "⚡" };
  return { label: "unknown", icon: "?" };
}

interface Settings {
  tempUnit: "C" | "F";
  timeFormat: "24h" | "12h";
  searchEngine: "google" | "ddg" | "bing";
}

const DEFAULT_SETTINGS: Settings = {
  tempUnit: "C",
  timeFormat: "24h",
  searchEngine: "google",
};

const SEARCH_URLS: Record<Settings["searchEngine"], string> = {
  google: "https://www.google.com/search?q=",
  ddg:    "https://duckduckgo.com/?q=",
  bing:   "https://www.bing.com/search?q=",
};

const QUICK_LINKS = [
  { label: "github",       href: "https://github.com" },
  { label: "linear",       href: "https://linear.app" },
  { label: "hacker news",  href: "https://news.ycombinator.com" },
  { label: "blog",         href: "/blog" },
  { label: "tools",        href: "/tools" },
  { label: "games",        href: "/games" },
];

export default function Home() {
  const [now, setNow]               = useState(new Date());
  const [weather, setWeather]       = useState<WeatherData | null>(null);
  const [weatherErr, setWeatherErr] = useState(false);
  const [query, setQuery]           = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings]     = useState<Settings>(DEFAULT_SETTINGS);
  const [mounted, setMounted]       = useState(false);

  const inputRef      = useRef<HTMLInputElement>(null);
  const settingsRef   = useRef<HTMLDivElement>(null);

  // load persisted settings
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("hpSettings");
      if (saved) setSettings(JSON.parse(saved));
    } catch {}
  }, []);

  const saveSettings = (s: Settings) => {
    setSettings(s);
    try { localStorage.setItem("hpSettings", JSON.stringify(s)); } catch {}
  };

  // clock tick
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // weather via geolocation → open-meteo (no API key)
  useEffect(() => {
    if (!navigator.geolocation) { setWeatherErr(true); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try {
          const geo = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          ).then(r => r.json());
          const city =
            geo.address?.city || geo.address?.town ||
            geo.address?.village || geo.address?.county || "here";

          const wx = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
          ).then(r => r.json());

          const { temperature, weathercode } = wx.current_weather;
          const { label, icon } = describeWMO(weathercode);
          setWeather({ temp: Math.round(temperature), condition: label, icon, city });
        } catch { setWeatherErr(true); }
      },
      () => setWeatherErr(true),
      { timeout: 8000 }
    );
  }, []);

  // close settings on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node))
        setShowSettings(false);
    };
    if (showSettings) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSettings]);

  // global keydown: Escape closes panel, any char focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setShowSettings(false); inputRef.current?.focus(); return; }
      if (
        document.activeElement !== inputRef.current &&
        e.key.length === 1 && !e.metaKey && !e.ctrlKey
      ) inputRef.current?.focus();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // auto-focus on mount
  useEffect(() => { inputRef.current?.focus(); }, [mounted]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    window.location.href = SEARCH_URLS[settings.searchEngine] + encodeURIComponent(q);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const displayTemp = useCallback((t: number) =>
    settings.tempUnit === "F" ? `${Math.round(t * 9 / 5 + 32)}°F` : `${t}°C`,
  [settings.tempUnit]);

  const pad = (n: number) => String(n).padStart(2, "0");

  if (!mounted) return null;

  // clock parts
  const h  = settings.timeFormat === "24h" ? pad(now.getHours()) : String(now.getHours() % 12 || 12);
  const m  = pad(now.getMinutes());
  const s  = pad(now.getSeconds());
  const ap = now.getHours() >= 12 ? "PM" : "AM";
  const tz = now.toLocaleDateString("en-US", { timeZoneName: "short" })
               .split(",")[1]?.trim().split(" ").pop() ?? "";

  return (
    <div className="relative z-10 h-screen grid grid-rows-[40px_1fr_40px] font-mono">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-5 border-b border-border">

        {/* escape */}
        <button className="flex items-center gap-1.5 text-[11px] text-muted border border-border2 px-2.5 py-0.5 tracking-widest hover:text-red-400 hover:border-red-400 transition-colors">
          <span>⎋</span> esc
        </button>

        {/* centre pip */}
        <span className="text-[10px] text-dim tracking-widest">_</span>

        {/* settings */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setShowSettings(v => !v)}
            className="flex items-center gap-1.5 text-[11px] text-muted border border-border2 px-2.5 py-0.5 tracking-widest hover:text-tx hover:border-muted transition-colors"
          >
            <span>⚙</span> settings
          </button>

          {showSettings && (
            <div className="absolute bottom-[calc(100%+8px)] right-0 w-64 bg-surface border border-border2 p-5 z-50 shadow-2xl animate-[fadeInUp_0.15s_ease]">
              <p className="text-[10px] text-muted tracking-[0.12em] uppercase mb-4 pb-2.5 border-b border-border">
                {/* // settings */}
              </p>

              {/* search engine */}
              <SettingRow label="search">
                {(["google", "ddg", "bing"] as Settings["searchEngine"][]).map(e => (
                  <SettingOpt
                    key={e} active={settings.searchEngine === e}
                    onClick={() => saveSettings({ ...settings, searchEngine: e })}
                  >{e}</SettingOpt>
                ))}
              </SettingRow>

              {/* temp unit */}
              <SettingRow label="temp">
                {(["C", "F"] as Settings["tempUnit"][]).map(u => (
                  <SettingOpt
                    key={u} active={settings.tempUnit === u}
                    onClick={() => saveSettings({ ...settings, tempUnit: u })}
                  >°{u}</SettingOpt>
                ))}
              </SettingRow>

              {/* clock format */}
              <SettingRow label="clock">
                {(["24h", "12h"] as Settings["timeFormat"][]).map(f => (
                  <SettingOpt
                    key={f} active={settings.timeFormat === f}
                    onClick={() => saveSettings({ ...settings, timeFormat: f })}
                  >{f}</SettingOpt>
                ))}
              </SettingRow>
            </div>
          )}
        </div>
      </div>

      {/* ── CENTER ── */}
      <div className="flex flex-col items-center justify-center gap-10 px-8">

        {/* clock */}
        <div className="text-center">
          <div className="text-[clamp(3rem,10vw,7rem)] font-light text-tx tracking-[-0.03em] leading-none tabular-nums">
            {h}
            <span className="text-dim mx-0.5">:</span>
            {m}
            <span className="text-dim mx-0.5">:</span>
            <span className="text-muted">{s}</span>
            {settings.timeFormat === "12h" && (
              <span className="text-muted ml-2" style={{ fontSize: "0.35em" }}>{ap}</span>
            )}
          </div>
          <div className="mt-1.5 text-[11px] text-muted tracking-[0.12em] uppercase">
            {formatDate(now)}
          </div>
        </div>

        {/* search */}
        <div className="w-full max-w-140">
          <form
            onSubmit={handleSearch}
            className="search-glow flex items-center border border-border2 bg-surface transition-colors"
          >
            <span className="hidden sm:block px-3.5 text-[10px] text-muted tracking-[0.08em] border-r border-border2 whitespace-nowrap select-none">
              {settings.searchEngine}
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder="search or type a url..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent border-none outline-none text-[13px] text-tx px-4 py-3 placeholder:text-muted caret-green font-mono"
            />
            <button
              type="submit"
              className="border-l border-border2 px-4 h-full text-[11px] text-muted hover:text-green transition-colors whitespace-nowrap font-mono"
            >
              ↵ go
            </button>
          </form>
        </div>

        {/* quick links */}
        <div className="flex flex-wrap gap-1.5 justify-center max-w-140">
          {QUICK_LINKS.map(l => (
            <a
              key={l.label}
              href={l.href}
              className="text-[10px] tracking-[0.07em] text-muted border border-border px-2.5 py-0.5 hover:text-green hover:border-green transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="flex items-center justify-between px-5 border-t border-border text-[11px] text-muted">

        {/* weather */}
        <div className="flex items-center gap-3">
          {weather ? (
            <>
              <span className="text-sm">{weather.icon}</span>
              <div className="flex flex-col leading-snug">
                <span className="text-[12px] text-tx">{displayTemp(weather.temp)} · {weather.city}</span>
                <span className="text-[10px] tracking-[0.06em]">{weather.condition}</span>
              </div>
            </>
          ) : weatherErr ? (
            <span className="text-[10px]">weather unavailable</span>
          ) : (
            <span className="text-[10px]">locating...</span>
          )}
        </div>

        {/* right */}
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green" />
            online
          </span>
          <span className="text-dim">{tz}</span>
        </div>
      </div>

    </div>
  );
}

// ── Small shared components ────────────────────────────────────

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3.5 last:mb-0">
      <span className="text-[11px] text-tx tracking-[0.04em]">{label}</span>
      <div className="flex gap-0.5">{children}</div>
    </div>
  );
}

function SettingOpt({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] tracking-[0.06em] px-2 py-0.5 border font-mono transition-all
        ${active
          ? "bg-green text-black border-green font-medium"
          : "bg-transparent text-muted border-border2 hover:text-tx hover:border-muted"
        }`}
    >
      {children}
    </button>
  );
}