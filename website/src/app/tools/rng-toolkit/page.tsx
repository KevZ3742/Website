"use client";

import { useEffect, useState, useRef, useCallback, JSX } from "react";
import Link from "next/link";
import { BUILTIN_THEMES, applyTheme } from "../../../lib/themes";
import { loadSettings, loadCustomThemes } from "../../../lib/settings";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "number" | "dice" | "coin" | "cards" | "wheel" | "groups";

// ── Helpers ───────────────────────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Number Generator ──────────────────────────────────────────────────────────

function NumberGen() {
  const [min, setMin]         = useState("1");
  const [max, setMax]         = useState("100");
  const [count, setCount]     = useState("1");
  const [unique, setUnique]   = useState(false);
  const [results, setResults] = useState<number[]>([]);
  const [error, setError]     = useState("");

  const generate = () => {
    const lo = parseInt(min), hi = parseInt(max), n = parseInt(count);
    if (isNaN(lo) || isNaN(hi) || isNaN(n)) { setError("invalid input"); return; }
    if (lo > hi) { setError("min must be ≤ max"); return; }
    if (n < 1 || n > 100) { setError("count must be 1–100"); return; }
    if (unique && n > hi - lo + 1) { setError("not enough unique values in range"); return; }
    setError("");
    if (unique) {
      const pool = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
      const picked: number[] = [];
      for (let i = 0; i < n; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        picked.push(pool.splice(idx, 1)[0]);
      }
      setResults(picked);
    } else {
      setResults(Array.from({ length: n }, () => rand(lo, hi)));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <label className="space-y-1">
          <span className="text-[9px] text-muted tracking-[0.08em] uppercase">min</span>
          <input value={min} onChange={e => setMin(e.target.value)}
            className="w-full bg-bg border border-border2 px-2 py-1.5 text-[12px] text-tx font-mono outline-none focus:border-green transition-colors" />
        </label>
        <label className="space-y-1">
          <span className="text-[9px] text-muted tracking-[0.08em] uppercase">max</span>
          <input value={max} onChange={e => setMax(e.target.value)}
            className="w-full bg-bg border border-border2 px-2 py-1.5 text-[12px] text-tx font-mono outline-none focus:border-green transition-colors" />
        </label>
        <label className="space-y-1">
          <span className="text-[9px] text-muted tracking-[0.08em] uppercase">count</span>
          <input value={count} onChange={e => setCount(e.target.value)}
            className="w-full bg-bg border border-border2 px-2 py-1.5 text-[12px] text-tx font-mono outline-none focus:border-green transition-colors" />
        </label>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <div onClick={() => setUnique(v => !v)}
          className={`w-8 h-4 border transition-colors relative ${unique ? "border-green bg-green/20" : "border-border2"}`}>
          <div className="absolute top-0.5 w-3 h-3 transition-all"
            style={{ left: unique ? "18px" : "2px", background: unique ? "var(--green)" : "var(--muted)" }} />
        </div>
        <span className="text-[10px] text-muted">unique values only</span>
      </label>

      {error && <p className="text-[10px] text-red-400">{error}</p>}

      <button onClick={generate}
        className="w-full border border-green text-green text-[11px] tracking-widest py-2 hover:bg-green/10 transition-colors font-mono">
        generate
      </button>

      {results.length > 0 && (
        <div className="border border-border bg-bg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-muted tracking-[0.08em] uppercase">results</span>
            <button onClick={() => navigator.clipboard.writeText(results.join(", "))}
              className="text-[9px] text-muted hover:text-green transition-colors">copy</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {results.map((n, i) => (
              <span key={i} className="text-[13px] text-tx font-mono border border-border2 px-2 py-0.5 tabular-nums">{n}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dice Roller ───────────────────────────────────────────────────────────────

type DieType = 4 | 6 | 8 | 10 | 12 | 20 | 100;

interface DiceRoll {
  id:    string;
  die:   DieType;
  count: number;
  rolls: number[];
  mod:   number;
}

function DieIcon({ sides, size = 28 }: { sides: DieType; size?: number }) {
  const s = size;
  const shapes: Record<DieType, JSX.Element> = {
    4:   <polygon points={`${s/2},2 ${s-2},${s-2} 2,${s-2}`} fill="none" stroke="currentColor" strokeWidth="1.5" />,
    6:   <rect x="2" y="2" width={s-4} height={s-4} fill="none" stroke="currentColor" strokeWidth="1.5" />,
    8:   <polygon points={`${s/2},2 ${s-2},${s/2} ${s/2},${s-2} 2,${s/2}`} fill="none" stroke="currentColor" strokeWidth="1.5" />,
    10:  <polygon points={`${s/2},2 ${s-3},${s*0.38} ${s-3},${s*0.72} ${s/2},${s-2} 3,${s*0.72} 3,${s*0.38}`} fill="none" stroke="currentColor" strokeWidth="1.5" />,
    12:  <polygon points={`${s/2},2 ${s-4},${s*0.3} ${s-2},${s*0.7} ${s*0.7},${s-2} ${s*0.3},${s-2} 2,${s*0.7} 4,${s*0.3}`} fill="none" stroke="currentColor" strokeWidth="1.5" />,
    20:  <polygon points={`${s/2},2 ${s-2},${s*0.4} ${s-4},${s-2} 4,${s-2} 2,${s*0.4}`} fill="none" stroke="currentColor" strokeWidth="1.5" />,
    100: <><rect x="2" y="2" width={s-4} height={s-4} fill="none" stroke="currentColor" strokeWidth="1.5" rx="2" /><text x={s/2} y={s/2+4} textAnchor="middle" fontSize="8" fill="currentColor" fontFamily="monospace">%</text></>,
  };
  return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>{shapes[sides]}</svg>;
}

function DiceRoller() {
  const [selectedDie, setSelectedDie] = useState<DieType>(20);
  const [count, setCount]             = useState(1);
  const [mod, setMod]                 = useState(0);
  const [history, setHistory]         = useState<DiceRoll[]>([]);
  const [rolling, setRolling]         = useState(false);

  const DICE: DieType[] = [4, 6, 8, 10, 12, 20, 100];

  const roll = () => {
    setRolling(true);
    setTimeout(() => {
      const rolls = Array.from({ length: count }, () => rand(1, selectedDie));
      setHistory(h => [{ id: uid(), die: selectedDie, count, rolls, mod }, ...h.slice(0, 9)]);
      setRolling(false);
    }, 300);
  };

  const total = (r: DiceRoll) => r.rolls.reduce((a, b) => a + b, 0) + r.mod;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <span className="text-[9px] text-muted tracking-[0.08em] uppercase">die type</span>
        <div className="flex gap-1.5 flex-wrap">
          {DICE.map(d => (
            <button key={d} onClick={() => setSelectedDie(d)}
              className={`flex flex-col items-center gap-0.5 border px-2 py-1.5 transition-colors font-mono
                ${selectedDie === d ? "border-green text-green bg-green/10" : "border-border2 text-muted hover:text-tx hover:border-muted"}`}>
              <DieIcon sides={d} size={22} />
              <span className="text-[8px] tracking-wide">d{d}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-[9px] text-muted tracking-[0.08em] uppercase">number of dice</span>
          <div className="flex items-center border border-border2">
            <button onClick={() => setCount(c => Math.max(1, c - 1))}
              className="px-2 py-1.5 text-muted hover:text-green transition-colors text-[14px]">−</button>
            <span className="flex-1 text-center text-[13px] text-tx font-mono tabular-nums">{count}</span>
            <button onClick={() => setCount(c => Math.min(20, c + 1))}
              className="px-2 py-1.5 text-muted hover:text-green transition-colors text-[14px]">+</button>
          </div>
        </label>
        <label className="space-y-1">
          <span className="text-[9px] text-muted tracking-[0.08em] uppercase">modifier</span>
          <div className="flex items-center border border-border2">
            <button onClick={() => setMod(m => m - 1)}
              className="px-2 py-1.5 text-muted hover:text-green transition-colors text-[14px]">−</button>
            <span className="flex-1 text-center text-[13px] text-tx font-mono tabular-nums">
              {mod >= 0 ? `+${mod}` : mod}
            </span>
            <button onClick={() => setMod(m => m + 1)}
              className="px-2 py-1.5 text-muted hover:text-green transition-colors text-[14px]">+</button>
          </div>
        </label>
      </div>

      <button onClick={roll} disabled={rolling}
        className={`w-full border text-[11px] tracking-widest py-2 transition-colors font-mono
          ${rolling ? "border-border2 text-muted cursor-not-allowed" : "border-green text-green hover:bg-green/10"}`}>
        {rolling ? "rolling..." : `roll ${count}d${selectedDie}${mod !== 0 ? (mod > 0 ? `+${mod}` : mod) : ""}`}
      </button>

      {history.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[9px] text-muted tracking-[0.08em] uppercase">roll history</span>
          {history.map((r, i) => (
            <div key={r.id} className={`flex items-center justify-between border px-3 py-2 transition-colors
              ${i === 0 ? "border-green bg-green/5" : "border-border bg-surface"}`}>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted font-mono">{r.count}d{r.die}{r.mod !== 0 ? (r.mod > 0 ? `+${r.mod}` : r.mod) : ""}</span>
                <span className="text-[9px] text-dim">[{r.rolls.join(", ")}]</span>
              </div>
              <span className={`text-[15px] font-mono tabular-nums ${i === 0 ? "text-green" : "text-tx"}`}>
                {total(r)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Coin Flip ─────────────────────────────────────────────────────────────────

function CoinFlip() {
  const [result, setResult]     = useState<"heads" | "tails" | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [history, setHistory]   = useState<("heads" | "tails")[]>([]);

  const flip = () => {
    setFlipping(true);
    setResult(null);
    setTimeout(() => {
      const r = Math.random() < 0.5 ? "heads" : "tails";
      setResult(r);
      setHistory(h => [r, ...h.slice(0, 19)]);
      setFlipping(false);
    }, 500);
  };

  const heads = history.filter(r => r === "heads").length;
  const tails = history.filter(r => r === "tails").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 py-4">
        <div className={`w-24 h-24 border-2 rounded-full flex items-center justify-center transition-all duration-500 select-none
          ${flipping ? "border-muted animate-spin" : result === "heads" ? "border-green bg-green/10" : result === "tails" ? "border-muted bg-surface" : "border-border2 bg-surface"}`}
          style={{ animationDuration: "0.4s" }}>
          {flipping ? (
            <span className="text-[10px] text-muted tracking-widest">···</span>
          ) : result ? (
            <div className="text-center">
              <div className="text-[11px] tracking-[0.15em] uppercase"
                style={{ color: result === "heads" ? "var(--green)" : "var(--muted)" }}>
                {result === "heads" ? "H" : "T"}
              </div>
            </div>
          ) : (
            <span className="text-[10px] text-dim tracking-wider">flip</span>
          )}
        </div>
        {result && !flipping && (
          <span className={`text-[13px] tracking-[0.15em] uppercase font-mono ${result === "heads" ? "text-green" : "text-muted"}`}>
            {result}
          </span>
        )}
      </div>

      <button onClick={flip} disabled={flipping}
        className={`w-full border text-[11px] tracking-widest py-2 transition-colors font-mono
          ${flipping ? "border-border2 text-muted cursor-not-allowed" : "border-green text-green hover:bg-green/10"}`}>
        {flipping ? "flipping..." : "flip coin"}
      </button>

      {history.length > 0 && (
        <div className="border border-border bg-surface p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted tracking-[0.08em] uppercase">stats · {history.length} flips</span>
            <span className="text-[9px] text-muted">{heads}H / {tails}T</span>
          </div>
          <div className="flex h-1.5 gap-px">
            {history.map((r, i) => (
              <div key={i} className="flex-1"
                style={{ background: r === "heads" ? "var(--green)" : "var(--muted)" }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-1 max-h-16 overflow-hidden">
            {history.map((r, i) => (
              <span key={i} className={`text-[9px] font-mono ${r === "heads" ? "text-green" : "text-muted"}`}>
                {r === "heads" ? "H" : "T"}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card Draw ─────────────────────────────────────────────────────────────────

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
type Suit = typeof SUITS[number];
type Rank = typeof RANKS[number];

interface Card { suit: Suit; rank: Rank; }

function makeDeck(): Card[] {
  return SUITS.flatMap(suit => RANKS.map(rank => ({ suit, rank })));
}

function CardFace({ card, small = false }: { card: Card; small?: boolean }) {
  const red = card.suit === "♥" || card.suit === "♦";
  return (
    <div className={`border bg-surface flex flex-col justify-between font-mono select-none
      ${small ? "w-9 h-14 p-1" : "w-14 h-20 p-1.5"}
      ${red ? "border-red-800 text-red-400" : "border-border2 text-muted"}`}>
      <span className={small ? "text-[9px]" : "text-[11px]"}>{card.rank}</span>
      <span className={`self-center ${small ? "text-[14px]" : "text-[18px]"}`}>{card.suit}</span>
      <span className={`self-end rotate-180 ${small ? "text-[9px]" : "text-[11px]"}`}>{card.rank}</span>
    </div>
  );
}

function CardDraw() {
  const [deck, setDeck]           = useState<Card[]>(() => makeDeck());
  const [drawn, setDrawn]         = useState<Card[]>([]);
  const [drawCount, setDrawCount] = useState(1);

  const draw = () => {
    if (deck.length === 0) return;
    const n = Math.min(drawCount, deck.length);
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDrawn(d => [...shuffled.slice(0, n), ...d]);
    setDeck(shuffled.slice(n));
  };

  const reset = () => { setDeck(makeDeck()); setDrawn([]); };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-border2 flex-1">
          <button onClick={() => setDrawCount(c => Math.max(1, c - 1))}
            className="px-2.5 py-1.5 text-muted hover:text-green transition-colors">−</button>
          <span className="flex-1 text-center text-[12px] text-tx font-mono">draw {drawCount}</span>
          <button onClick={() => setDrawCount(c => Math.min(10, c + 1))}
            className="px-2.5 py-1.5 text-muted hover:text-green transition-colors">+</button>
        </div>
        <span className="text-[10px] text-muted font-mono whitespace-nowrap">{deck.length} left</span>
      </div>

      <div className="flex gap-2">
        <button onClick={draw} disabled={deck.length === 0}
          className={`flex-1 border text-[11px] tracking-widest py-2 transition-colors font-mono
            ${deck.length === 0 ? "border-border2 text-dim cursor-not-allowed" : "border-green text-green hover:bg-green/10"}`}>
          {deck.length === 0 ? "deck empty" : "draw card"}
        </button>
        <button onClick={reset}
          className="border border-border2 text-muted text-[11px] px-3 py-2 hover:text-tx hover:border-muted transition-colors font-mono">
          reset
        </button>
      </div>

      {drawn.length > 0 && (
        <div className="space-y-2">
          <span className="text-[9px] text-muted tracking-[0.08em] uppercase">drawn · {drawn.length} cards</span>
          <div className="flex gap-2 flex-wrap">
            {drawn.slice(0, drawCount).map((c, i) => (
              <CardFace key={`${c.rank}-${c.suit}-${i}`} card={c} />
            ))}
          </div>
          {drawn.length > drawCount && (
            <div className="flex gap-1.5 flex-wrap pt-1 border-t border-border">
              {drawn.slice(drawCount).map((c, i) => (
                <CardFace key={`${c.rank}-${c.suit}-rest-${i}`} card={c} small />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Spin Wheel ────────────────────────────────────────────────────────────────

// Module-level constant — stable reference, no re-renders, no useMemo needed
const WHEEL_COLORS = ["#4ade80", "#60a5fa", "#f87171", "#facc15", "#e879f9", "#34d399", "#fb923c", "#a78bfa"] as const;

function SpinWheel() {
  const canvasRef               = useRef<HTMLCanvasElement>(null);
  const [items, setItems]       = useState(["Option A", "Option B", "Option C", "Option D"]);
  const [newItem, setNewItem]   = useState("");
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner]     = useState<string | null>(null);
  const angleRef                = useRef(0);
  const rafRef                  = useRef<number>(0);

  const drawWheel = useCallback((angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;
    const ctx = canvas.getContext("2d")!;
    const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 4;
    const slice = (2 * Math.PI) / items.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    items.forEach((item, i) => {
      const start = angle + i * slice, end = start + slice;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length] + "20";
      ctx.fill();
      ctx.strokeStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + slice / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.font = `${Math.min(11, 120 / items.length)}px 'JetBrains Mono', monospace`;
      const maxLen = 14;
      ctx.fillText(item.length > maxLen ? item.slice(0, maxLen) + "…" : item, r - 8, 4);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = "var(--bg)";
    ctx.fill();
    ctx.strokeStyle = "var(--green)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [items]); // WHEEL_COLORS is now stable (module-level constant)

  useEffect(() => { drawWheel(angleRef.current); }, [drawWheel]);

  const spin = () => {
    if (spinning || items.length < 2) return;
    setSpinning(true);
    setWinner(null);
    const totalRotation = Math.PI * 2 * (8 + Math.random() * 8);
    const duration = 4000;
    const start = performance.now();
    const startAngle = angleRef.current;

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      const current = startAngle + totalRotation * ease;
      angleRef.current = current;
      drawWheel(current);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        angleRef.current = current % (Math.PI * 2);
        const slice = (2 * Math.PI) / items.length;
        const norm = ((-angleRef.current) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const idx = Math.floor(norm / slice) % items.length;
        setWinner(items[idx]);
        setSpinning(false);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const addItem = () => {
    const t = newItem.trim();
    if (t && !items.includes(t)) { setItems(i => [...i, t]); setNewItem(""); }
  };

  const removeItem = (idx: number) => setItems(i => i.filter((_, j) => j !== idx));

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative shrink-0">
          <canvas ref={canvasRef} width={200} height={200} className="border border-border" />
          <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0"
            style={{ borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderRight: "10px solid var(--green)" }} />
        </div>

        <div className="flex-1 space-y-1.5 min-w-0">
          <span className="text-[9px] text-muted tracking-[0.08em] uppercase">items</span>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 group">
                <div className="w-2 h-2 shrink-0 border"
                  style={{ borderColor: WHEEL_COLORS[i % WHEEL_COLORS.length], background: WHEEL_COLORS[i % WHEEL_COLORS.length] + "30" }} />
                <span className="flex-1 text-[10px] text-muted font-mono truncate">{item}</span>
                <button onClick={() => removeItem(i)}
                  className="text-[10px] text-muted opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all">×</button>
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            <input value={newItem} onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addItem()}
              placeholder="add item..."
              className="flex-1 bg-bg border border-border2 px-2 py-1 text-[10px] text-tx font-mono outline-none focus:border-green transition-colors" />
            <button onClick={addItem}
              className="border border-border2 px-2 py-1 text-[10px] text-muted hover:text-green hover:border-green transition-colors font-mono">+</button>
          </div>
        </div>
      </div>

      <button onClick={spin} disabled={spinning || items.length < 2}
        className={`w-full border text-[11px] tracking-widest py-2 transition-colors font-mono
          ${spinning || items.length < 2 ? "border-border2 text-dim cursor-not-allowed" : "border-green text-green hover:bg-green/10"}`}>
        {spinning ? "spinning..." : "spin"}
      </button>

      {winner && !spinning && (
        <div className="border border-green bg-green/5 px-4 py-3 text-center">
          <span className="text-[9px] text-muted tracking-widest uppercase block mb-1">result</span>
          <span className="text-[15px] text-green font-mono">{winner}</span>
        </div>
      )}
    </div>
  );
}

// ── Group Generator ───────────────────────────────────────────────────────────

const GROUP_COLORS = ["text-green", "text-blue-400", "text-yellow-400", "text-red-400", "text-purple-400", "text-orange-400"];

function GroupGen() {
  const [input, setInput]           = useState("Alice\nBob\nCarol\nDave\nEve\nFrank");
  const [groupCount, setGroupCount] = useState(2);
  const [bySize, setBySize]         = useState(false);
  const [groupSize, setGroupSize]   = useState(3);
  const [groups, setGroups]         = useState<string[][]>([]);

  const generate = () => {
    const people = input.split("\n").map(s => s.trim()).filter(Boolean);
    if (people.length === 0) return;
    const shuffled = [...people].sort(() => Math.random() - 0.5);
    const result: string[][] = [];
    if (bySize) {
      for (let i = 0; i < shuffled.length; i += groupSize) {
        result.push(shuffled.slice(i, i + groupSize));
      }
    } else {
      const n = Math.max(2, Math.min(groupCount, people.length));
      for (let i = 0; i < n; i++) result.push([]);
      shuffled.forEach((p, i) => result[i % n].push(p));
    }
    setGroups(result);
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="text-[9px] text-muted tracking-[0.08em] uppercase block mb-1">participants (one per line)</span>
        <textarea value={input} onChange={e => setInput(e.target.value)} rows={5}
          className="w-full bg-bg border border-border2 px-2 py-1.5 text-[11px] text-tx font-mono outline-none focus:border-green transition-colors resize-none" />
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div onClick={() => setBySize(false)}
            className={`w-8 h-4 border transition-colors relative ${!bySize ? "border-green bg-green/20" : "border-border2"}`}>
            <div className="absolute top-0.5 w-3 h-3 transition-all"
              style={{ left: !bySize ? "18px" : "2px", background: !bySize ? "var(--green)" : "var(--muted)" }} />
          </div>
          <span className="text-[10px] text-muted">by count</span>
        </label>
        <span className="text-[10px] text-dim">|</span>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div onClick={() => setBySize(true)}
            className={`w-8 h-4 border transition-colors relative ${bySize ? "border-green bg-green/20" : "border-border2"}`}>
            <div className="absolute top-0.5 w-3 h-3 transition-all"
              style={{ left: bySize ? "18px" : "2px", background: bySize ? "var(--green)" : "var(--muted)" }} />
          </div>
          <span className="text-[10px] text-muted">by size</span>
        </label>
      </div>

      {!bySize ? (
        <label className="space-y-1">
          <span className="text-[9px] text-muted tracking-[0.08em] uppercase">number of groups</span>
          <div className="flex items-center border border-border2 w-32">
            <button onClick={() => setGroupCount(c => Math.max(2, c - 1))}
              className="px-2.5 py-1.5 text-muted hover:text-green transition-colors">−</button>
            <span className="flex-1 text-center text-[12px] text-tx font-mono tabular-nums">{groupCount}</span>
            <button onClick={() => setGroupCount(c => Math.min(10, c + 1))}
              className="px-2.5 py-1.5 text-muted hover:text-green transition-colors">+</button>
          </div>
        </label>
      ) : (
        <label className="space-y-1">
          <span className="text-[9px] text-muted tracking-[0.08em] uppercase">group size</span>
          <div className="flex items-center border border-border2 w-32">
            <button onClick={() => setGroupSize(s => Math.max(2, s - 1))}
              className="px-2.5 py-1.5 text-muted hover:text-green transition-colors">−</button>
            <span className="flex-1 text-center text-[12px] text-tx font-mono tabular-nums">{groupSize}</span>
            <button onClick={() => setGroupSize(s => Math.min(20, s + 1))}
              className="px-2.5 py-1.5 text-muted hover:text-green transition-colors">+</button>
          </div>
        </label>
      )}

      <button onClick={generate}
        className="w-full border border-green text-green text-[11px] tracking-widest py-2 hover:bg-green/10 transition-colors font-mono">
        shuffle &amp; group
      </button>

      {groups.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {groups.map((g, i) => (
            <div key={i} className="border border-border bg-surface p-2.5">
              <span className={`text-[9px] tracking-widest uppercase font-mono ${GROUP_COLORS[i % GROUP_COLORS.length]}`}>
                group {i + 1} · {g.length}
              </span>
              <ul className="mt-1.5 space-y-0.5">
                {g.map((p, j) => (
                  <li key={j} className="text-[10px] text-muted font-mono truncate">{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; desc: string }[] = [
  { id: "number", label: "number", desc: "random integers" },
  { id: "dice",   label: "dice",   desc: "rpg dice roller"  },
  { id: "coin",   label: "coin",   desc: "heads or tails"   },
  { id: "cards",  label: "cards",  desc: "draw from deck"   },
  { id: "wheel",  label: "wheel",  desc: "spin to pick"     },
  { id: "groups", label: "groups", desc: "split into teams" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RNGToolkitPage() {
  const [activeTab, setActiveTab] = useState<Tab>("number");

  useEffect(() => {
    const settings     = loadSettings();
    const customThemes = loadCustomThemes();
    const allThemes    = [...BUILTIN_THEMES, ...customThemes];
    const active       = allThemes.find(t => t.name === settings.themeName) ?? BUILTIN_THEMES[0];
    applyTheme(active.colors);
  }, []);

  return (
    <div className="min-h-screen bg-bg font-mono text-tx">
      <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[13px] tracking-[0.15em] uppercase text-tx">rng toolkit</h1>
          <p className="text-[10px] text-muted mt-0.5">randomness utilities · client-side · no tracking</p>
        </div>
        <Link href="/tools"
          className="text-[10px] text-muted border border-border2 px-2.5 py-1 hover:text-tx hover:border-muted transition-colors tracking-[0.06em]">
          ← tools
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex flex-col items-start border px-3 py-1.5 transition-colors font-mono
                ${activeTab === t.id
                  ? "border-green text-green bg-green/10"
                  : "border-border2 text-muted hover:text-tx hover:border-muted"
                }`}>
              <span className="text-[10px] tracking-[0.06em]">{t.label}</span>
              <span className={`text-[8px] tracking-[0.04em] ${activeTab === t.id ? "text-green/60" : "text-dim"}`}>{t.desc}</span>
            </button>
          ))}
        </div>

        <div className="border border-border2 bg-surface p-5">
          {activeTab === "number" && <NumberGen />}
          {activeTab === "dice"   && <DiceRoller />}
          {activeTab === "coin"   && <CoinFlip />}
          {activeTab === "cards"  && <CardDraw />}
          {activeTab === "wheel"  && <SpinWheel />}
          {activeTab === "groups" && <GroupGen />}
        </div>
      </div>
    </div>
  );
}