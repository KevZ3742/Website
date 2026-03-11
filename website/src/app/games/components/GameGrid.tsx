import type { Game } from "../lib/gamesData";
import { GAMES } from "../lib/gamesData";
import { GameCard } from "./GameCard";

interface GameGridProps {
  filtered:    Game[];
  hasFilters:  boolean;
  onClearFilters: () => void;
}

export function GameGrid({ filtered, hasFilters, onClearFilters }: GameGridProps) {
  return (
    <div className="space-y-4">
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

      {/* Grid or empty state */}
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
            onClick={onClearFilters}
            className="mt-4 text-[10px] text-muted border border-border2 px-3 py-1.5 hover:text-tx hover:border-muted transition-colors"
          >
            clear filters
          </button>
        </div>
      )}
    </div>
  );
}