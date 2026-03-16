"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { BUILTIN_THEMES, applyTheme } from "../../../lib/themes";
import { loadSettings, loadCustomThemes } from "../../../lib/settings";

// ── Types ─────────────────────────────────────────────────────────────────────

type Color = "red" | "blue" | "green" | "yellow" | "purple" | "orange";
type GamePhase = "idle" | "playing" | "won";
type AnimPhase = "idle" | "shrink" | "grow";

// ── Constants ─────────────────────────────────────────────────────────────────

const COLORS: Color[] = ["red", "blue", "green", "yellow", "purple", "orange"];

const COLOR_STYLES: Record<Color, { bg: string; border: string; glow: string }> = {
  red:    { bg: "#ef4444", border: "#dc2626", glow: "rgba(239,68,68,0.5)"  },
  blue:   { bg: "#3b82f6", border: "#2563eb", glow: "rgba(59,130,246,0.5)" },
  green:  { bg: "#22c55e", border: "#16a34a", glow: "rgba(34,197,94,0.5)"  },
  yellow: { bg: "#eab308", border: "#ca8a04", glow: "rgba(234,179,8,0.5)"  },
  purple: { bg: "#a855f7", border: "#9333ea", glow: "rgba(168,85,247,0.5)" },
  orange: { bg: "#f97316", border: "#ea580c", glow: "rgba(249,115,22,0.5)" },
};

const DIFFICULTIES = {
  easy:   { balls: 4, label: "easy",   desc: "4 balls" },
  medium: { balls: 5, label: "medium", desc: "5 balls" },
  hard:   { balls: 6, label: "hard",   desc: "6 balls" },
} as const;

type Difficulty = keyof typeof DIFFICULTIES;

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePuzzle(n: number): { player: Color[]; hidden: Color[] } {
  const colors = shuffle(COLORS).slice(0, n) as Color[];
  const hidden = [...colors];
  let player: Color[];
  do { player = shuffle(colors) as Color[]; }
  while (player.every((c, i) => c === hidden[i]));
  return { player, hidden };
}

function countCorrect(player: Color[], hidden: Color[]): number {
  return player.filter((c, i) => c === hidden[i]).length;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

// ── Ball — purely presentational, no effects ──────────────────────────────────

interface BallProps {
  color:      Color;
  animPhase:  AnimPhase;
  selected:   boolean;
  won:        boolean;
  isCorrect:  boolean;
  onClick:    () => void;
}

function Ball({ color, animPhase, selected, won, isCorrect, onClick }: BallProps) {
  const cs         = COLOR_STYLES[color];
  const scaleX     = animPhase === "shrink" ? 0 : 1;
  const baseScale  = selected ? 1.18 : 1;
  const translateY = selected ? -4 : 0;

  return (
    <button
      onClick={onClick}
      disabled={won}
      className="relative w-12 h-12 rounded-full border-2 flex items-center justify-center focus:outline-none select-none"
      style={{
        background:  cs.bg,
        borderColor: selected ? "#fff" : (isCorrect && won) ? "#4ade80" : cs.border,
        boxShadow:   selected
          ? `0 0 0 3px rgba(255,255,255,0.3), 0 0 18px ${cs.glow}`
          : `0 0 8px ${cs.glow}`,
        transform:   `scaleX(${scaleX}) scale(${baseScale}) translateY(${translateY}px)`,
        transition:  animPhase === "shrink"
          ? "transform 0.16s ease-in"
          : animPhase === "grow"
            ? "transform 0.16s ease-out"
            : "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        cursor: won ? "default" : "pointer",
      }}
    >
      {selected && (
        <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping pointer-events-none" />
      )}
      {won && isCorrect && (
        <span className="text-[11px] font-bold text-white/70 pointer-events-none">✓</span>
      )}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChromatchPage() {
  const [difficulty,  setDifficulty]  = useState<Difficulty>("medium");
  const [phase,       setPhase]       = useState<GamePhase>("idle");
  // display* arrays are what the balls actually render — updated mid-animation
  const [display,     setDisplay]     = useState<Color[]>([]);
  const [animPhases,  setAnimPhases]  = useState<AnimPhase[]>([]);
  // player is the logical truth (post-swap); hidden is the target
  const [player,      setPlayer]      = useState<Color[]>([]);
  const [hidden,      setHidden]      = useState<Color[]>([]);
  const [correct,     setCorrect]     = useState(0);
  const [turns,       setTurns]       = useState(0);
  const [selected,    setSelected]    = useState<number | null>(null);
  const [history,     setHistory]     = useState<{ correct: number; turn: number }[]>([]);
  const [elapsed,     setElapsed]     = useState(0);
  const [revealed,    setRevealed]    = useState(false);
  const [animWin,     setAnimWin]     = useState(false);

  // Refs — avoid stale closures in the click handler
  const playerRef   = useRef<Color[]>([]);
  const hiddenRef   = useRef<Color[]>([]);
  const turnsRef    = useRef(0);
  const phaseRef    = useRef<GamePhase>("idle");
  const selectedRef = useRef<number | null>(null);
  const busyRef     = useRef(false);
  const startTime   = useRef<number>(0);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // Apply theme + unlock body scroll (globals.css sets overflow:hidden)
  useEffect(() => {
    const settings     = loadSettings();
    const customThemes = loadCustomThemes();
    const allThemes    = [...BUILTIN_THEMES, ...customThemes];
    const active       = allThemes.find(t => t.name === settings.themeName) ?? BUILTIN_THEMES[0];
    applyTheme(active.colors);
    document.body.style.overflow            = "auto";
    document.documentElement.style.overflow = "auto";
    return () => {
      document.body.style.overflow            = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  // Timer
  useEffect(() => {
    if (phase === "playing") {
      startTime.current = Date.now() - elapsed;
      timerRef.current  = setInterval(() => setElapsed(Date.now() - startTime.current), 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startGame = useCallback(() => {
    const n = DIFFICULTIES[difficulty].balls;
    const { player: p, hidden: h } = generatePuzzle(n);
    const c = countCorrect(p, h);

    playerRef.current   = p;
    hiddenRef.current   = h;
    turnsRef.current    = 0;
    phaseRef.current    = "playing";
    selectedRef.current = null;
    busyRef.current     = false;

    setPlayer([...p]);
    setHidden([...h]);
    setDisplay([...p]);
    setAnimPhases(p.map(() => "idle"));
    setCorrect(c);
    setTurns(0);
    setHistory([{ correct: c, turn: 0 }]);
    setSelected(null);
    setRevealed(false);
    setAnimWin(false);
    setElapsed(0);
    setPhase("playing");
  }, [difficulty]);

  const handleBallClick = useCallback((idx: number) => {
    if (phaseRef.current !== "playing") return;
    if (busyRef.current) return;

    const first = selectedRef.current;

    if (first === null) {
      selectedRef.current = idx;
      setSelected(idx);
      return;
    }

    if (first === idx) {
      selectedRef.current = null;
      setSelected(null);
      return;
    }

    // — Swap —
    const a = first, b = idx;
    selectedRef.current = null;
    busyRef.current     = true;
    setSelected(null);

    // 1) shrink both balls
    setAnimPhases(prev => {
      const next = [...prev];
      next[a] = "shrink";
      next[b] = "shrink";
      return next;
    });

    // 2) mid-flip: swap the displayed colors and start growing
    setTimeout(() => {
      const cur = playerRef.current;
      setDisplay(prev => {
        const next = [...prev];
        next[a] = cur[b];
        next[b] = cur[a];
        return next;
      });
      setAnimPhases(prev => {
        const next = [...prev];
        next[a] = "grow";
        next[b] = "grow";
        return next;
      });
    }, 160);

    // 3) animation done — commit logical state
    setTimeout(() => {
      const next = [...playerRef.current];
      [next[a], next[b]] = [next[b], next[a]];
      playerRef.current = next;

      const newTurns   = turnsRef.current + 1;
      const newCorrect = countCorrect(next, hiddenRef.current);
      turnsRef.current = newTurns;

      setPlayer([...next]);
      setAnimPhases(prev => {
        const n = [...prev];
        n[a] = "idle";
        n[b] = "idle";
        return n;
      });
      setTurns(newTurns);
      setCorrect(newCorrect);
      setHistory(prev => [...prev, { correct: newCorrect, turn: newTurns }]);
      busyRef.current = false;

      if (newCorrect === next.length) {
        phaseRef.current = "won";
        setPhase("won");
        setTimeout(() => setAnimWin(true), 50);
      }
    }, 360);
  }, []);

  return (
    <div className="min-h-screen bg-bg font-mono text-tx">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[13px] tracking-[0.15em] uppercase text-tx">chromatch</h1>
          <p className="text-[10px] text-muted mt-0.5">match the hidden sequence · swap 2 balls per turn</p>
        </div>
        <Link href="/games"
          className="text-[10px] text-muted border border-border2 px-2.5 py-1 hover:text-tx hover:border-muted transition-colors tracking-[0.06em]">
          ← games
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">

        {/* ── Idle ── */}
        {phase === "idle" && (
          <div className="space-y-6">
            <div className="border border-dashed border-border2 p-6">
              <p className="text-[11px] text-muted leading-relaxed">
                a hidden sequence of colored balls is waiting to be solved.<br />
                you can see your balls and how many are in the correct position.<br />
                each turn you swap exactly <span className="text-tx">2 balls</span>. solve it in as few turns as possible.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] text-muted tracking-[0.08em] uppercase">difficulty</span>
              <div className="flex gap-2">
                {(Object.keys(DIFFICULTIES) as Difficulty[]).map(d => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`flex flex-col items-start border px-4 py-2.5 font-mono transition-colors
                      ${difficulty === d
                        ? "border-green text-green bg-green/10"
                        : "border-border2 text-muted hover:text-tx hover:border-muted"}`}>
                    <span className="text-[11px] tracking-[0.06em]">{DIFFICULTIES[d].label}</span>
                    <span className={`text-[9px] ${difficulty === d ? "text-green/60" : "text-dim"}`}>{DIFFICULTIES[d].desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={startGame}
              className="w-full border border-green text-green text-[11px] tracking-widest py-3 hover:bg-green/10 transition-colors font-mono">
              start game
            </button>
          </div>
        )}

        {/* ── Playing / Won ── */}
        {(phase === "playing" || phase === "won") && (
          <div className="space-y-6">

            {/* Stats row */}
            <div className="flex items-center justify-between border border-border2 bg-surface px-4 py-2.5">
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <div className="text-[18px] tabular-nums text-tx">{turns}</div>
                  <div className="text-[9px] text-muted tracking-[0.08em] uppercase">turns</div>
                </div>
                <div className="w-px h-8 bg-border2" />
                <div className="text-center">
                  <div className="text-[18px] tabular-nums text-green">
                    {correct}<span className="text-[11px] text-muted">/{player.length}</span>
                  </div>
                  <div className="text-[9px] text-muted tracking-[0.08em] uppercase">correct</div>
                </div>
                <div className="w-px h-8 bg-border2" />
                <div className="text-center">
                  <div className="text-[18px] tabular-nums text-tx">{formatTime(elapsed)}</div>
                  <div className="text-[9px] text-muted tracking-[0.08em] uppercase">time</div>
                </div>
              </div>
              <button onClick={startGame}
                className="text-[9px] text-muted border border-border2 px-2.5 py-1 hover:text-tx hover:border-muted transition-colors tracking-[0.06em]">
                restart
              </button>
            </div>

            {/* Hidden row */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted tracking-[0.08em] uppercase">hidden sequence</span>
                {phase === "playing" && (
                  <button onClick={() => setRevealed(v => !v)}
                    className="text-[9px] text-muted hover:text-yellow-400 transition-colors border border-border2 hover:border-yellow-600 px-2 py-0.5 tracking-[0.06em]">
                    {revealed ? "hide" : "reveal (forfeits score)"}
                  </button>
                )}
              </div>
              <div className="flex gap-3 justify-center py-3">
                {hidden.map((color, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div
                      className="w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                      style={
                        (phase === "won" || revealed)
                          ? { background: COLOR_STYLES[color].bg, borderColor: COLOR_STYLES[color].border, boxShadow: `0 0 12px ${COLOR_STYLES[color].glow}` }
                          : { background: "var(--surface)", borderColor: "var(--border2)" }
                      }
                    >
                      {!(phase === "won" || revealed) && (
                        <span className="text-[16px] text-muted">?</span>
                      )}
                    </div>
                    <span className="text-[9px] text-dim">{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Correct count divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-border2" />
              <span className="text-[10px] text-muted tracking-widest">
                {correct === player.length
                  ? <span className="text-green">✓ all correct!</span>
                  : `${correct} of ${player.length} correct`}
              </span>
              <div className="flex-1 border-t border-border2" />
            </div>

            {/* Player row */}
            <div className="space-y-2">
              <span className="text-[9px] text-muted tracking-[0.08em] uppercase">
                {phase === "playing"
                  ? selected !== null ? "select second ball to swap" : "click a ball to select"
                  : "your sequence"}
              </span>
              <div className="flex gap-3 justify-center py-3">
                {display.map((color, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <Ball
                      color={color}
                      animPhase={animPhases[i] ?? "idle"}
                      selected={selected === i}
                      won={phase === "won"}
                      isCorrect={player[i] === hidden[i]}
                      onClick={() => handleBallClick(i)}
                    />
                    <span className="text-[9px] text-dim">{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Win screen */}
            {phase === "won" && (
              <div className={`border border-green bg-green/5 px-5 py-5 text-center space-y-3 transition-all duration-500 ${animWin ? "opacity-100" : "opacity-0"}`}>
                <div className="text-[11px] text-green tracking-[0.2em] uppercase">solved!</div>
                <div className="flex items-center justify-center gap-6">
                  <div>
                    <div className="text-[22px] text-tx tabular-nums">{turns}</div>
                    <div className="text-[9px] text-muted uppercase tracking-widest">turns</div>
                  </div>
                  <div className="w-px h-10 bg-border2" />
                  <div>
                    <div className="text-[22px] text-tx tabular-nums">{formatTime(elapsed)}</div>
                    <div className="text-[9px] text-muted uppercase tracking-widest">time</div>
                  </div>
                </div>
                <button onClick={startGame}
                  className="border border-green text-green text-[10px] tracking-widest px-6 py-1.5 hover:bg-green/10 transition-colors font-mono">
                  play again
                </button>
              </div>
            )}

            {/* Turn history */}
            {history.length > 1 && (
              <div className="space-y-2">
                <span className="text-[9px] text-muted tracking-[0.08em] uppercase">turn history</span>
                <div className="border border-border2 bg-surface">
                  <div className="flex border-b border-border2 px-3 py-1.5">
                    <span className="text-[9px] text-muted w-12">turn</span>
                    <span className="text-[9px] text-muted flex-1">progress</span>
                    <span className="text-[9px] text-muted w-16 text-right">correct</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto">
                    {history.map((h, i) => (
                      <div key={i} className={`flex items-center px-3 py-1.5 border-b border-border last:border-0 ${i === history.length - 1 ? "bg-green/5" : ""}`}>
                        <span className="text-[10px] text-muted w-12 tabular-nums">{h.turn}</span>
                        <div className="flex-1 flex gap-0.5">
                          {Array.from({ length: player.length }, (_, j) => (
                            <div key={j} className="h-2 flex-1 transition-colors"
                              style={{ background: j < h.correct ? "var(--green)" : "var(--border2)" }} />
                          ))}
                        </div>
                        <span className={`text-[10px] w-16 text-right tabular-nums ${h.correct === player.length ? "text-green" : "text-muted"}`}>
                          {h.correct}/{player.length}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Difficulty */}
            <div className="flex items-center gap-3 pb-8">
              <span className="text-[9px] text-muted tracking-[0.08em] uppercase whitespace-nowrap">difficulty</span>
              <div className="flex gap-1.5">
                {(Object.keys(DIFFICULTIES) as Difficulty[]).map(d => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`text-[9px] tracking-[0.06em] border px-2.5 py-1 font-mono transition-colors
                      ${difficulty === d
                        ? "border-green text-green bg-green/10"
                        : "border-border2 text-muted hover:text-tx hover:border-muted"}`}>
                    {DIFFICULTIES[d].label}
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-dim">(takes effect on next game)</span>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}