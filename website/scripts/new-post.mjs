#!/usr/bin/env node
// scripts/new-post.mjs
//
// Scaffolds a new blog post: npm run new-post -- "My Post Title"
// Creates content/blog/<slug>.mdx with frontmatter pre-filled and today's
// date, so you can just start writing.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, "..", "content", "blog");

const title = process.argv.slice(2).join(" ").trim();

if (!title) {
  console.error('Usage: npm run new-post -- "My Post Title"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, "")
  .trim()
  .replace(/\s+/g, "-");

const filePath = path.join(POSTS_DIR, `${slug}.mdx`);

if (fs.existsSync(filePath)) {
  console.error(`A post already exists at content/blog/${slug}.mdx`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);

const template = `---
title: "${title}"
date: "${today}"
summary: "One or two sentences describing the post — shows up on the blog index."
tags: []
draft: true
---

Start writing here. This body is MDX, so regular Markdown works
(**bold**, _italics_, lists, code blocks, > blockquotes, images, tables via
GFM), and you can drop in React components later if you need something
custom.

Set \`draft: true\` in the frontmatter above to keep a post out of the
index and out of the static build entirely; flip it to \`false\` (or
remove it) when you're ready to publish.
`;

fs.mkdirSync(POSTS_DIR, { recursive: true });
fs.writeFileSync(filePath, template, "utf8");

console.log(`Created content/blog/${slug}.mdx`);
