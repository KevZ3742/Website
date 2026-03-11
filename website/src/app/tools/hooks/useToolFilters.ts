import { useState, useMemo } from "react";
import { TOOLS } from "../lib/toolsData";
import type { StatusFilter } from "../components/ToolFilters";

export function useToolFilters() {
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
    return TOOLS.filter(t => {
      const matchQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.includes(q));

      const matchTags =
        activeTags.size === 0 ||
        [...activeTags].every(tag => t.tags.includes(tag));

      const matchStatus =
        statusFilter === "all" || t.status === statusFilter;

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