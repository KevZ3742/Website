// src/lib/blog.ts
//
// File-based blog content. Each post is an .mdx file in /content/blog with
// frontmatter up top. No database, no accounts, no admin panel — add a file,
// commit, deploy. Everything here runs at build time (this is a static
// export site — see next.config.ts), so fs access is safe.

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "blog");

export interface PostMeta {
  slug:    string;
  title:   string;
  date:    string;   // "YYYY-MM-DD" or full ISO datetime "YYYY-MM-DDTHH:MM"
  summary: string;
  tags:    string[];
  draft?:  boolean;
  order?:  number;   // tiebreaker for same-day posts — higher sorts first
  readingTime: string; // e.g. "4 min read"
}

export interface Post extends PostMeta {
  content: string; // raw MDX body, compiled later by MDXRemote
}

function readingTimeFor(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function slugFromFilename(filename: string): string {
  return filename.replace(/\.mdx?$/, "");
}

// YAML auto-parses unquoted dates (e.g. `date: 2026-07-05`) into a JS Date
// object rather than a string. Normalize either shape back to a plain
// "YYYY-MM-DD" (or full ISO) string so the rest of this file only ever
// deals with strings.
function normalizeDate(raw: unknown): string {
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  if (typeof raw === "string") return raw;
  return "";
}

// Sortable timestamp for a post: real Date if parseable, else the epoch —
// unparseable/missing dates sink to the bottom rather than crashing.
function timestampFor(date: string): number {
  const t = Date.parse(date.includes("T") ? date : `${date}T00:00:00`);
  return isNaN(t) ? 0 : t;
}

/** All post slugs (filenames without extension), for generateStaticParams. */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter(f => f.endsWith(".mdx") || f.endsWith(".md"))
    .map(slugFromFilename);
}

/** Full post (metadata + raw MDX body) for a single slug. */
export function getPostBySlug(slug: string): Post | null {
  const full = ["mdx", "md"]
    .map(ext => path.join(POSTS_DIR, `${slug}.${ext}`))
    .find(p => fs.existsSync(p));
  if (!full) return null;

  const raw = fs.readFileSync(full, "utf8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title ?? slug,
    date: normalizeDate(data.date),
    summary: data.summary ?? "",
    tags: data.tags ?? [],
    draft: data.draft ?? false,
    order: typeof data.order === "number" ? data.order : 0,
    readingTime: readingTimeFor(content),
    content,
  };
}

function sortPosts<T extends { date: string; order?: number }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    const byDate = timestampFor(b.date) - timestampFor(a.date);
    if (byDate !== 0) return byDate;
    // Same day (or same exact timestamp) — higher `order` shows first.
    return (b.order ?? 0) - (a.order ?? 0);
  });
}

/** Metadata for every non-draft post, newest first. */
export function getAllPosts(): PostMeta[] {
  const posts = getAllSlugs()
    .map(slug => getPostBySlug(slug))
    .filter((p): p is Post => p !== null && !p.draft)
    .map((post): PostMeta => {
      const { slug, title, date, summary, tags, draft, order, readingTime } = post;
      return { slug, title, date, summary, tags, draft, order, readingTime };
    });
  return sortPosts(posts);
}

/** The post immediately older and immediately newer than `slug`, for prev/next nav. */
export function getAdjacentPosts(slug: string): { older: PostMeta | null; newer: PostMeta | null } {
  const posts = getAllPosts();
  const i = posts.findIndex(p => p.slug === slug);
  if (i === -1) return { older: null, newer: null };
  return {
    newer: i > 0 ? posts[i - 1] : null,
    older: i < posts.length - 1 ? posts[i + 1] : null,
  };
}

/** All tags in use, for filtering, sorted alphabetically. */
export function getAllTags(): string[] {
  const set = new Set<string>();
  getAllPosts().forEach(p => p.tags.forEach(t => set.add(t)));
  return Array.from(set).sort();
}
