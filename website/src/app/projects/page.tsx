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
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[13px] tracking-[0.15em] uppercase text-tx">projects</h1>
          <p className="text-[10px] text-muted mt-0.5">
            {PROJECTS.length} selected works
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
        {/* ── List ── */}
        <div className="divide-y divide-border">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} total={PROJECTS.length} />
          ))}
        </div>

        <footer className="py-14 text-center">
          <span className="text-[11px] tracking-[0.15em] text-label uppercase">
            end of list
          </span>
        </footer>
      </div>
    </div>
  );
}