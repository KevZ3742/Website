// src/app/projects/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PROJECTS } from "../../lib/projects";
import { ProjectCard } from "../../components/ProjectCard";

export const metadata: Metadata = {
  title: "projects — kev.dev",
  description: "Selected work.",
};

export default function ProjectsPage() {
  return (
    <div className="fixed inset-0 z-10 overflow-y-auto font-mono">
      <div className="max-w-3xl mx-auto px-6 sm:px-8">
        {/* ── Header ── */}
        <header className="pt-16 pb-10 border-b border-border">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] border border-border2 px-2.5 py-0.5 tracking-widest text-muted hover:text-green hover:border-green transition-colors"
          >
            <span>⎋</span>back
          </Link>

          <div className="mt-8 flex items-end justify-between gap-4">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-tx">
              Projects
            </h1>
            <span className="text-[11px] tracking-[0.2em] text-dim uppercase pb-1">
              {String(PROJECTS.length).padStart(2, "0")} selected works
            </span>
          </div>
        </header>

        {/* ── List ── */}
        <div className="divide-y divide-border">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} total={PROJECTS.length} />
          ))}
        </div>

        <footer className="py-14 text-center">
          <span className="text-[11px] tracking-[0.15em] text-dim uppercase">
            end of list
          </span>
        </footer>
      </div>
    </div>
  );
}