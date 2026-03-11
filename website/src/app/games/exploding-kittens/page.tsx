"use client";

import Link from "next/link";

export default function ExplodingKittensPage() {
  return (
    <div className="h-screen flex flex-col bg-bg font-mono">
      {/* Thin header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface shrink-0">
        <span className="text-[11px] text-muted tracking-[0.12em] uppercase">exploding kittens</span>
        <Link
          href="/games"
          className="text-[10px] text-muted border border-border2 px-2.5 py-1 hover:text-tx hover:border-muted transition-colors tracking-[0.06em]"
        >
          ← games
        </Link>
      </div>

      {/* Full-height iframe */}
      <iframe
        src="https://exploding-kittens-qkhg.onrender.com"
        className="flex-1 w-full border-none"
        allow="fullscreen"
      />
    </div>
  );
}