"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { BUILTIN_THEMES, applyTheme } from "../../lib/themes";
import { loadSettings, loadCustomThemes } from "../../lib/settings";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Game {
  id:          string;
  title:       string;
  description: string;
  tags:        string[];
  players:     string;
  status:      "playable" | "beta" | "coming-soon";
  href:        string;
}

// ── Dummy data ────────────────────────────────────────────────────────────────

const GAMES: Game[] = [
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

// ── All tags derived from data ────────────────────────────────────────────────

const ALL_TAGS = Array.from(new Set(GAMES.flatMap(g => g.tags))).sort();

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<Game["status"], string> = {
  "playable":    "text-green border-green",
  "beta":        "text-yellow-400 border-yellow-600",
  "coming-soon": "text-muted border-border2",
};

const STATUS_LABEL: Record<Game["status"], string> = {
  "playable":    "playable",
  "beta":        "beta",
  "coming-soon": "soon",
};

// ── GameCard ──────────────────────────────────────────────────────────────────

function GameCard({ game }: { game: Game }) {
  const isSoon = game.status === "coming-soon";

  const inner = (
    <>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className={`text-[13px] text-tx tracking-tight leading-tight transition-colors
            ${!isSoon ? "group-hover:text-green" : ""}`}
        >
          {game.title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] text-muted border border-border2 px-1.5 py-0.5 leading-none">
            {game.players}
          </span>
          <span className={`text-[9px] border px-1.5 py-0.5 leading-none ${STATUS_STYLES[game.status]}`}>
            {STATUS_LABEL[game.status]}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-[10px] text-muted leading-relaxed mb-3 line-clamp-2">
        {game.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {game.tags.map(tag => (
          <span key={tag} className="text-[9px] text-dim tracking-[0.06em] border border-border px-1.5 py-0.5 leading-none">
            {tag}
          </span>
        ))}
      </div>
    </>
  );

  const cardClass = `group block bg-surface border border-border2 p-4 transition-all duration-150 font-mono
    ${isSoon
      ? "opacity-50 cursor-not-allowed"
      : "hover:border-green hover:shadow-[0_0_0_1px_var(--green)] cursor-pointer"
    }`;

  if (isSoon) {
    return <div className={cardClass}>{inner}</div>;
  }

  return (
    <Link href={game.href} className={cardClass}>
      {inner}
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GamesPage() {
  const [query,        setQuery]        = useState("");
  const [activeTags,   setActiveTags]   = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Game["status"] | "all">("all");

  // ── Apply the user's saved theme on mount ────────────────────────────────
  useEffect(() => {
    const settings     = loadSettings();
    const customThemes = loadCustomThemes();
    const allThemes    = [...BUILTIN_THEMES, ...customThemes];
    const active       = allThemes.find(t => t.name === settings.themeName) ?? BUILTIN_THEMES[0];
    applyTheme(active.colors);
  }, []);

  const toggleTag = (tag: string) => {
    setActiveTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) { next.delete(tag); } else { next.add(tag); }
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GAMES.filter(g => {
      const matchQuery =
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.tags.some(t => t.includes(q));

      const matchTags =
        activeTags.size === 0 ||
        [...activeTags].every(t => g.tags.includes(t));

      const matchStatus =
        statusFilter === "all" || g.status === statusFilter;

      return matchQuery && matchTags && matchStatus;
    });
  }, [query, activeTags, statusFilter]);

  const clearFilters = () => {
    setQuery("");
    setActiveTags(new Set());
    setStatusFilter("all");
  };

  const hasFilters = query.trim() || activeTags.size > 0 || statusFilter !== "all";

  return (
    <div className="min-h-screen bg-bg font-mono text-tx">

      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[13px] tracking-[0.15em] uppercase text-tx">games</h1>
          <p className="text-[10px] text-muted mt-0.5">{GAMES.length} games · browser-based · no installs</p>
        </div>
        <Link
          href="/"
          className="text-[10px] text-muted border border-border2 px-2.5 py-1 hover:text-tx hover:border-muted transition-colors tracking-[0.06em]"
        >
          ← home
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">

        {/* Search */}
        <div className="search-glow flex items-center border border-border2 bg-surface transition-colors">
          <span className="px-3 text-[10px] text-muted tracking-[0.08em] border-r border-border2 whitespace-nowrap select-none py-2.5">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="title, tag, description..."
            autoComplete="off"
            spellCheck={false}
            className="flex-1 bg-transparent outline-none text-[12px] text-tx px-3 py-2.5 placeholder:text-muted caret-green font-mono"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="px-3 text-muted hover:text-tx transition-colors text-[14px] py-2.5"
            >
              ×
            </button>
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Status filters */}
          <div className="flex items-center gap-1 border-r border-border2 pr-3 mr-1">
            {(["all", "playable", "beta", "coming-soon"] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-[9px] tracking-[0.06em] border px-2 py-1 transition-colors font-mono
                  ${statusFilter === s
                    ? "border-green text-green bg-green/10"
                    : "border-border2 text-muted hover:text-tx hover:border-muted"
                  }`}
              >
                {s === "all" ? "all" : STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          {/* Tag filters */}
          {ALL_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`text-[9px] tracking-[0.06em] border px-2 py-1 transition-colors font-mono
                ${activeTags.has(tag)
                  ? "border-green text-green bg-green/10"
                  : "border-border2 text-muted hover:text-tx hover:border-muted"
                }`}
            >
              {tag}
            </button>
          ))}

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-[9px] text-muted hover:text-red-400 transition-colors tracking-[0.06em]"
            >
              clear filters
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted">
            {filtered.length === GAMES.length
              ? `${GAMES.length} games`
              : `${filtered.length} of ${GAMES.length} games`}
          </span>
          {hasFilters && filtered.length === 0 && (
            <span className="text-[10px] text-muted">no matches</span>
          )}
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-border py-16 text-center">
            <p className="text-[11px] text-muted tracking-[0.12em] uppercase">no games found</p>
            <p className="text-[10px] text-dim mt-1">try a different search or clear filters</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-[10px] text-muted border border-border2 px-3 py-1.5 hover:text-tx hover:border-muted transition-colors"
            >
              clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}