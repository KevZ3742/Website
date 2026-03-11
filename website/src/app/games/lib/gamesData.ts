// ── Types ─────────────────────────────────────────────────────────────────────

export interface Game {
  id:          string;
  title:       string;
  description: string;
  tags:        string[];
  players:     string;
  status:      "playable" | "beta" | "coming-soon";
  href:        string;
}

// ── Data ──────────────────────────────────────────────────────────────────────

export const GAMES: Game[] = [
  {
    id: "love-letter",
    title: "Love Letter",
    description: "Deliver your letter to the Princess through her court. A 2–6 player deduction card game — be the last suitor standing or hold the highest card when the deck runs dry.",
    tags: ["card", "multiplayer", "deduction"],
    players: "2–6P",
    status: "playable",
    href: "/games/love-letter",
  },
  {
    id: "exploding-kittens",
    title: "Exploding Kittens",
    description: "Draw cards until someone draws an Exploding Kitten. Use Attacks, Skips, Nopes, and cat combos to survive. Last one standing wins.",
    tags: ["card", "multiplayer", "chaos"],
    players: "2–5P",
    status: "playable",
    href: "/games/exploding-kittens",
  },
];

// ── Derived constants ─────────────────────────────────────────────────────────

export const ALL_TAGS = Array.from(new Set(GAMES.flatMap(g => g.tags))).sort();

export const STATUS_STYLES: Record<Game["status"], string> = {
  "playable":    "text-green border-green",
  "beta":        "text-yellow-400 border-yellow-600",
  "coming-soon": "text-muted border-border2",
};

export const STATUS_LABEL: Record<Game["status"], string> = {
  "playable":    "playable",
  "beta":        "beta",
  "coming-soon": "soon",
};