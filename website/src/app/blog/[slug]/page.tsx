// src/app/blog/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { getAllPosts, getPostBySlug } from "../../../lib/blog";
import { mdxComponents } from "../../../components/BlogProse";

// Static export needs every dynamic route enumerated up front. Drafts are
// deliberately excluded — they don't get built into a public page at all
// until `draft: true` is removed from their frontmatter.
export function generateStaticParams() {
  return getAllPosts().map(post => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — kev.dev`,
    description: post.summary,
  };
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || post.draft) notFound();

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto font-mono">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[13px] tracking-[0.15em] uppercase text-tx">blog</h1>
          <p className="text-[10px] text-muted mt-0.5">
            {formatDate(post.date)} · {post.readingTime}
          </p>
        </div>
        <Link
          href="/blog"
          className="text-[10px] text-muted border border-border2 px-2.5 py-1 hover:text-tx hover:border-muted transition-colors tracking-[0.06em]"
        >
          ← all posts
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-12">
        <article>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-tx">
            {post.title}
          </h1>

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

          <div className="mt-8 pt-8 border-t border-border">
            <MDXRemote
              source={post.content}
              components={mdxComponents}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [rehypeSlug],
                },
              }}
            />
          </div>
        </article>

        <footer className="py-14 text-center">
          <Link
            href="/blog"
            className="text-[11px] tracking-[0.15em] text-label uppercase hover:text-tx transition-colors"
          >
            ← back to all posts
          </Link>
        </footer>
      </div>
    </div>
  );
}
