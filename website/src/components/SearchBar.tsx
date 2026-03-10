import { useRef, useEffect } from "react";
import { SEARCH_URLS, QUICK_LINKS, type Settings } from "../lib/settings";

interface SearchBarProps {
  searchEngine: Settings["searchEngine"];
}

export function SearchBar({ searchEngine }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount; also capture any keystroke that isn't in the input
  useEffect(() => {
    inputRef.current?.focus();
    const h = (e: KeyboardEvent) => {
      if (document.activeElement !== inputRef.current &&
          e.key.length === 1 && !e.metaKey && !e.ctrlKey)
        inputRef.current?.focus();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = (inputRef.current?.value ?? "").trim();
    if (!q) return;
    window.location.href = SEARCH_URLS[searchEngine] + encodeURIComponent(q);
  };

  return (
    <div className="w-full max-w-140 flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="search-glow flex items-center border border-border2 bg-surface transition-colors">
        <span className="hidden sm:block px-3.5 text-[10px] text-muted tracking-[0.08em] border-r border-border2 whitespace-nowrap select-none">
          {searchEngine}
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="search or type a url..."
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-transparent border-none outline-none text-[13px] text-tx px-4 py-3 placeholder:text-muted caret-green font-mono"
        />
        <button type="submit" className="border-l border-border2 px-4 h-full text-[11px] text-muted hover:text-green transition-colors whitespace-nowrap font-mono">
          ↵ go
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5 justify-center">
        {QUICK_LINKS.map(l => (
          <a key={l.label} href={l.href}
            className="text-[10px] tracking-[0.07em] text-muted border border-border px-2.5 py-0.5 hover:text-green hover:border-green transition-colors">
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}