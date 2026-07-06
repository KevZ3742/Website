// src/components/ProjectCard.tsx
import Image from "next/image";
import type { Project, ProjectLink } from "../lib/projects";
import { RepoIcon, ExternalIcon, PlayIcon, LockIcon } from "./icons/LinkIcons";

function LinkGlyph({ type }: { type: ProjectLink["type"] }) {
  const cls = "w-3 h-3";
  if (type === "repo")    return <RepoIcon className={cls} />;
  if (type === "live")    return <PlayIcon className={cls} />;
  if (type === "private") return <LockIcon className={cls} />;
  return <ExternalIcon className={cls} />;
}

function LinkPill({ link }: { link: ProjectLink }) {
  const shared =
    "inline-flex items-center gap-1.5 text-[10px] tracking-[0.08em] uppercase px-2.5 py-1 border font-mono transition-colors";

  if (link.type === "private" || !link.url) {
    return (
      <span className={`${shared} border-border2 text-label cursor-default`}>
        <LinkGlyph type="private" />
        {link.label}
      </span>
    );
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${shared} border-border2 text-muted hover:text-green hover:border-green`}
    >
      <LinkGlyph type={link.type} />
      {link.label}
    </a>
  );
}

export function ProjectCard({ project, index, total }: { project: Project; index: number; total: number }) {
  const primaryHref = project.links.find(l => l.url)?.url;
  const number = String(index + 1).padStart(2, "0");
  const totalStr = String(total).padStart(2, "0");

  const titleNode = primaryHref ? (
    <a
      href={primaryHref}
      target="_blank"
      rel="noopener noreferrer"
      className="group/title inline-flex items-baseline gap-2"
    >
      <span className="text-xl sm:text-2xl font-semibold tracking-tight text-green transition-colors group-hover/title:text-tx">
        {project.title}
      </span>
      <span className="text-[11px] text-label opacity-0 -translate-x-1 transition-all duration-200 group-hover/title:opacity-100 group-hover/title:translate-x-0">
        ↗
      </span>
    </a>
  ) : (
    <span className="text-xl sm:text-2xl font-semibold tracking-tight text-tx">{project.title}</span>
  );

  return (
    <article className="group grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-6 sm:gap-8 py-10">
      {/* ── Image ── */}
      <div className="relative aspect-video sm:aspect-4/3 w-full overflow-hidden border border-border bg-dim shrink-0">
        <Image
          src={project.image}
          alt={project.imageAlt}
          fill
          sizes="(min-width: 640px) 240px, 100vw"
          className="object-cover grayscale-35 transition-all duration-500 group-hover:grayscale-0 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 border border-border2" />
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-start justify-between gap-4">
          <span className="text-[11px] tracking-[0.2em] text-muted font-mono tabular-nums">
            {number}<span className="text-label"> / {totalStr}</span>
          </span>
          <span className="text-[11px] tracking-[0.15em] text-label font-mono uppercase shrink-0">
            {project.period}
          </span>
        </div>

        <div className="mt-2">
          {titleNode}
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-muted max-w-[62ch]">
          {project.description}
        </p>

        {project.award && (
          <p className="mt-3 text-[11px] tracking-wide text-green/90 font-mono">
            ▲ {project.award}
          </p>
        )}

        <div className="mt-auto pt-6 flex flex-col gap-4">
          {project.tech.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.tech.map(t => (
                <span
                  key={t}
                  className="text-[10px] tracking-[0.06em] text-muted border border-border px-2 py-1 font-mono whitespace-nowrap"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-1">
            {project.links.map((l, i) => (
              <LinkPill key={i} link={l} />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}