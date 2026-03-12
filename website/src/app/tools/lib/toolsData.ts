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
    id: "rng-toolkit",
    title: "RNG Toolkit",
    description: "All-in-one randomness suite. Number generator, RPG dice roller, coin flip, card draws from a full deck, spin wheel, and random group splitter.",
    tags: ["math", "productivity"],
    status: "live",
    href: "/tools/rng-toolkit",
  },
  {
    id: "lorem-ipsum",
    title: "Lorem Ipsum",
    description: "Generate placeholder text in multiple flavors — classic lorem, tech jargon, corporate speak, or hipster. Paragraphs, sentences, words, lists, or HTML output.",
    tags: ["text", "design", "productivity"],
    status: "live",
    href: "/tools/lorem-ipsum",
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