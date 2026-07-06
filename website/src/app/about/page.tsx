// src/app/about/page.tsx
//
// Filled in with resume data as a starting point — swap the bio paragraphs
// and photo for whatever feels right; the rest (timeline, skills, facts)
// is pulled straight from your resume.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "about — kev.dev",
  description: "About me.",
};

const TIMELINE = [
  { period: "Oct 2024 – Present", title: "Software Engineer Intern", org: "Public Policy Research Institute", note: "Rebuilding the TIDC website from Classic ASP / ASP.NET (C#) to a modern PHP framework — designed the reporting engine for dynamic data visualization and export, and helped build out the forms engine." },
  { period: "May 2024 – Present", title: "Software Engineer Intern", org: "NextCreator", note: "Architected and deployed a full-stack platform (Next.js, Node/Express, MongoDB) on a Dockerized DigitalOcean VPS — auth, payments, file storage, and real-time messaging, end to end." },
  { period: "Nov 2023", title: "2nd Place, TidalHack", org: "QuizForge", note: "Built a Chrome extension that turns highlighted or pasted text into multiple-choice quiz questions using an NLP pipeline." },
];

const SKILLS = [
  { group: "Languages", items: ["C#", "C++", "CSS", "HTML", "Java", "JavaScript", "PHP", "Python", "SQL", "TypeScript"] },
  { group: "Frameworks & Tools", items: ["Next.js", "React", "Node.js", "Express.js", "Laravel", "Flask", "Tailwind CSS", "Unity", "Electron"] },
  { group: "Infra & Services", items: ["MongoDB", "MySQL", "SQLite", "Prisma", "Docker", "DigitalOcean", "Amazon S3", "Clerk", "Stripe", "Socket.IO"] },
];

const HOBBIES = "video games, badminton, pickleball, bouldering, board games, calisthenics, anime, and drawing";

const FACTS = [
  { label: "Based in", value: "College Station, TX" },
  { label: "Studying", value: "B.S. Data Engineering @ Texas A&M" },
  { label: "Currently", value: "Interning at PPRI + NextCreator" },
  { label: "Languages spoken", value: "English, Chinese" },
];

export default function AboutPage() {
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
          <h1 className="mt-8 text-3xl sm:text-4xl font-semibold tracking-tight text-tx">
            About
          </h1>
        </header>

        {/* ── Hero / intro ── */}
        <section className="py-12 border-b border-border flex flex-col sm:flex-row gap-8 items-start">
          <div className="w-28 h-28 border border-border2 bg-surface shrink-0 flex items-center justify-center text-[10px] text-label tracking-widest uppercase">
            [photo]
          </div>
          <div className="flex-1">
            <p className="text-[17px] leading-relaxed text-tx">
              I&apos;m Kevin — a Data Engineering student at Texas A&M and a
              software engineer building full-stack platforms, dev tools, and
              the occasional game on the side.
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-muted">
              Right now I&apos;m splitting time between the Public Policy
              Research Institute and NextCreator, and building out this site
              as a place to put everything else I make. I&apos;m open to
              internships, collabs, and freelance work — feel free to reach
              out.
            </p>
          </div>
        </section>

        {/* ── Quick facts ── */}
        <section className="py-10 border-b border-border grid grid-cols-2 sm:grid-cols-4 gap-6">
          {FACTS.map(f => (
            <div key={f.label} className="flex flex-col gap-1">
              <span className="text-[10px] tracking-[0.15em] uppercase text-label">{f.label}</span>
              <span className="text-[13px] text-tx">{f.value}</span>
            </div>
          ))}
        </section>

        {/* ── Timeline ── */}
        <section className="py-10 border-b border-border">
          <h2 className="text-[11px] tracking-[0.15em] uppercase text-label mb-6">Timeline</h2>
          <div className="space-y-6">
            {TIMELINE.map((t, i) => (
              <div key={i} className="flex gap-5">
                <span className="w-32 shrink-0 text-[11px] text-label pt-0.5">{t.period}</span>
                <div className="flex-1 pb-6 border-l border-border pl-5 relative">
                  <span className="absolute -left-1.25 top-1 w-2.25 h-2.25 rounded-full bg-bg border border-green" />
                  <div className="text-[14px] text-tx">{t.title}</div>
                  <div className="text-[12px] text-muted">{t.org}</div>
                  <p className="mt-1.5 text-[12px] text-muted leading-relaxed">{t.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Skills ── */}
        <section className="py-10 border-b border-border">
          <h2 className="text-[11px] tracking-[0.15em] uppercase text-label mb-6">Skills</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {SKILLS.map(s => (
              <div key={s.group}>
                <div className="text-[11px] text-muted mb-2.5">{s.group}</div>
                <div className="flex flex-wrap gap-1.5">
                  {s.items.map(item => (
                    <span
                      key={item}
                      className="text-[11px] text-tx border border-border2 px-2 py-0.5"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Hobbies ── */}
        <section className="py-10 border-b border-border">
          <h2 className="text-[11px] tracking-[0.15em] uppercase text-label mb-6">Hobbies</h2>
          <p className="text-[13px] leading-relaxed text-muted max-w-xl">
            Outside of code, I&apos;m into {HOBBIES}.
          </p>
        </section>

        <footer className="py-14 text-center">
          <span className="text-[11px] tracking-[0.15em] text-label uppercase">
            end of page
          </span>
        </footer>
      </div>
    </div>
  );
}
