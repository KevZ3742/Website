// ── Types ─────────────────────────────────────────────────────────────────────

export interface ThemeColors {
  background: string;
  f_high: string; f_med: string; f_low: string; f_inv: string;
  b_high: string; b_med: string; b_low: string; b_inv: string;
}

export interface ThemeEntry {
  name:      string;
  display:   string;
  category:  string;
  colors:    ThemeColors;
  isCustom?: boolean;
}

// ── Built-in themes ───────────────────────────────────────────────────────────

export const BUILTIN_THEMES: ThemeEntry[] = [
  { name: "dark",        display: "Dark",        category: "Original",
    colors: { background: "#0a0a0a", f_high: "#ffffff", f_med: "#a3a3a3", f_low: "#737373", f_inv: "#0a0a0a", b_high: "#404040", b_med: "#262626", b_low: "#171717", b_inv: "#4ade80" } },
  { name: "light",       display: "Light",       category: "Original",
    colors: { background: "#ffffff", f_high: "#0a0a0a", f_med: "#525252", f_low: "#737373", f_inv: "#ffffff", b_high: "#d4d4d4", b_med: "#e5e5e5", b_low: "#f5f5f5", b_inv: "#3b82f6" } },
  { name: "slate",       display: "Slate",       category: "Original",
    colors: { background: "#0f172a", f_high: "#f1f5f9", f_med: "#cbd5e1", f_low: "#94a3b8", f_inv: "#0f172a", b_high: "#475569", b_med: "#334155", b_low: "#1e293b", b_inv: "#38bdf8" } },
  { name: "boysenberry", display: "Boysenberry", category: "Hundred Rabbits",
    colors: { background: "#171717", f_high: "#efefef", f_med: "#999999", f_low: "#873260", f_inv: "#919191", b_high: "#373737", b_med: "#272727", b_low: "#000000", b_inv: "#873260" } },
  { name: "gotham",      display: "Gotham",      category: "Hundred Rabbits",
    colors: { background: "#0A0F14", f_high: "#FFFFFF", f_med: "#98D1CE", f_low: "#EDB54B", f_inv: "#C33027", b_high: "#093748", b_med: "#081F2D", b_low: "#10151B", b_inv: "#8FAF9F" } },
  { name: "noir",        display: "Noir",        category: "Hundred Rabbits",
    colors: { background: "#222222", f_high: "#ffffff", f_med: "#cccccc", f_low: "#999999", f_inv: "#ffffff", b_high: "#888888", b_med: "#666666", b_low: "#444444", b_inv: "#000000" } },
  { name: "nord",        display: "Nord",        category: "Hundred Rabbits",
    colors: { background: "#2E3440", f_high: "#ECEFF4", f_med: "#9DC4C3", f_low: "#B4B8C0", f_inv: "#5E81AC", b_high: "#5E81AC", b_med: "#434C5E", b_low: "#3B4252", b_inv: "#ABCDCC" } },
  { name: "op-1",        display: "OP-1",        category: "Hundred Rabbits",
    colors: { background: "#0E0D11", f_high: "#EFEFEF", f_med: "#26936F", f_low: "#A5435A", f_inv: "#0E0D11", b_high: "#191A26", b_med: "#14151F", b_low: "#101119", b_inv: "#9F9FB3" } },
  { name: "teenage",     display: "Teenage",     category: "Hundred Rabbits",
    colors: { background: "#a1a1a1", f_high: "#222222", f_med: "#e00b30", f_low: "#888888", f_inv: "#ffffff", b_high: "#555555", b_med: "#fbba2d", b_low: "#b3b3b3", b_inv: "#0e7242" } },
  { name: "zenburn",     display: "Zenburn",     category: "Hundred Rabbits",
    colors: { background: "#464646", f_high: "#DCDCCC", f_med: "#DCA3A3", f_low: "#7F9F7F", f_inv: "#000D18", b_high: "#262626", b_med: "#333333", b_low: "#3F3F3F", b_inv: "#8FAF9F" } },
];

// ── Apply theme to CSS variables ──────────────────────────────────────────────

export function applyTheme(colors: ThemeColors) {
  const r = document.documentElement;
  r.style.setProperty("--bg",      colors.background);
  r.style.setProperty("--surface", colors.b_low);
  r.style.setProperty("--border",  colors.b_med);
  r.style.setProperty("--border2", colors.b_high);
  r.style.setProperty("--text",    colors.f_high);
  r.style.setProperty("--muted",   colors.f_low);
  r.style.setProperty("--dim",     colors.b_med);
  r.style.setProperty("--green",   colors.b_inv);
  const hex = colors.b_inv.replace("#", "");
  const n   = parseInt(hex.length === 3 ? hex.split("").map(c => c + c).join("") : hex, 16);
  r.style.setProperty("--green-glow", `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},0.12)`);
}

// ── Parse a 100r-format SVG theme file ────────────────────────────────────────

export function parseSVGTheme(svg: string): ThemeColors | null {
  try {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    if (doc.querySelector("parsererror")) return null;
    const get = (id: string) => doc.getElementById(id)?.getAttribute("fill") ?? null;
    const background = get("background"); const f_high = get("f_high");
    const f_med = get("f_med"); const f_low = get("f_low"); const f_inv = get("f_inv");
    const b_high = get("b_high"); const b_med = get("b_med"); const b_low = get("b_low"); const b_inv = get("b_inv");
    if (!background || !f_high || !f_med || !f_low || !f_inv || !b_high || !b_med || !b_low || !b_inv) return null;
    return { background, f_high, f_med, f_low, f_inv, b_high, b_med, b_low, b_inv };
  } catch { return null; }
}

// ── Generate a 100r-format SVG from a theme ───────────────────────────────────

export function generateSVG(name: string, colors: ThemeColors): string {
  void name;
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

export function downloadSVG(filename: string, content: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: "image/svg+xml" }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}