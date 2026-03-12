"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { BUILTIN_THEMES, applyTheme } from "../../../lib/themes";
import { loadSettings, loadCustomThemes } from "../../../lib/settings";

// ── Types ─────────────────────────────────────────────────────────────────────

type DiffKind = "equal" | "insert" | "delete";

interface DiffLine {
  kind:    DiffKind;
  text:    string;
  lineA?:  number;
  lineB?:  number;
}

type ViewMode = "split" | "unified";

// ── Diff algorithm (Myers LCS-based line diff) ────────────────────────────────

function diffLines(a: string[], b: string[]): DiffLine[] {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const result: DiffLine[] = [];
  let i = 0, j = 0, la = 1, lb = 1;

  while (i < m || j < n) {
    if (i < m && j < n && a[i] === b[j]) {
      result.push({ kind: "equal", text: a[i], lineA: la++, lineB: lb++ });
      i++; j++;
    } else if (j < n && (i >= m || dp[i + 1][j] >= dp[i][j + 1])) {
      result.push({ kind: "insert", text: b[j], lineB: lb++ });
      j++;
    } else {
      result.push({ kind: "delete", text: a[i], lineA: la++ });
      i++;
    }
  }

  return result;
}

// ── Inline char diff ──────────────────────────────────────────────────────────

function charDiff(a: string, b: string): { text: string; changed: boolean }[] {
  if (!a || !b) return [{ text: b || a, changed: false }];
  const ac = [...a], bc = [...b];
  const m = ac.length, n = bc.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = ac[i] === bc[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const segs: { text: string; changed: boolean }[] = [];
  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && ac[i] === bc[j]) {
      const last = segs[segs.length - 1];
      if (last && !last.changed) last.text += ac[i]; else segs.push({ text: ac[i], changed: false });
      i++; j++;
    } else if (j < n && (i >= m || dp[i + 1][j] >= dp[i][j + 1])) {
      const last = segs[segs.length - 1];
      if (last?.changed) last.text += bc[j]; else segs.push({ text: bc[j], changed: true });
      j++;
    } else {
      i++;
    }
  }
  return segs;
}

// ── Stat helpers ──────────────────────────────────────────────────────────────

function getStats(diff: DiffLine[]) {
  return {
    added:   diff.filter(d => d.kind === "insert").length,
    removed: diff.filter(d => d.kind === "delete").length,
    changed: diff.filter(d => d.kind !== "equal").length,
    total:   diff.length,
  };
}

// ── Render helpers ────────────────────────────────────────────────────────────

const KIND_BG: Record<DiffKind, string> = {
  equal:  "",
  insert: "bg-green/10 border-l-2 border-green",
  delete: "bg-red-500/10 border-l-2 border-red-500",
};

const KIND_TEXT: Record<DiffKind, string> = {
  equal:  "text-muted",
  insert: "text-green",
  delete: "text-red-400",
};

const KIND_GUTTER: Record<DiffKind, string> = {
  equal:  "text-dim",
  insert: "text-green/60",
  delete: "text-red-500/60",
};

const KIND_SYMBOL: Record<DiffKind, string> = {
  equal:  " ",
  insert: "+",
  delete: "−",
};

// ── Components ────────────────────────────────────────────────────────────────

function LineNum({ n, kind }: { n?: number; kind: DiffKind }) {
  return (
    <span className={`select-none text-right text-[10px] tabular-nums w-8 shrink-0 px-1 ${KIND_GUTTER[kind]}`}>
      {n ?? ""}
    </span>
  );
}

function InlineLine({ line, paired }: { line: DiffLine; paired?: DiffLine }) {
  const showInline = line.kind !== "equal" && paired && paired.kind !== "equal";
  let content: React.ReactNode;

  if (showInline && line.kind === "delete" && paired?.kind === "insert") {
    const segs = charDiff(line.text, paired.text);
    content = segs.map((s, i) =>
      s.changed
        ? <mark key={i} className="bg-red-500/40 text-red-200 rounded-none">{line.text.slice(
            segs.slice(0, i).filter(x => !x.changed).reduce((a, x) => a + x.text.length, 0),
            segs.slice(0, i).filter(x => !x.changed).reduce((a, x) => a + x.text.length, 0) + (
              // reconstruct original chars at this pos — just highlight the whole changed span
              1
            )
          )}</mark>
        : <span key={i}>{s.text}</span>
    );
    // Simpler: just render line.text but highlight changed chars
    content = <span>{line.text} asdfasdfjasldfj;asldk</span>;
  }

  return (
    <div className={`flex items-start min-h-6 font-mono text-[11px] leading-6 ${KIND_BG[line.kind]}`}>
      <LineNum n={line.lineA} kind={line.kind} />
      <span className={`select-none text-[10px] w-4 shrink-0 text-center ${KIND_TEXT[line.kind]}`}>
        {KIND_SYMBOL[line.kind]}
      </span>
      <span className={`flex-1 px-2 whitespace-pre-wrap break-all ${KIND_TEXT[line.kind]}`}>
        {line.text || " "}
      </span>
    </div>
  );
}

function SplitRow({ del, ins }: { del?: DiffLine; ins?: DiffLine }) {
  const cellCls = "flex-1 min-w-0 flex items-start min-h-[1.5rem] font-mono text-[11px] leading-6";

  const renderCell = (line: DiffLine | undefined, side: "left" | "right") => {
    const isEmpty = !line;
    const kind: DiffKind = line?.kind ?? "equal";
    const lineNum = side === "left" ? line?.lineA : line?.lineB;
    return (
      <div className={`${cellCls} ${isEmpty ? "bg-surface" : KIND_BG[kind]}`}>
        <LineNum n={lineNum} kind={kind} />
        <span className={`flex-1 px-2 whitespace-pre-wrap break-all ${KIND_TEXT[kind]}`}>
          {line?.text ?? ""}
        </span>
      </div>
    );
  };

  return (
    <div className="flex gap-px bg-border">
      {renderCell(del, "left")}
      {renderCell(ins, "right")}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DiffViewerPage() {
  const [textA, setTextA] = useState("The quick brown fox\njumps over the lazy dog\nThis line is unchanged\nHello world\nFoo bar baz");
  const [textB, setTextB] = useState("The quick brown fox\nleaps over the lazy cat\nThis line is unchanged\nHello, world!\nFoo bar");
  const [viewMode, setViewMode] = useState<ViewMode>("unified");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [contextLines, setContextLines] = useState(3);
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const settings     = loadSettings();
    const customThemes = loadCustomThemes();
    const allThemes    = [...BUILTIN_THEMES, ...customThemes];
    const active       = allThemes.find(t => t.name === settings.themeName) ?? BUILTIN_THEMES[0];
    applyTheme(active.colors);
  }, []);

  const normalize = (s: string) => {
    let r = s;
    if (ignoreCase) r = r.toLowerCase();
    if (ignoreWhitespace) r = r.replace(/\s+/g, " ").trim();
    return r;
  };

  const diff = useMemo(() => {
    const a = textA.split("\n");
    const b = textB.split("\n");
    const na = a.map(normalize);
    const nb = b.map(normalize);
    const rawDiff = diffLines(na, nb);
    // Re-attach original text
    let ai = 0, bi = 0;
    return rawDiff.map(line => {
      if (line.kind === "delete" || line.kind === "equal") {
        const orig = a[ai++] ?? line.text;
        return { ...line, text: orig };
      } else {
        const orig = b[bi++] ?? line.text;
        return { ...line, text: orig };
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textA, textB, ignoreCase, ignoreWhitespace]);

  const stats = useMemo(() => getStats(diff), [diff]);

  // For unified view with context collapsing
  const visibleDiff = useMemo(() => {
    if (!showOnlyDiffs) return diff;
    const changed = new Set<number>();
    diff.forEach((d, i) => { if (d.kind !== "equal") changed.add(i); });
    return diff.filter((_, i) => {
      for (let c = -contextLines; c <= contextLines; c++) {
        if (changed.has(i + c)) return true;
      }
      return false;
    });
  }, [diff, showOnlyDiffs, contextLines]);

  // For split view: pair up deletes and inserts
  const splitRows = useMemo(() => {
    const rows: { del?: DiffLine; ins?: DiffLine }[] = [];
    let i = 0;
    while (i < diff.length) {
      const d = diff[i];
      if (d.kind === "equal") { rows.push({ del: d, ins: { ...d } }); i++; }
      else if (d.kind === "delete") {
        const next = diff[i + 1];
        if (next?.kind === "insert") { rows.push({ del: d, ins: next }); i += 2; }
        else { rows.push({ del: d }); i++; }
      } else {
        rows.push({ ins: d }); i++;
      }
    }
    return rows;
  }, [diff]);

  const copyPatch = () => {
    const patch = diff.map(d => `${KIND_SYMBOL[d.kind]} ${d.text}`).join("\n");
    navigator.clipboard.writeText(patch);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-bg font-mono text-tx">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[13px] tracking-[0.15em] uppercase text-tx">diff viewer</h1>
          <p className="text-[10px] text-muted mt-0.5">line-by-line text comparison · client-side · no tracking</p>
        </div>
        <Link href="/tools"
          className="text-[10px] text-muted border border-border2 px-2.5 py-1 hover:text-tx hover:border-muted transition-colors tracking-[0.06em]">
          ← tools
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">

        {/* Input panels */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "original (A)", value: textA, set: setTextA },
            { label: "modified (B)", value: textB, set: setTextB },
          ].map(({ label, value, set }) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted tracking-[0.08em] uppercase">{label}</span>
                <span className="text-[9px] text-dim">{value.split("\n").length} lines</span>
              </div>
              <textarea
                value={value}
                onChange={e => set(e.target.value)}
                rows={8}
                spellCheck={false}
                className="w-full bg-bg border border-border2 px-3 py-2.5 text-[11px] text-tx font-mono outline-none focus:border-green transition-colors resize-y leading-relaxed"
              />
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-border2 bg-surface px-4 py-3">
          {/* View mode */}
          <div className="flex items-center gap-1">
            {(["unified", "split"] as ViewMode[]).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`text-[9px] tracking-[0.06em] border px-2 py-1 font-mono transition-colors
                  ${viewMode === m ? "border-green text-green bg-green/10" : "border-border2 text-muted hover:text-tx hover:border-muted"}`}>
                {m}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-border2" />

          {/* Toggles */}
          {[
            { label: "ignore case", val: ignoreCase, set: setIgnoreCase },
            { label: "ignore whitespace", val: ignoreWhitespace, set: setIgnoreWhitespace },
            { label: "only diffs", val: showOnlyDiffs, set: setShowOnlyDiffs },
          ].map(({ label, val, set }) => (
            <button key={label} onClick={() => set(!val)}
              className={`text-[9px] tracking-[0.06em] border px-2 py-1 font-mono transition-colors
                ${val ? "border-green text-green bg-green/10" : "border-border2 text-muted hover:text-tx hover:border-muted"}`}>
              {val ? "✓ " : ""}{label}
            </button>
          ))}

          {showOnlyDiffs && (
            <>
              <div className="w-px h-4 bg-border2" />
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-muted">context</span>
                <div className="flex items-center border border-border2">
                  <button onClick={() => setContextLines(c => Math.max(0, c - 1))}
                    className="px-1.5 py-0.5 text-muted hover:text-green text-[11px]">−</button>
                  <span className="px-2 text-[10px] text-tx tabular-nums w-6 text-center">{contextLines}</span>
                  <button onClick={() => setContextLines(c => Math.min(10, c + 1))}
                    className="px-1.5 py-0.5 text-muted hover:text-green text-[11px]">+</button>
                </div>
              </div>
            </>
          )}

          <button onClick={copyPatch}
            className="ml-auto text-[9px] tracking-[0.06em] border border-border2 text-muted hover:text-green hover:border-green px-2.5 py-1 font-mono transition-colors">
            {copied ? "✓ copied" : "copy patch"}
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-muted">{stats.total} lines</span>
          <span className="text-green">+{stats.added} added</span>
          <span className="text-red-400">−{stats.removed} removed</span>
          <span className="text-muted">{stats.total - stats.changed} unchanged</span>
          {stats.changed === 0 && (
            <span className="text-green border border-green px-2 py-0.5 text-[9px] tracking-widest">identical</span>
          )}
        </div>

        {/* Diff output */}
        <div className="border border-border2 overflow-hidden">
          {/* Column headers for split */}
          {viewMode === "split" && (
            <div className="flex gap-px bg-border border-b border-border2">
              <div className="flex-1 px-3 py-1.5 text-[9px] text-muted tracking-[0.08em] bg-surface">original (A)</div>
              <div className="flex-1 px-3 py-1.5 text-[9px] text-muted tracking-[0.08em] bg-surface">modified (B)</div>
            </div>
          )}

          <div className="overflow-auto max-h-[60vh] bg-bg">
            {viewMode === "unified" ? (
              <div>
                {visibleDiff.length === 0 && (
                  <div className="text-[10px] text-muted text-center py-8">no differences found</div>
                )}
                {visibleDiff.map((line, i) => (
                  <InlineLine key={i} line={line} />
                ))}
              </div>
            ) : (
              <div>
                {splitRows.filter(r => !showOnlyDiffs || r.del?.kind !== "equal" || r.ins?.kind !== "equal").map((row, i) => (
                  <SplitRow key={i} del={row.del} ins={row.ins} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[9px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-green/10 border-l-2 border-green inline-block" />
            added
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-red-500/10 border-l-2 border-red-500 inline-block" />
            removed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-bg border border-border2 inline-block" />
            unchanged
          </span>
        </div>
      </div>
    </div>
  );
}