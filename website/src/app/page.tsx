"use client";

import { useEffect, useState, useRef, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  city: string;
}

interface ThemeColors {
  background: string;
  f_high: string; f_med: string; f_low: string; f_inv: string;
  b_high: string; b_med: string; b_low: string; b_inv: string;
}

interface ThemeEntry {
  name:     string;
  display:  string;
  category: string;
  colors:   ThemeColors;
  isCustom?: boolean;
}

interface Settings {
  tempUnit:     "C" | "F";
  timeFormat:   "24h" | "12h";
  searchEngine: "google" | "ddg" | "bing";
  themeName:    string;
}

// ── Theme data (inlined from 100r SVGs) ───────────────────────────────────────

const BUILTIN_THEMES: ThemeEntry[] = [
  { name:"dark",        display:"Dark",        category:"Original",
    colors:{ background:"#0a0a0a", f_high:"#ffffff", f_med:"#a3a3a3", f_low:"#737373", f_inv:"#0a0a0a", b_high:"#404040", b_med:"#262626", b_low:"#171717", b_inv:"#4ade80" }},
  { name:"light",       display:"Light",       category:"Original",
    colors:{ background:"#ffffff", f_high:"#0a0a0a", f_med:"#525252", f_low:"#737373", f_inv:"#ffffff", b_high:"#d4d4d4", b_med:"#e5e5e5", b_low:"#f5f5f5", b_inv:"#3b82f6" }},
  { name:"slate",       display:"Slate",       category:"Original",
    colors:{ background:"#0f172a", f_high:"#f1f5f9", f_med:"#cbd5e1", f_low:"#94a3b8", f_inv:"#0f172a", b_high:"#475569", b_med:"#334155", b_low:"#1e293b", b_inv:"#38bdf8" }},
  { name:"boysenberry", display:"Boysenberry", category:"Hundred Rabbits",
    colors:{ background:"#171717", f_high:"#efefef", f_med:"#999999", f_low:"#873260", f_inv:"#919191", b_high:"#373737", b_med:"#272727", b_low:"#000000", b_inv:"#873260" }},
  { name:"gotham",      display:"Gotham",      category:"Hundred Rabbits",
    colors:{ background:"#0A0F14", f_high:"#FFFFFF", f_med:"#98D1CE", f_low:"#EDB54B", f_inv:"#C33027", b_high:"#093748", b_med:"#081F2D", b_low:"#10151B", b_inv:"#8FAF9F" }},
  { name:"noir",        display:"Noir",        category:"Hundred Rabbits",
    colors:{ background:"#222222", f_high:"#ffffff", f_med:"#cccccc", f_low:"#999999", f_inv:"#ffffff", b_high:"#888888", b_med:"#666666", b_low:"#444444", b_inv:"#000000" }},
  { name:"nord",        display:"Nord",        category:"Hundred Rabbits",
    colors:{ background:"#2E3440", f_high:"#ECEFF4", f_med:"#9DC4C3", f_low:"#B4B8C0", f_inv:"#5E81AC", b_high:"#5E81AC", b_med:"#434C5E", b_low:"#3B4252", b_inv:"#ABCDCC" }},
  { name:"op-1",        display:"OP-1",        category:"Hundred Rabbits",
    colors:{ background:"#0E0D11", f_high:"#EFEFEF", f_med:"#26936F", f_low:"#A5435A", f_inv:"#0E0D11", b_high:"#191A26", b_med:"#14151F", b_low:"#101119", b_inv:"#9F9FB3" }},
  { name:"teenage",     display:"Teenage",     category:"Hundred Rabbits",
    colors:{ background:"#a1a1a1", f_high:"#222222", f_med:"#e00b30", f_low:"#888888", f_inv:"#ffffff", b_high:"#555555", b_med:"#fbba2d", b_low:"#b3b3b3", b_inv:"#0e7242" }},
  { name:"zenburn",     display:"Zenburn",     category:"Hundred Rabbits",
    colors:{ background:"#464646", f_high:"#DCDCCC", f_med:"#DCA3A3", f_low:"#7F9F7F", f_inv:"#000D18", b_high:"#262626", b_med:"#333333", b_low:"#3F3F3F", b_inv:"#8FAF9F" }},
];

// ── Theme helpers ─────────────────────────────────────────────────────────────

function applyTheme(colors: ThemeColors) {
  const r = document.documentElement;
  r.style.setProperty("--bg",      colors.background);
  r.style.setProperty("--surface", colors.b_low);
  r.style.setProperty("--border",  colors.b_med);
  r.style.setProperty("--border2", colors.b_high);
  r.style.setProperty("--text",    colors.f_high);
  r.style.setProperty("--muted",   colors.f_low);
  r.style.setProperty("--dim",     colors.b_med);
  r.style.setProperty("--green",   colors.b_inv);
  const hex = colors.b_inv.replace("#","");
  const n   = parseInt(hex.length === 3 ? hex.split("").map(c=>c+c).join("") : hex, 16);
  r.style.setProperty("--green-glow", `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},0.12)`);
}

function parseSVGTheme(svg: string): ThemeColors | null {
  try {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    if (doc.querySelector("parsererror")) return null;
    const get = (id: string) => doc.getElementById(id)?.getAttribute("fill") ?? null;
    const background = get("background"); const f_high = get("f_high");
    const f_med = get("f_med");  const f_low  = get("f_low");  const f_inv = get("f_inv");
    const b_high = get("b_high"); const b_med = get("b_med"); const b_low = get("b_low"); const b_inv = get("b_inv");
    if (!background||!f_high||!f_med||!f_low||!f_inv||!b_high||!b_med||!b_low||!b_inv) return null;
    return { background, f_high, f_med, f_low, f_inv, b_high, b_med, b_low, b_inv };
  } catch { return null; }
}

function generateSVG(name: string, colors: ThemeColors): string {
  return `<svg width="96px" height="64px" xmlns="http://www.w3.org/2000/svg" baseProfile="full" version="1.1">
  <rect width='96' height='64' id='background' fill='${colors.background}'></rect>
  <circle cx='24' cy='24' r='8' id='f_high' fill='${colors.f_high}'></circle>
  <circle cx='40' cy='24' r='8' id='f_med'  fill='${colors.f_med}'></circle>
  <circle cx='56' cy='24' r='8' id='f_low'  fill='${colors.f_low}'></circle>
  <circle cx='72' cy='24' r='8' id='f_inv'  fill='${colors.f_inv}'></circle>
  <circle cx='24' cy='40' r='8' id='b_high' fill='${colors.b_high}'></circle>
  <circle cx='40' cy='40' r='8' id='b_med'  fill='${colors.b_med}'></circle>
  <circle cx='56' cy='40' r='8' id='b_low'  fill='${colors.b_low}'></circle>
  <circle cx='72' cy='40' r='8' id='b_inv'  fill='${colors.b_inv}'></circle>
</svg>`;
}

function downloadSVG(filename: string, content: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: "image/svg+xml" }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── WMO helper ────────────────────────────────────────────────────────────────

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

// ── Settings ──────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: Settings = {
  tempUnit: "F", timeFormat: "24h", searchEngine: "google", themeName: "dark",
};

function initSettings(): Settings {
  try {
    const s = localStorage.getItem("hpSettings");
    if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function initCustomThemes(): ThemeEntry[] {
  try {
    const s = localStorage.getItem("hpCustomThemes");
    if (s) return JSON.parse(s);
  } catch {}
  return [];
}

const SEARCH_URLS: Record<Settings["searchEngine"], string> = {
  google: "https://www.google.com/search?q=",
  ddg:    "https://duckduckgo.com/?q=",
  bing:   "https://www.bing.com/search?q=",
};

const QUICK_LINKS = [
  { label: "github",      href: "https://github.com" },
  { label: "linear",      href: "https://linear.app" },
  { label: "hacker news", href: "https://news.ycombinator.com" },
  { label: "blog",        href: "/blog" },
  { label: "tools",       href: "/tools" },
  { label: "games",       href: "/games" },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function Home() {
  const [now, setNow]                   = useState(new Date());
  const [weather, setWeather]           = useState<WeatherData | null>(null);
  const [weatherErr, setWeatherErr]     = useState(false);
  const [query, setQuery]               = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [isDragging, setIsDragging]     = useState(false);
  const [settings, setSettings]         = useState<Settings>(initSettings);
  const [customThemes, setCustomThemes] = useState<ThemeEntry[]>(initCustomThemes);

  const inputRef    = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const allThemes   = [...BUILTIN_THEMES, ...customThemes];
  const activeTheme = allThemes.find(t => t.name === settings.themeName) ?? BUILTIN_THEMES[0];

  // Apply theme on change
  useEffect(() => { applyTheme(activeTheme.colors); }, [settings.themeName, customThemes, activeTheme.colors]);

  const saveSettings = (s: Settings) => {
    setSettings(s);
    try { localStorage.setItem("hpSettings", JSON.stringify(s)); } catch {}
  };

  const saveCustomThemes = (themes: ThemeEntry[]) => {
    setCustomThemes(themes);
    try { localStorage.setItem("hpCustomThemes", JSON.stringify(themes)); } catch {}
  };

  // Clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Weather
  useEffect(() => {
    if (!navigator.geolocation) { setTimeout(() => setWeatherErr(true), 0); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try {
          const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`).then(r=>r.json());
          const city = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.county || "here";
          const wx   = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`).then(r=>r.json());
          const { temperature, weathercode } = wx.current_weather;
          const { label, icon } = describeWMO(weathercode);
          setWeather({ temp: Math.round(temperature), condition: label, icon, city });
        } catch { setWeatherErr(true); }
      },
      () => setWeatherErr(true),
      { timeout: 8000 }
    );
  }, []);

  // Close settings panel on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node))
        setShowSettings(false);
    };
    if (showSettings) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showSettings]);

  // Global keydown
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showThemeModal) { setShowThemeModal(false); return; }
        setShowSettings(false); inputRef.current?.focus(); return;
      }
      if (!showThemeModal && document.activeElement !== inputRef.current &&
          e.key.length === 1 && !e.metaKey && !e.ctrlKey)
        inputRef.current?.focus();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [showThemeModal]);

  // Drag & drop SVG theme
  useEffect(() => {
    const onOver  = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onLeave = (e: DragEvent) => { if (!e.relatedTarget) setIsDragging(false); };
    const onDrop  = async (e: DragEvent) => {
      e.preventDefault(); setIsDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (!file?.name.endsWith(".svg")) return;
      const text   = await file.text();
      const colors = parseSVGTheme(text);
      if (!colors) return;
      const base = file.name.replace(".svg","");
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
  }, [customThemes, settings, allThemes]);

  // Auto-focus
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    window.location.href = SEARCH_URLS[settings.searchEngine] + encodeURIComponent(q);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const displayTemp = useCallback((t: number) =>
    settings.tempUnit === "F" ? `${Math.round(t * 9/5+32)}°F` : `${t}°C`,
  [settings.tempUnit]);

  const toggleTempUnit = () =>
    saveSettings({ ...settings, tempUnit: settings.tempUnit === "F" ? "C" : "F" });

  const pad = (n: number) => String(n).padStart(2,"0");
  const h  = settings.timeFormat === "24h" ? pad(now.getHours()) : String(now.getHours()%12||12);
  const m  = pad(now.getMinutes());
  const s  = pad(now.getSeconds());
  const ap = now.getHours() >= 12 ? "PM" : "AM";
  const tz = now.toLocaleDateString("en-US",{timeZoneName:"short"}).split(",")[1]?.trim().split(" ").pop()??"";

  // Group themes by category for the dropdown
  const categories = allThemes.reduce<Record<string, ThemeEntry[]>>((acc, t) => {
    (acc[t.category] ||= []).push(t);
    return acc;
  }, {});

  return (
    <>
      {/* ── Drag overlay ── */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="border-2 border-dashed border-green m-8 absolute inset-0 opacity-50" />
          <span className="text-[11px] text-green tracking-[0.2em] uppercase">drop svg theme</span>
        </div>
      )}

      {/* ── Theme modal ── */}
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

        {/* ── TOP BAR ── */}
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
              <div className="absolute top-[calc(100%+8px)] right-0 w-64 bg-surface border border-border2 p-5 z-50 shadow-2xl">
                <SettingRow label="search">
                  {(["google","ddg","bing"] as Settings["searchEngine"][]).map(e => (
                    <SettingOpt key={e} active={settings.searchEngine===e}
                      onClick={()=>saveSettings({...settings,searchEngine:e})}>{e}</SettingOpt>
                  ))}
                </SettingRow>
                <SettingRow label="temp">
                  {(["C","F"] as Settings["tempUnit"][]).map(u => (
                    <SettingOpt key={u} active={settings.tempUnit===u}
                      onClick={()=>saveSettings({...settings,tempUnit:u})}>°{u}</SettingOpt>
                  ))}
                </SettingRow>
                <SettingRow label="clock">
                  {(["24h","12h"] as Settings["timeFormat"][]).map(f => (
                    <SettingOpt key={f} active={settings.timeFormat===f}
                      onClick={()=>saveSettings({...settings,timeFormat:f})}>{f}</SettingOpt>
                  ))}
                </SettingRow>

                {/* Theme row */}
                <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-border">
                  <span className="text-[11px] text-tx tracking-[0.04em]">theme</span>
                  <button
                    onClick={() => { setShowSettings(false); setShowThemeModal(true); }}
                    className="flex items-center gap-1.5 text-[10px] text-muted border border-border2 px-2 py-0.5 hover:text-tx hover:border-muted transition-colors"
                  >
                    {/* Mini swatch */}
                    <span
                      className="w-2.5 h-2.5 border border-border2"
                      style={{ background: activeTheme.colors.background }}
                    />
                    {activeTheme.display}
                    <span className="text-dim">›</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── CENTER ── */}
        <div className="flex flex-col items-center justify-center gap-10 px-8">
          <div className="text-center">
            <div className="text-[clamp(3rem,10vw,7rem)] font-light text-tx tracking-[-0.03em] leading-none tabular-nums">
              {h}<span className="text-dim mx-0.5">:</span>
              {m}<span className="text-dim mx-0.5">:</span>
              <span className="text-muted">{s}</span>
              {settings.timeFormat==="12h" && (
                <span className="text-muted ml-2" style={{fontSize:"0.35em"}}>{ap}</span>
              )}
            </div>
            <div className="mt-1.5 text-[11px] text-muted tracking-[0.12em] uppercase">{formatDate(now)}</div>
          </div>

          <div className="w-full max-w-140">
            <form onSubmit={handleSearch} className="search-glow flex items-center border border-border2 bg-surface transition-colors">
              <span className="hidden sm:block px-3.5 text-[10px] text-muted tracking-[0.08em] border-r border-border2 whitespace-nowrap select-none">
                {settings.searchEngine}
              </span>
              <input
                ref={inputRef} type="text" placeholder="search or type a url..."
                value={query} onChange={e=>setQuery(e.target.value)}
                autoComplete="off" spellCheck={false}
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-tx px-4 py-3 placeholder:text-muted caret-green font-mono"
              />
              <button type="submit" className="border-l border-border2 px-4 h-full text-[11px] text-muted hover:text-green transition-colors whitespace-nowrap font-mono">
                ↵ go
              </button>
            </form>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center max-w-140">
            {QUICK_LINKS.map(l => (
              <a key={l.label} href={l.href}
                className="text-[10px] tracking-[0.07em] text-muted border border-border px-2.5 py-0.5 hover:text-green hover:border-green transition-colors">
                {l.label}
              </a>
            ))}
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="flex items-center justify-between px-5 border-t border-border bg-surface relative z-10 text-[11px] text-muted">
          <div className="flex items-center gap-3">
            {weather ? (
              <button onClick={toggleTempUnit}
                className="flex items-center gap-3 hover:text-tx transition-colors group"
                title={`Switch to °${settings.tempUnit==="F"?"C":"F"}`}>
                <span className="text-sm">{weather.icon}</span>
                <div className="flex flex-col leading-snug text-left">
                  <span className="text-[12px] text-tx group-hover:text-green transition-colors">
                    {displayTemp(weather.temp)} · {weather.city}
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
      </div>
    </>
  );
}

// ── Theme Modal ───────────────────────────────────────────────────────────────

function ThemeModal({
  themes, categories, activeTheme, customThemes, onSelect, onDelete, onClose,
}: {
  themes:       ThemeEntry[];
  categories:   Record<string, ThemeEntry[]>;
  activeTheme:  ThemeEntry;
  customThemes: ThemeEntry[];
  onSelect:     (name: string) => void;
  onDelete:     (name: string) => void;
  onClose:      () => void;
}) {
  const [selected, setSelected] = useState(activeTheme.name);
  const selectedEntry = themes.find(t => t.name === selected) ?? activeTheme;

  const handleSelect = (name: string) => {
    setSelected(name);
    onSelect(name);
  };

  const handleExport = () => {
    const svg = generateSVG(selectedEntry.name, selectedEntry.colors);
    downloadSVG(`${selectedEntry.name}.svg`, svg);
  };

  const handleDelete = () => {
    const isCustom = customThemes.find(t => t.name === selected);
    if (!isCustom) return;
    onDelete(selected);
    setSelected("dark");
    onSelect("dark");
  };

  const COLOR_LABELS: { key: keyof ThemeColors; label: string }[] = [
    { key: "background", label: "Background" },
    { key: "f_high",     label: "FG High"    },
    { key: "f_med",      label: "FG Med"     },
    { key: "f_low",      label: "FG Low"     },
    { key: "f_inv",      label: "FG Inv"     },
    { key: "b_high",     label: "BG High"    },
    { key: "b_med",      label: "BG Med"     },
    { key: "b_low",      label: "BG Low"     },
    { key: "b_inv",      label: "Accent"     },
  ];

  const isCustom = !!customThemes.find(t => t.name === selected);

  return (
    <div
      className="bg-surface border border-border2 shadow-2xl font-mono flex flex-col"
      style={{ width: 480, maxHeight: "80vh" }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="text-[11px] tracking-[0.15em] uppercase text-tx">Theme Selector</span>
        <button onClick={onClose} className="text-muted hover:text-tx text-[18px] leading-none transition-colors">×</button>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

        {/* Current theme label */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted tracking-[0.08em]">current</span>
          <span className="text-[11px] text-tx">{selectedEntry.display}</span>
        </div>

        {/* Dropdown */}
        <div>
          <label className="block text-[10px] text-muted tracking-[0.08em] mb-1.5">select theme</label>
          <select
            value={selected}
            onChange={e => handleSelect(e.target.value)}
            className="w-full bg-surface border border-border2 text-[11px] text-tx px-3 py-2 font-mono outline-none focus:border-green transition-colors cursor-pointer"
          >
            {Object.entries(categories).map(([cat, ts]) => (
              <optgroup key={cat} label={cat}>
                {ts.map(t => (
                  <option key={t.name} value={t.name}>{t.display}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 text-[10px] tracking-[0.08em] border border-border2 px-3 py-1.5 text-muted hover:text-tx hover:border-muted transition-colors"
          >
            export svg
          </button>
          <button
            onClick={handleDelete}
            disabled={!isCustom}
            className={`flex-1 text-[10px] tracking-[0.08em] border px-3 py-1.5 transition-colors
              ${isCustom
                ? "border-red-900 text-red-500 hover:border-red-500 hover:text-red-400"
                : "border-border2 text-dim cursor-not-allowed"
              }`}
          >
            delete
          </button>
        </div>

        {/* Colour preview */}
        <div>
          <label className="block text-[10px] text-muted tracking-[0.08em] mb-2">colours</label>
          <div className="border border-border p-4 space-y-2">
            {/* Background preview strip */}
            <div
              className="w-full h-10 border border-border flex items-center justify-center mb-3"
              style={{ background: selectedEntry.colors.background }}
            >
              <span className="text-[9px] tracking-widest" style={{ color: selectedEntry.colors.f_high }}>
                {selectedEntry.display}
              </span>
            </div>

            {/* Foreground row */}
            <div className="flex gap-1.5">
              {(["f_high","f_med","f_low","f_inv"] as (keyof ThemeColors)[]).map(k => (
                <div key={k} className="flex-1">
                  <div className="w-full h-6 border border-border" style={{ background: selectedEntry.colors[k] }} />
                  <div className="text-[8px] text-muted text-center mt-0.5 tracking-wide">
                    {k.replace("_","·")}
                  </div>
                </div>
              ))}
            </div>

            {/* Background row */}
            <div className="flex gap-1.5">
              {(["b_high","b_med","b_low","b_inv"] as (keyof ThemeColors)[]).map(k => (
                <div key={k} className="flex-1">
                  <div className="w-full h-6 border border-border" style={{ background: selectedEntry.colors[k] }} />
                  <div className="text-[8px] text-muted text-center mt-0.5 tracking-wide">
                    {k.replace("_","·")}
                  </div>
                </div>
              ))}
            </div>

            {/* Hex values */}
            <div className="pt-2 border-t border-border grid grid-cols-3 gap-x-3 gap-y-1">
              {COLOR_LABELS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 border border-border shrink-0"
                    style={{ background: selectedEntry.colors[key] }} />
                  <span className="text-[9px] text-muted truncate">{label}</span>
                  <span className="text-[9px] text-dim ml-auto font-mono">
                    {selectedEntry.colors[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drag & drop hint */}
        <div className="border border-dashed border-border p-3 text-center">
          <p className="text-[10px] text-muted tracking-[0.08em]">
            drop a <span className="text-tx">.svg</span> file anywhere to load a custom theme
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
        <button
          onClick={onClose}
          className="text-[10px] tracking-[0.08em] border border-green bg-green text-black px-5 py-1.5 hover:opacity-90 transition-opacity font-medium"
        >
          done
        </button>
      </div>
    </div>
  );
}

// ── Shared UI components ──────────────────────────────────────────────────────

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3.5 last:mb-0">
      <span className="text-[11px] text-tx tracking-[0.04em]">{label}</span>
      <div className="flex gap-0.5">{children}</div>
    </div>
  );
}

function SettingOpt({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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