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
    id: "snake",
    title: "Snake",
    description: "Classic snake. Eat, grow, don't bite yourself. How long can you last?",
    tags: ["arcade", "solo", "keyboard"],
    players: "1P",
    status: "playable",
    href: "/games/snake",
  },
  {
    id: "minesweeper",
    title: "Minesweeper",
    description: "Clear the minefield without triggering any bombs. Logic and a bit of luck.",
    tags: ["puzzle", "solo", "classic"],
    players: "1P",
    status: "playable",
    href: "/games/minesweeper",
  },
  {
    id: "tetris",
    title: "Tetris",
    description: "Stack the falling blocks, clear the lines. A timeless test of spatial thinking.",
    tags: ["arcade", "solo", "keyboard"],
    players: "1P",
    status: "playable",
    href: "/games/tetris",
  },
  {
    id: "2048",
    title: "2048",
    description: "Slide and merge tiles to reach 2048. Simple rules, deep strategy.",
    tags: ["puzzle", "solo", "touch"],
    players: "1P",
    status: "playable",
    href: "/games/2048",
  },
  {
    id: "wordle",
    title: "Wordle",
    description: "Guess the hidden 5-letter word in six tries. A new puzzle every day.",
    tags: ["word", "solo", "daily"],
    players: "1P",
    status: "beta",
    href: "/games/wordle",
  },
  {
    id: "chess",
    title: "Chess",
    description: "Play against a bot or challenge a friend. Full rules, no clock by default.",
    tags: ["strategy", "multiplayer", "classic"],
    players: "1–2P",
    status: "beta",
    href: "/games/chess",
  },
  {
    id: "pong",
    title: "Pong",
    description: "The original two-player paddle game. First to 7 wins.",
    tags: ["arcade", "multiplayer", "keyboard"],
    players: "2P",
    status: "playable",
    href: "/games/pong",
  },
  {
    id: "breakout",
    title: "Breakout",
    description: "Smash through every brick with a single bouncing ball. Don't drop it.",
    tags: ["arcade", "solo", "keyboard"],
    players: "1P",
    status: "coming-soon",
    href: "/games/breakout",
  },
  {
    id: "sokoban",
    title: "Sokoban",
    description: "Push boxes onto targets in the right order. 50 hand-crafted puzzles.",
    tags: ["puzzle", "solo", "keyboard"],
    players: "1P",
    status: "coming-soon",
    href: "/games/sokoban",
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