"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BUILTIN_THEMES, applyTheme } from "../../lib/themes";
import { loadSettings, loadCustomThemes } from "../../lib/settings";
import { GAMES } from "./lib/gamesData";
import { GameFilters } from "./components/GameFilters";
import { GameGrid } from "./components/GameGrid";
import { useGameFilters } from "./hooks/useGameFilters";

export default function GamesPage() {
  const {
    query, activeTags, statusFilter, filtered, hasFilters,
    setQuery, toggleTag, setStatusFilter, clearFilters,
  } = useGameFilters();

  // Apply saved theme on mount
  useEffect(() => {
    const settings     = loadSettings();
    const customThemes = loadCustomThemes();
    const allThemes    = [...BUILTIN_THEMES, ...customThemes];
    const active       = allThemes.find(t => t.name === settings.themeName) ?? BUILTIN_THEMES[0];
    applyTheme(active.colors);
  }, []);

  return (
    <div className="min-h-screen bg-bg font-mono text-tx">

      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[13px] tracking-[0.15em] uppercase text-tx">games</h1>
          <p className="text-[10px] text-muted mt-0.5">
            {GAMES.length} games · browser-based · no installs
          </p>
        </div>
        <Link
          href="/"
          className="text-[10px] text-muted border border-border2 px-2.5 py-1 hover:text-tx hover:border-muted transition-colors tracking-[0.06em]"
        >
          ← home
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        <GameFilters
          query={query}
          activeTags={activeTags}
          statusFilter={statusFilter}
          hasFilters={hasFilters}
          onQueryChange={setQuery}
          onToggleTag={toggleTag}
          onStatusFilterChange={setStatusFilter}
          onClearFilters={clearFilters}
        />

        <GameGrid
          filtered={filtered}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
        />
      </div>
    </div>
  );
}