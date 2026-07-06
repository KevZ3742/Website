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
  date:    string;   // ISO date, e.g. "2026-07-05"
  summary: string;
  tags:    string[];
  draft?:  boolean;
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
    date: data.date ?? "",
    summary: data.summary ?? "",
    tags: data.tags ?? [],
    draft: data.draft ?? false,
    readingTime: readingTimeFor(content),
    content,
  };
}

/** Metadata for every non-draft post, newest first. */
export function getAllPosts(): PostMeta[] {
  return getAllSlugs()
    .map(slug => getPostBySlug(slug))
    .filter((p): p is Post => p !== null && !p.draft)
    .map((post): PostMeta => {
      const { slug, title, date, summary, tags, draft, readingTime } = post;
      return { slug, title, date, summary, tags, draft, readingTime };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** All tags in use, for filtering, sorted alphabetically. */
export function getAllTags(): string[] {
  const set = new Set<string>();
  getAllPosts().forEach(p => p.tags.forEach(t => set.add(t)));
  return Array.from(set).sort();
}
