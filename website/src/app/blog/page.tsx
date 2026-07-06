// src/app/blog/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "../../lib/blog";
import { BlogCard } from "../../components/BlogCard";

export const metadata: Metadata = {
  title: "blog — kev.dev",
  description: "Writing on whatever I'm building or thinking about.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto font-mono">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[13px] tracking-[0.15em] uppercase text-tx">blog</h1>
          <p className="text-[10px] text-muted mt-0.5">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </p>
        </div>
        <Link
          href="/"
          className="text-[10px] text-muted border border-border2 px-2.5 py-1 hover:text-tx hover:border-muted transition-colors tracking-[0.06em]"
        >
          ← home
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-6">
        {posts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[13px] text-muted">
              Nothing here yet — first post is on its way.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posts.map((post, i) => (
              <BlogCard key={post.slug} post={post} index={i} total={posts.length} />
            ))}
          </div>
        )}

        <footer className="py-14 text-center">
          <span className="text-[11px] tracking-[0.15em] text-label uppercase">
            end of list
          </span>
        </footer>
      </div>
    </div>
  );
}
