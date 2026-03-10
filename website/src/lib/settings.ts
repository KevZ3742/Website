import type { ThemeEntry } from "./themes";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Settings {
  tempUnit:     "C" | "F";
  timeFormat:   "24h" | "12h";
  searchEngine: "google" | "ddg" | "bing";
  themeName:    string;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: Settings = {
  tempUnit: "F", timeFormat: "24h", searchEngine: "google", themeName: "dark",
};

export const SEARCH_URLS: Record<Settings["searchEngine"], string> = {
  google: "https://www.google.com/search?q=",
  ddg:    "https://duckduckgo.com/?q=",
  bing:   "https://www.bing.com/search?q=",
};

export const QUICK_LINKS = [
  { label: "resume",   href: "/resume"                        },
  { label: "projects", href: "/projects"                      },
  { label: "blog",     href: "/blog"                          },
  { label: "tools",    href: "/tools"                         },
  { label: "games",    href: "/games"                         },
  { label: "github",   href: "https://github.com/KevZ3742"   },
];

// ── localStorage helpers ──────────────────────────────────────────────────────

export function loadSettings(): Settings {
  try {
    const s = localStorage.getItem("hpSettings");
    if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveSettingsToStorage(s: Settings) {
  try { localStorage.setItem("hpSettings", JSON.stringify(s)); } catch {}
}

export function loadCustomThemes(): ThemeEntry[] {
  try {
    const s = localStorage.getItem("hpCustomThemes");
    if (s) return JSON.parse(s);
  } catch {}
  return [];
}

export function saveCustomThemesToStorage(themes: ThemeEntry[]) {
  try { localStorage.setItem("hpCustomThemes", JSON.stringify(themes)); } catch {}
}