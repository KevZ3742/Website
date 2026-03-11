import type { Tool } from "../lib/toolsData";
import { ALL_TAGS, STATUS_LABEL } from "../lib/toolsData";

export type StatusFilter = Tool["status"] | "all";

interface ToolFiltersProps {
  query:        string;
  activeTags:   Set<string>;
  statusFilter: StatusFilter;
  hasFilters:   boolean;
  onQueryChange:        (q: string) => void;
  onToggleTag:          (tag: string) => void;
  onStatusFilterChange: (s: StatusFilter) => void;
  onClearFilters:       () => void;
}

export function ToolFilters({
  query,
  activeTags,
  statusFilter,
  hasFilters,
  onQueryChange,
  onToggleTag,
  onStatusFilterChange,
  onClearFilters,
}: ToolFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="search-glow flex items-center border border-border2 bg-surface transition-colors">
        <span className="px-3 text-[10px] text-muted tracking-[0.08em] border-r border-border2 whitespace-nowrap select-none py-2.5">
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="title, tag, description..."
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-transparent outline-none text-[12px] text-tx px-3 py-2.5 placeholder:text-muted caret-green font-mono"
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            className="px-3 text-muted hover:text-tx transition-colors text-[14px] py-2.5"
          >
            ×
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status filters */}
        <div className="flex items-center gap-1 border-r border-border2 pr-3 mr-1">
          {(["all", "live", "beta", "coming-soon"] as const).map(s => (
            <button
              key={s}
              onClick={() => onStatusFilterChange(s)}
              className={`text-[9px] tracking-[0.06em] border px-2 py-1 transition-colors font-mono
                ${statusFilter === s
                  ? "border-green text-green bg-green/10"
                  : "border-border2 text-muted hover:text-tx hover:border-muted"
                }`}
            >
              {s === "all" ? "all" : STATUS_LABEL[s as Tool["status"]]}
            </button>
          ))}
        </div>

        {/* Tag filters */}
        {ALL_TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => onToggleTag(tag)}
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
            onClick={onClearFilters}
            className="ml-auto text-[9px] text-muted hover:text-red-400 transition-colors tracking-[0.06em]"
          >
            clear filters
          </button>
        )}
      </div>
    </div>
  );
}