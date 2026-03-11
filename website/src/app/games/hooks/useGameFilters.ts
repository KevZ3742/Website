import { useState, useMemo } from "react";
import { GAMES } from "../lib/gamesData";
import type { StatusFilter } from "../components/GameFilters";

export function useGameFilters() {
  const [query,        setQuery]        = useState("");
  const [activeTags,   setActiveTags]   = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const toggleTag = (tag: string) => {
    setActiveTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) { next.delete(tag); } else { next.add(tag); }
      return next;
    });
  };

  const clearFilters = () => {
    setQuery("");
    setActiveTags(new Set());
    setStatusFilter("all");
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

  const hasFilters = !!(query.trim() || activeTags.size > 0 || statusFilter !== "all");

  return {
    query,
    activeTags,
    statusFilter,
    filtered,
    hasFilters,
    setQuery,
    toggleTag,
    setStatusFilter,
    clearFilters,
  };
}