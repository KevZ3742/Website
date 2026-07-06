// src/lib/projects.ts
// ── Types ─────────────────────────────────────────────────────────────────────

export type ProjectLinkType = "repo" | "live" | "external" | "private";

export interface ProjectLink {
  type:  ProjectLinkType;
  url?:  string;   // omitted when type === "private"
  label: string;   // e.g. "GitHub", "Live site", "Devpost", "Source private"
}

export interface Project {
  slug:        string;
  title:       string;
  period:      string;   // e.g. "Jan 2025" — shown top-right, dimmed
  image:       string;   // path under /public, or a placehold.co URL for now
  imageAlt:    string;
  description: string;
  tech:        string[];
  award?:      string;   // optional accolade line, e.g. "Won 2nd Place @ TAMUHack 2025"
  links:       ProjectLink[];
}

// ── Content ───────────────────────────────────────────────────────────────────
// Ordered by start date, descending. A few have no fixed date (ongoing/WIP/
// collections) — those are placed by best judgment rather than forced into
// the timeline. Reorder freely, this is just a first pass.

export const PROJECTS: Project[] = [
  {
    slug: "kev-dev",
    title: "kev.dev",
    period: "Mar 2026 – Present",
    image: "/projects/kev-dev.png",
    imageAlt: "kev.dev homepage screenshot",
    description:
      "My everything site — this one. A single hub combining a portfolio, blog, built-in search bar, and a live collaborative bulletin board with draggable widgets, alongside a growing suite of browser-based tools (RNG toolkit, Lorem Ipsum generator) and games (Love Letter, Exploding Kittens, Word Hunt, Chromatch, Slide Puzzle). Fully custom-themeable, built and maintained end to end.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    links: [
      { type: "repo", url: "https://github.com/KevZ3742/Website", label: "GitHub" },
      { type: "live", url: "https://website-nu-lilac-45.vercel.app/", label: "Live site" },
    ],
  },
  {
    slug: "inksync",
    title: "InkSync",
    period: "Mar 2026",
    image: "/projects/inksync.jpg",
    imageAlt: "InkSync collaborative whiteboard screenshot",
    description:
      "A collaborative whiteboard with WebSocket-based real-time sync across up to 50 concurrent users. Streams AI-powered drawing generation through the Gemini API and supports voice-to-drawing input via MediaRecorder and Groq's Whisper API for hands-free prompting. A custom shape-recognition algorithm classifies freehand pen strokes into geometric primitives, with a full JSON / PNG / SVG import-export pipeline.",
    tech: ["Next.js", "Socket.IO", "Canvas API", "Gemini API", "Groq Whisper API"],
    links: [
      { type: "repo", url: "https://github.com/KevZ3742/InkSync", label: "GitHub" },
      { type: "live", url: "https://ink-sync-ten.vercel.app/", label: "Live site" },
    ],
  },
  {
    slug: "startx",
    title: "StartX",
    period: "Jun 2025",
    image: "/projects/startx.png",
    imageAlt: "StartX startpage and knowledge base screenshot",
    description:
      "A fork of the open-source Memex personal knowledge base, extended into a hybrid startpage and bookmarking tool. Runs on a custom parser for the human-readable Indental flat-file format, with tag / type / project filtering, full-text search, and real-time URL hash-based routing — entirely read-only and serverless.",
    tech: ["JavaScript", "HTML/CSS", "IndentalDB", "Masonry.js", "100r Theming"],
    links: [
      { type: "repo", url: "https://github.com/KevZ3742/StartX", label: "GitHub" },
      { type: "live", url: "https://kevz3742.github.io/StartX", label: "Live site" },
    ],
  },
  {
    slug: "messaging",
    title: "Messaging",
    period: "Nov 2024",
    image: "/projects/messaging.png",
    imageAlt: "Messaging app screenshot",
    description:
      "A barebones, plug-and-play messaging server — just Express and Socket.IO, no framework overhead. Built to be dropped into other projects and customized freely; the same real-time layer now runs the chat in both InkSync and NextCreator.",
    tech: ["Node.js", "Express", "Socket.IO"],
    links: [
      { type: "repo", url: "https://github.com/KevZ3742/Messaging", label: "GitHub" },
    ],
  },
  {
    slug: "nextcreator",
    title: "NextCreator",
    period: "May 2024 – Present",
    image: "/projects/nextcreator.jpg",
    imageAlt: "NextCreator platform screenshot",
    description:
      "A full-stack startup platform architected end to end: Next.js on the frontend, Node.js/Express and MongoDB on the backend, deployed on a Dockerized DigitalOcean VPS. Designed and wired up the whole stack myself — authentication (Clerk), payments (Stripe), file storage (S3), and real-time messaging (Socket.IO).",
    tech: ["Next.js", "Node.js", "Express", "MongoDB", "Docker", "Clerk", "Stripe", "Amazon S3", "Socket.IO"],
    links: [
      { type: "live", url: "https://nextcreatorlab.com/", label: "Live site" },
      { type: "private", label: "Source private" },
    ],
  },
  {
    slug: "resonance",
    title: "Resonance",
    period: "In Progress",
    image: "/projects/resonance.png",
    imageAlt: "Resonance music app screenshot",
    description:
      "A work-in-progress desktop music app built on Electron and Vite. Pulls audio down with yt-dlp and processes it through ffmpeg, behind a Tailwind CSS interface — still very much a moving target.",
    tech: ["Electron", "Vite", "Tailwind CSS", "yt-dlp", "ffmpeg"],
    links: [
      { type: "repo", url: "https://github.com/KevZ3742/Resonance", label: "GitHub" },
    ],
  },
  {
    slug: "quizforge",
    title: "QuizForge",
    period: "Nov 2023",
    image: "/projects/quizforge.png",
    imageAlt: "QuizForge Chrome extension screenshot",
    description:
      "A Chrome extension that turns any highlighted or pasted text into multiple-choice quiz questions on the spot, using a pre-built NLP library for question generation.",
    tech: ["JavaScript", "HTML/CSS", "Chrome Extensions API", "RESTful API", "Python NLP"],
    award: "Won 2nd Place — TidalHack 2023",
    links: [
      { type: "repo", url: "https://github.com/KevZ3742/QuizForge", label: "GitHub" },
    ],
  },
  {
    slug: "tactics",
    title: "Tactics",
    period: "Aug 2022",
    image: "/projects/tactics.png",
    imageAlt: "Tactics real-time strategy game screenshot",
    description:
      "A real-time strategy game built in Unity with Photon PUN for multiplayer. Covers the core RTS stack: unit command queuing, A* pathfinding, grid-based building placement, fog of war, and state sync across networked sessions.",
    tech: ["C#", "Unity", "Photon PUN", "A* Pathfinding"],
    links: [
      { type: "live", url: "https://kevz3742.itch.io/tactics", label: "Play on itch.io" },
      { type: "private", label: "No public repo" },
    ],
  },
  {
    slug: "runedump",
    title: "RuneDump",
    period: "Jul 2022",
    image: "https://placehold.co/800x600/141615/4a514c?text=RuneDump",
    imageAlt: "RuneDump League of Legends rune manager screenshot",
    description:
      "A personal League of Legends rune manager for macOS — saves custom rune pages locally so they can be re-imported alongside champ select through the League Client's local API, instead of grinding out extra rune pages. Probably deprecated at this point.",
    tech: ["Python", "Tkinter", "League Client API"],
    links: [
      { type: "repo", url: "https://github.com/KevZ3742/RuneDump", label: "GitHub" },
    ],
  },
  {
    slug: "itch-collection",
    title: "Game Jam Collection",
    period: "Various",
    image: "https://placehold.co/800x600/141615/4a514c?text=itch.io",
    imageAlt: "itch.io game collection screenshot",
    description:
      "A running collection of game jam entries built over the years. Most are unfinished, but all are technically sound and playable start to finish.",
    tech: [],
    links: [
      { type: "live", url: "https://kevz3742.itch.io/", label: "Browse on itch.io" },
    ],
  },
];