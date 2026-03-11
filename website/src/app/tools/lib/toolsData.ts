// ── Types ─────────────────────────────────────────────────────────────────────

export interface Tool {
  id:          string;
  title:       string;
  description: string;
  tags:        string[];
  status:      "live" | "beta" | "coming-soon";
  href:        string;
}

// ── Data ──────────────────────────────────────────────────────────────────────

export const TOOLS: Tool[] = [
  {
    id: "json-formatter",
    title: "JSON Formatter",
    description: "Paste raw JSON to format, validate, and explore it. Highlights syntax errors, collapses nested nodes, and copies cleaned output.",
    tags: ["dev", "text", "formatter"],
    status: "live",
    href: "/tools/json-formatter",
  },
  {
    id: "base64",
    title: "Base64",
    description: "Encode plaintext or decode Base64 strings. Supports URL-safe encoding and handles binary-safe padding edge cases.",
    tags: ["dev", "encoding"],
    status: "live",
    href: "/tools/base64",
  },
  {
    id: "regex-tester",
    title: "Regex Tester",
    description: "Write and test regular expressions against sample input. Live match highlighting, group capture view, and flag toggles.",
    tags: ["dev", "text"],
    status: "beta",
    href: "/tools/regex-tester",
  },
  {
    id: "color-picker",
    title: "Color Picker",
    description: "Pick, convert, and explore colours across HEX, RGB, HSL, and HSV. Generates tints, shades, and complementary palettes.",
    tags: ["design", "color"],
    status: "live",
    href: "/tools/color-picker",
  },
  {
    id: "diff-viewer",
    title: "Diff Viewer",
    description: "Paste two blocks of text and see a side-by-side diff with line-level and character-level change highlighting.",
    tags: ["dev", "text"],
    status: "beta",
    href: "/tools/diff-viewer",
  },
  {
    id: "markdown-preview",
    title: "Markdown Preview",
    description: "Write Markdown on the left, see rendered HTML on the right. Supports GFM tables, task lists, and fenced code blocks.",
    tags: ["text", "formatter"],
    status: "live",
    href: "/tools/markdown-preview",
  },
  {
    id: "unit-converter",
    title: "Unit Converter",
    description: "Convert between length, weight, temperature, speed, area, and data units. Instant results as you type.",
    tags: ["math", "converter"],
    status: "live",
    href: "/tools/unit-converter",
  },
  {
    id: "timestamp",
    title: "Timestamp",
    description: "Convert Unix timestamps to human-readable dates and back. Supports seconds, milliseconds, ISO 8601, and relative time.",
    tags: ["dev", "converter"],
    status: "live",
    href: "/tools/timestamp",
  },
  {
    id: "uuid-generator",
    title: "UUID Generator",
    description: "Generate v1, v4, and v5 UUIDs in bulk. Copy individually or as a newline-separated list. Validate an existing UUID.",
    tags: ["dev"],
    status: "coming-soon",
    href: "/tools/uuid-generator",
  },
  {
    id: "hash-generator",
    title: "Hash Generator",
    description: "Compute MD5, SHA-1, SHA-256, and SHA-512 hashes from text or file input. Client-side only — nothing leaves your browser.",
    tags: ["dev", "security"],
    status: "coming-soon",
    href: "/tools/hash-generator",
  },
  {
    id: "css-gradient",
    title: "CSS Gradient",
    description: "Visually build linear and radial gradients. Drag stops, tweak angles, and copy the ready-to-use CSS snippet.",
    tags: ["design", "css"],
    status: "coming-soon",
    href: "/tools/css-gradient",
  },
  {
    id: "pomodoro",
    title: "Pomodoro",
    description: "A minimal focus timer. 25-minute work sessions, configurable short and long breaks, with desktop notifications.",
    tags: ["productivity"],
    status: "coming-soon",
    href: "/tools/pomodoro",
  },
];

// ── Derived constants ─────────────────────────────────────────────────────────

export const ALL_TAGS = Array.from(new Set(TOOLS.flatMap(t => t.tags))).sort();

export const STATUS_STYLES: Record<Tool["status"], string> = {
  "live":         "text-green border-green",
  "beta":         "text-yellow-400 border-yellow-600",
  "coming-soon":  "text-muted border-border2",
};

export const STATUS_LABEL: Record<Tool["status"], string> = {
  "live":        "live",
  "beta":        "beta",
  "coming-soon": "soon",
};