import type { Tool } from "../lib/toolsData";
import { TOOLS } from "../lib/toolsData";
import { ToolCard } from "./ToolCard";

interface ToolGridProps {
  filtered:       Tool[];
  hasFilters:     boolean;
  onClearFilters: () => void;
}

export function ToolGrid({ filtered, hasFilters, onClearFilters }: ToolGridProps) {
  return (
    <div className="space-y-4">
      {/* Results count */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted">
          {filtered.length === TOOLS.length
            ? `${TOOLS.length} tools`
            : `${filtered.length} of ${TOOLS.length} tools`}
        </span>
        {hasFilters && filtered.length === 0 && (
          <span className="text-[10px] text-muted">no matches</span>
        )}
      </div>

      {/* Grid or empty state */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(tool => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-border py-16 text-center">
          <p className="text-[11px] text-muted tracking-[0.12em] uppercase">no tools found</p>
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