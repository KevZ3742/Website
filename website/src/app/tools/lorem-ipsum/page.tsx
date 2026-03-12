"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { BUILTIN_THEMES, applyTheme } from "../../../lib/themes";
import { loadSettings, loadCustomThemes } from "../../../lib/settings";

// ── Lorem ipsum word banks ────────────────────────────────────────────────────

const LOREM_WORDS = [
  "lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit",
  "sed","do","eiusmod","tempor","incididunt","ut","labore","et","dolore",
  "magna","aliqua","enim","ad","minim","veniam","quis","nostrud","exercitation",
  "ullamco","laboris","nisi","aliquip","ex","ea","commodo","consequat","duis",
  "aute","irure","in","reprehenderit","voluptate","velit","esse","cillum",
  "fugiat","nulla","pariatur","excepteur","sint","occaecat","cupidatat","non",
  "proident","sunt","culpa","qui","officia","deserunt","mollit","anim","id","est",
  "laborum","perspiciatis","unde","omnis","iste","natus","error","accusantium",
  "doloremque","laudantium","totam","rem","aperiam","eaque","ipsa","quae","ab",
  "inventore","veritatis","quasi","architecto","beatae","vitae","dicta","explicabo",
  "nemo","ipsam","quia","voluptas","aspernatur","odit","fugit","consequuntur",
  "magni","dolores","eos","ratione","sequi","nesciunt","neque","porro","quisquam",
  "dolorem","adipisci","numquam","eius","modi","tempora","incidunt","magnam",
  "quaerat","soluta","nobis","eligendi","optio","cumque","nihil","impedit",
  "animi","molestiae","vel","illum","voluptatem","fugiam","quidem","reiciendis",
  "dignissimos","ducimus","blanditiis","praesentium","deleniti","atque","corrupti",
  "quos","quas","molestias","excepturi","similique","occaecati","cupiditate",
  "provident","similique","mollitia","autem","consequatur","recusandae","itaque",
  "earum","rerum","hic","tenetur","sapiente","delectus","reiciendis","maiores",
  "facilis","expedita","saepe","eveniet","voluptatibus","repudiandae","alias",
  "perferendis","doloribus","asperiores","repellat","suscipit","quibusdam",
];

const TECH_WORDS = [
  "function","const","async","await","return","export","import","interface",
  "component","render","state","props","hook","effect","callback","promise",
  "request","response","endpoint","middleware","schema","query","mutation",
  "deploy","container","pipeline","repository","branch","commit","merge",
  "latency","throughput","payload","token","auth","cache","proxy","gateway",
  "database","migration","index","transaction","rollback","snapshot","cluster",
  "microservice","serverless","edge","compute","runtime","binary","protocol",
  "socket","handshake","packet","buffer","stream","event","listener","observer",
  "singleton","factory","adapter","decorator","strategy","facade","iterator",
];

const CORPORATE_WORDS = [
  "synergy","leverage","paradigm","disruptive","scalable","agile","pivot",
  "bandwidth","deep-dive","circle-back","move-the-needle","value-add","holistic",
  "ecosystem","stakeholders","deliverables","alignment","touchpoint","onboarding",
  "roadmap","KPIs","OKRs","sprint","iteration","velocity","backlog","grooming",
  "low-hanging-fruit","boil-the-ocean","helicopter-view","actionable","impactful",
  "robust","seamless","bleeding-edge","mission-critical","best-of-breed","turnkey",
  "enterprise","B2B","SaaS","go-to-market","thought-leadership","customer-centric",
  "data-driven","AI-powered","cloud-native","future-proof","game-changing","organic",
];

const HIPSTER_WORDS = [
  "artisanal","small-batch","craft","bespoke","curated","handcrafted","organic",
  "sustainable","farm-to-table","locally-sourced","cold-brew","single-origin",
  "pour-over","kombucha","sourdough","avocado","deconstructed","elevated","umami",
  "lush","vibrant","minimalist","intentional","authentic","raw","honest","clean",
  "analog","nostalgia","vintage","thrifted","upcycled","zero-waste","mindful",
  "wellness","self-care","hygge","wabi-sabi","ikigai","flow","present","grounded",
  "wanderlust","nomadic","slow-living","intentional","curated","aesthetic","vibe",
];

type WordBank = "lorem" | "tech" | "corporate" | "hipster";
type OutputFormat = "paragraphs" | "sentences" | "words" | "list" | "html";

const WORD_BANKS: Record<WordBank, string[]> = {
  lorem: LOREM_WORDS,
  tech: TECH_WORDS,
  corporate: CORPORATE_WORDS,
  hipster: HIPSTER_WORDS,
};

const BANK_LABELS: Record<WordBank, string> = {
  lorem: "classic lorem",
  tech: "tech jargon",
  corporate: "corporate speak",
  hipster: "hipster",
};

// ── Generator ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateSentence(words: string[], minW = 6, maxW = 18): string {
  const count = minW + Math.floor(Math.random() * (maxW - minW));
  const chosen = Array.from({ length: count }, () => pick(words));
  // Add comma roughly 1-in-4 chance at middle words
  const parts = chosen.map((w, i) => {
    if (i > 0 && i < chosen.length - 1 && Math.random() < 0.12) return w + ",";
    return w;
  });
  const punctuation = pick([".", ".", ".", ".", "?", "!"]);
  return capitalize(parts.join(" ")) + punctuation;
}

function generateParagraph(words: string[], minS = 3, maxS = 6): string {
  const count = minS + Math.floor(Math.random() * (maxS - minS));
  return Array.from({ length: count }, () => generateSentence(words)).join(" ");
}

function generate(
  bank: WordBank,
  format: OutputFormat,
  count: number,
  startWithLorem: boolean,
): string {
  const words = WORD_BANKS[bank];

  const loremOpener = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

  switch (format) {
    case "paragraphs": {
      const paras = Array.from({ length: count }, (_, i) => {
        if (i === 0 && startWithLorem && bank === "lorem") return loremOpener + " " + generateParagraph(words, 2, 5);
        return generateParagraph(words);
      });
      return paras.join("\n\n");
    }
    case "sentences": {
      const sentences = Array.from({ length: count }, (_, i) => {
        if (i === 0 && startWithLorem && bank === "lorem") return loremOpener;
        return generateSentence(words);
      });
      return sentences.join(" ");
    }
    case "words": {
      const chosen = Array.from({ length: count }, () => pick(words));
      if (startWithLorem && bank === "lorem") chosen.splice(0, 2, "lorem", "ipsum");
      return chosen.join(" ");
    }
    case "list": {
      return Array.from({ length: count }, () => capitalize(generateSentence(words, 2, 6).replace(/[.!?]$/, ""))).join("\n");
    }
    case "html": {
      const paras = Array.from({ length: count }, (_, i) => {
        if (i === 0 && startWithLorem && bank === "lorem") return `<p>${loremOpener} ${generateParagraph(words, 2, 4)}</p>`;
        return `<p>${generateParagraph(words)}</p>`;
      });
      return paras.join("\n");
    }
  }
}

// ── Format labels ─────────────────────────────────────────────────────────────

const FORMAT_LABELS: Record<OutputFormat, { label: string; desc: string; unit: string }> = {
  paragraphs: { label: "paragraphs", desc: "multi-sentence blocks", unit: "paragraphs" },
  sentences:  { label: "sentences",  desc: "individual sentences",   unit: "sentences"  },
  words:      { label: "words",      desc: "raw word list",          unit: "words"      },
  list:       { label: "list",       desc: "bullet-ready phrases",   unit: "items"      },
  html:       { label: "html",       desc: "<p> tagged blocks",      unit: "paragraphs" },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoremIpsumPage() {
  const [bank,           setBank]           = useState<WordBank>("lorem");
  const [format,         setFormat]         = useState<OutputFormat>("paragraphs");
  const [count,          setCount]          = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output,         setOutput]         = useState("");
  const [copied,         setCopied]         = useState(false);
  const [autoGen,        setAutoGen]        = useState(true);

  useEffect(() => {
    const settings     = loadSettings();
    const customThemes = loadCustomThemes();
    const allThemes    = [...BUILTIN_THEMES, ...customThemes];
    const active       = allThemes.find(t => t.name === settings.themeName) ?? BUILTIN_THEMES[0];
    applyTheme(active.colors);
  }, []);

  const generate_ = useCallback(() => {
    setOutput(generate(bank, format, count, startWithLorem));
  }, [bank, format, count, startWithLorem]);

  // Auto-generate on settings change if autoGen enabled
  useEffect(() => {
    if (autoGen) generate_();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank, format, count, startWithLorem, autoGen]);

  // Initial generation
  useEffect(() => { generate_(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const copyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const wordCount = output.trim().split(/\s+/).filter(Boolean).length;
  const charCount = output.length;
  const paraCount = output.split("\n\n").filter(Boolean).length;
  const unit = FORMAT_LABELS[format].unit;

  return (
    <div className="min-h-screen bg-bg font-mono text-tx">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[13px] tracking-[0.15em] uppercase text-tx">lorem ipsum</h1>
          <p className="text-[10px] text-muted mt-0.5">placeholder text generator · client-side · no tracking</p>
        </div>
        <Link href="/tools"
          className="text-[10px] text-muted border border-border2 px-2.5 py-1 hover:text-tx hover:border-muted transition-colors tracking-[0.06em]">
          ← tools
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">

        {/* Word bank */}
        <div className="space-y-1.5">
          <span className="text-[9px] text-muted tracking-[0.08em] uppercase">word bank</span>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(BANK_LABELS) as WordBank[]).map(b => (
              <button key={b} onClick={() => setBank(b)}
                className={`text-[10px] tracking-[0.06em] border px-3 py-1.5 font-mono transition-colors
                  ${bank === b ? "border-green text-green bg-green/10" : "border-border2 text-muted hover:text-tx hover:border-muted"}`}>
                {BANK_LABELS[b]}
              </button>
            ))}
          </div>
        </div>

        {/* Format */}
        <div className="space-y-1.5">
          <span className="text-[9px] text-muted tracking-[0.08em] uppercase">format</span>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(FORMAT_LABELS) as OutputFormat[]).map(f => (
              <button key={f} onClick={() => setFormat(f)}
                className={`flex flex-col items-start border px-3 py-1.5 font-mono transition-colors
                  ${format === f ? "border-green text-green bg-green/10" : "border-border2 text-muted hover:text-tx hover:border-muted"}`}>
                <span className="text-[10px] tracking-[0.06em]">{FORMAT_LABELS[f].label}</span>
                <span className={`text-[8px] tracking-[0.04em] ${format === f ? "text-green/60" : "text-dim"}`}>
                  {FORMAT_LABELS[f].desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Count + options row */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1">
            <span className="text-[9px] text-muted tracking-[0.08em] uppercase block">{unit}</span>
            <div className="flex items-center border border-border2">
              <button onClick={() => setCount(c => Math.max(1, c - 1))}
                className="px-2.5 py-1.5 text-muted hover:text-green transition-colors text-[14px]">−</button>
              <span className="w-10 text-center text-[13px] text-tx tabular-nums font-mono">{count}</span>
              <button onClick={() => setCount(c => Math.min(20, c + 1))}
                className="px-2.5 py-1.5 text-muted hover:text-green transition-colors text-[14px]">+</button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 ml-2">
            {bank === "lorem" && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div onClick={() => setStartWithLorem(v => !v)}
                  className={`w-8 h-4 border transition-colors relative ${startWithLorem ? "border-green bg-green/20" : "border-border2"}`}>
                  <div className="absolute top-0.5 w-3 h-3 transition-all"
                    style={{ left: startWithLorem ? "18px" : "2px", background: startWithLorem ? "var(--green)" : "var(--muted)" }} />
                </div>
                <span className="text-[10px] text-muted">start with &quot;lorem ipsum&quot;</span>
              </label>
            )}

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div onClick={() => setAutoGen(v => !v)}
                className={`w-8 h-4 border transition-colors relative ${autoGen ? "border-green bg-green/20" : "border-border2"}`}>
                <div className="absolute top-0.5 w-3 h-3 transition-all"
                  style={{ left: autoGen ? "18px" : "2px", background: autoGen ? "var(--green)" : "var(--muted)" }} />
              </div>
              <span className="text-[10px] text-muted">auto-regenerate</span>
            </label>
          </div>
        </div>

        {/* Generate button */}
        <button onClick={generate_}
          className="w-full border border-green text-green text-[11px] tracking-widest py-2.5 hover:bg-green/10 transition-colors font-mono">
          generate
        </button>

        {/* Output */}
        {output && (
          <div className="space-y-2">
            {/* Stats + copy */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[9px] text-muted">
                <span>{wordCount} words</span>
                <span>{charCount} chars</span>
                {format === "paragraphs" || format === "html" ? <span>{paraCount} {unit}</span> : null}
              </div>
              <button onClick={copyOutput}
                className="text-[9px] text-muted border border-border2 hover:text-green hover:border-green px-2.5 py-1 font-mono transition-colors tracking-[0.06em]">
                {copied ? "✓ copied" : "copy"}
              </button>
            </div>

            {/* Output textarea */}
            <div className="relative">
              <textarea
                readOnly
                value={output}
                rows={format === "words" ? 4 : format === "list" ? Math.min(count + 1, 12) : count * 4}
                className="w-full bg-bg border border-border2 px-4 py-3 text-[11px] text-tx font-mono outline-none resize-y leading-relaxed cursor-text select-all"
                onClick={e => (e.target as HTMLTextAreaElement).select()}
              />
            </div>

            {/* Preview card (non-HTML formats) */}
            {format !== "html" && format !== "words" && (
              <div className="border border-dashed border-border2 p-4 space-y-2">
                <span className="text-[9px] text-muted tracking-[0.08em] uppercase">preview</span>
                {format === "list" ? (
                  <ul className="space-y-1 text-[11px] text-muted leading-relaxed">
                    {output.split("\n").filter(Boolean).slice(0, 5).map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-dim shrink-0">·</span>
                        <span>{item}</span>
                      </li>
                    ))}
                    {output.split("\n").filter(Boolean).length > 5 && (
                      <li className="text-dim text-[9px]">+ {output.split("\n").filter(Boolean).length - 5} more...</li>
                    )}
                  </ul>
                ) : (
                  <div className="text-[11px] text-muted leading-relaxed max-h-32 overflow-hidden">
                    {output.split("\n\n")[0]}
                    {output.split("\n\n").length > 1 && <span className="text-dim"> [...]</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}