// src/components/BlogCard.tsx
import Link from "next/link";
import type { PostMeta } from "../lib/blog";

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function BlogCard({ post, index, total }: { post: PostMeta; index: number; total: number }) {
  const number = String(index + 1).padStart(2, "0");
  const totalStr = String(total).padStart(2, "0");

  return (
    <article className="group py-8">
      <div className="flex items-start justify-between gap-4">
        <span className="text-[11px] tracking-[0.2em] text-muted font-mono tabular-nums">
          {number}<span className="text-label"> / {totalStr}</span>
        </span>
        <span className="text-[11px] tracking-[0.15em] text-label font-mono uppercase shrink-0">
          {formatDate(post.date)} · {post.readingTime}
        </span>
      </div>

      <Link href={`/blog/${post.slug}`} className="group/title mt-2 inline-flex items-baseline gap-2">
        <span className="text-xl sm:text-2xl font-semibold tracking-tight text-green transition-colors group-hover/title:text-tx">
          {post.title}
        </span>
        <span className="text-[11px] text-label opacity-0 -translate-x-1 transition-all duration-200 group-hover/title:opacity-100 group-hover/title:translate-x-0">
          →
        </span>
      </Link>

      <p className="mt-3 text-[13px] leading-relaxed text-muted max-w-[62ch]">
        {post.summary}
      </p>

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map(t => (
            <span
              key={t}
              className="text-[10px] tracking-[0.06em] text-muted border border-border px-2 py-1 font-mono whitespace-nowrap"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
