// src/components/BlogSearch.tsx
"use client";

import { useMemo, useState } from "react";
import type { PostMeta } from "../lib/blog";
import { BlogCard } from "./BlogCard";

export function BlogSearch({ posts }: { posts: PostMeta[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [query, posts]);

  return (
    <>
      {/* ── Search bar (blog nav) ── */}
      <div className="search-glow flex items-center border border-border2 bg-surface transition-colors mb-2">
        <span className="hidden sm:flex px-3.5 text-muted select-none">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M11 11 14.5 14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="search posts by title, tag, or summary..."
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-transparent border-none outline-none text-[13px] text-tx px-4 py-3 placeholder:text-muted caret-green font-mono sm:border-l sm:border-border2"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="border-l border-border2 px-4 h-full text-[11px] text-muted hover:text-green transition-colors whitespace-nowrap font-mono"
          >
            clear
          </button>
        )}
      </div>

      {/* ── Results ── */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[13px] text-muted">
            No posts match &ldquo;{query}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((post, i) => (
            <BlogCard key={post.slug} post={post} index={i} total={filtered.length} />
          ))}
        </div>
      )}
    </>
  );
}
