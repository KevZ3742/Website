"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BUILTIN_THEMES, applyTheme } from "../../../lib/themes";
import { loadSettings, loadCustomThemes } from "../../../lib/settings";

// ── Types ──────────────────────────────────────────────────────────────────────

type GamePhase = "idle" | "playing" | "won";

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_SIZE  = 2;
const MAX_SIZE  = 10;
const BOARD_PX  = 400;
const GAP_PX    = 3;

// ── Helpers ────────────────────────────────────────────────────────────────────

function tilePx(size: number): number {
  return Math.floor((BOARD_PX - GAP_PX * (size - 1)) / size);
}

function actualBoardPx(size: number): number {
  return tilePx(size) * size + GAP_PX * (size - 1);
}

function isSolvable(tiles: number[], size: number): boolean {
  const flat = tiles.filter(t => t !== 0);
  let inv = 0;
  for (let i = 0; i < flat.length; i++)
    for (let j = i + 1; j < flat.length; j++)
      if (flat[i] > flat[j]) inv++;
  if (size % 2 === 1) return inv % 2 === 0;
  const blankRow      = Math.floor(tiles.indexOf(0) / size);
  const rowFromBottom = size - blankRow;
  return (rowFromBottom % 2 === 0) ? inv % 2 === 1 : inv % 2 === 0;
}

function generatePuzzle(size: number): number[] {
  const n = size * size;
  let tiles: number[];
  do {
    tiles = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
  } while (!isSolvable(tiles, size) || isSolved(tiles, size));
  return tiles;
}

function isSolved(tiles: number[], size: number): boolean {
  for (let i = 0; i < size * size - 1; i++)
    if (tiles[i] !== i + 1) return false;
  return tiles[size * size - 1] === 0;
}

function getMoveableTiles(tiles: number[], size: number): number[] {
  const blankIdx = tiles.indexOf(0);
  const r = Math.floor(blankIdx / size);
  const c = blankIdx % size;
  const neighbors: number[] = [];
  if (r > 0)        neighbors.push(blankIdx - size);
  if (r < size - 1) neighbors.push(blankIdx + size);
  if (c > 0)        neighbors.push(blankIdx - 1);
  if (c < size - 1) neighbors.push(blankIdx + 1);
  return neighbors;
}

function moveTile(tiles: number[], tileIdx: number, size: number): number[] | null {
  const blankIdx = tiles.indexOf(0);
  if (!getMoveableTiles(tiles, size).includes(tileIdx)) return null;
  const next = [...tiles];
  [next[blankIdx], next[tileIdx]] = [next[tileIdx], next[blankIdx]];
  return next;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function difficultyLabel(size: number): string {
  if (size <= 3) return "easy";
  if (size <= 4) return "classic";
  if (size <= 6) return "hard";
  if (size <= 8) return "brutal";
  return "insane";
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SlidePuzzlePage() {
  const [size,        setSize]        = useState(4);
  const [sizeInput,   setSizeInput]   = useState("4");
  const [sizeError,   setSizeError]   = useState("");
  const [phase,       setPhase]       = useState<GamePhase>("idle");
  const [tiles,       setTiles]       = useState<number[]>([]);
  const [moves,       setMoves]       = useState(0);
  const [elapsed,     setElapsed]     = useState(0);
  const [animWin,     setAnimWin]     = useState(false);
  const [imageUrl,    setImageUrl]    = useState<string | null>(null);
  const [imageError,  setImageError]  = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [movingTile,  setMovingTile]  = useState<number | null>(null);

  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tilesRef     = useRef<number[]>([]);
  const phaseRef     = useRef<GamePhase>("idle");
  const sizeRef      = useRef(4);

  tilesRef.current = tiles;
  phaseRef.current = phase;
  sizeRef.current  = size;

  // Apply theme
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
      startTimeRef.current = Date.now() - elapsed;
      timerRef.current = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Size input ────────────────────────────────────────────────────────────────

  const validateAndSet = (raw: string): boolean => {
    const n = parseInt(raw, 10);
    if (!raw.trim() || isNaN(n)) { setSizeError("enter a number"); return false; }
    if (n < MIN_SIZE) { setSizeError(`minimum is ${MIN_SIZE}`); return false; }
    if (n > MAX_SIZE) { setSizeError(`maximum is ${MAX_SIZE}`); return false; }
    setSizeError("");
    setSize(n);
    return true;
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSizeInput(val);
    validateAndSet(val);
  };

  const handleSizeBlur = () => {
    if (!validateAndSet(sizeInput)) setSizeInput(String(size));
  };

  const handleSizeKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { validateAndSet(sizeInput); (e.target as HTMLInputElement).blur(); }
  };

  const adjustSize = (delta: number) => {
    const next = Math.max(MIN_SIZE, Math.min(MAX_SIZE, size + delta));
    setSize(next);
    setSizeInput(String(next));
    setSizeError("");
  };

  // ── Game ops ──────────────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    if (sizeError) return;
    const t = generatePuzzle(size);
    setTiles(t);
    setMoves(0);
    setElapsed(0);
    setAnimWin(false);
    setPhase("playing");
    setShowPreview(false);
  }, [size, sizeError]);

  const handleTileClick = useCallback((tileIdx: number) => {
    if (phaseRef.current !== "playing") return;
    const result = moveTile(tilesRef.current, tileIdx, sizeRef.current);
    if (!result) return;
    setMovingTile(tileIdx);
    setTimeout(() => setMovingTile(null), 120);
    setTiles(result);
    setMoves(m => m + 1);
    if (isSolved(result, sizeRef.current)) {
      phaseRef.current = "won";
      setPhase("won");
      setTimeout(() => setAnimWin(true), 80);
    }
  }, []);

  // Keyboard support
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (phaseRef.current !== "playing") return;
      const sz    = sizeRef.current;
      const blank = tilesRef.current.indexOf(0);
      const r     = Math.floor(blank / sz);
      const c     = blank % sz;
      let target  = -1;
      if (e.key === "ArrowUp"    && r < sz - 1) target = blank + sz;
      if (e.key === "ArrowDown"  && r > 0)       target = blank - sz;
      if (e.key === "ArrowLeft"  && c < sz - 1)  target = blank + 1;
      if (e.key === "ArrowRight" && c > 0)        target = blank - 1;
      if (target >= 0) { e.preventDefault(); handleTileClick(target); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [handleTileClick]);

  // ── Image ops ─────────────────────────────────────────────────────────────────

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImageError(false);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload  = () => setImageUrl(url);
    img.onerror = () => { setImageError(true); URL.revokeObjectURL(url); };
    img.src = url;
  };

  const clearImage = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setImageError(false);
  };

  // ── Derived layout values ─────────────────────────────────────────────────────

  const tp        = tilePx(size);
  const boardPx   = actualBoardPx(size);
  const blankIdx  = tiles.indexOf(0);
  const moveables = phase === "playing" ? getMoveableTiles(tiles, size) : [];
  const fontSize  = tp < 28 ? 9 : tp < 40 ? 11 : tp < 60 ? 14 : tp < 80 ? 18 : tp < 100 ? 22 : 26;

  return (
    <div className="min-h-screen bg-bg font-mono text-tx">

      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[13px] tracking-[0.15em] uppercase text-tx">slide puzzle</h1>
          <p className="text-[10px] text-muted mt-0.5">
            arrange tiles in order · slide into the blank · use arrow keys
          </p>
        </div>
        <Link href="/games"
          className="text-[10px] text-muted border border-border2 px-2.5 py-1 hover:text-tx hover:border-muted transition-colors tracking-[0.06em]">
          ← games
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* ── Config ── */}
        <div className="space-y-4">

          {/* Grid size */}
          <div className="space-y-2">
            <span className="text-[9px] text-muted tracking-[0.08em] uppercase">grid size</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border2">
                <button
                  onClick={() => adjustSize(-1)}
                  className="px-3 py-2 text-muted hover:text-green transition-colors text-[16px] leading-none select-none">
                  −
                </button>
                <input
                  type="number"
                  min={MIN_SIZE}
                  max={MAX_SIZE}
                  value={sizeInput}
                  onChange={handleSizeChange}
                  onBlur={handleSizeBlur}
                  onKeyDown={handleSizeKey}
                  className="w-12 bg-transparent outline-none text-[14px] text-tx text-center tabular-nums font-mono py-2 border-x border-border2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => adjustSize(1)}
                  className="px-3 py-2 text-muted hover:text-green transition-colors text-[16px] leading-none select-none">
                  +
                </button>
              </div>

              {sizeError ? (
                <span className="text-[10px] text-red-400">{sizeError}</span>
              ) : (
                <div className="flex items-center gap-2 text-[10px] text-muted">
                  <span className="text-tx tabular-nums">{size}×{size}</span>
                  <span className="text-dim">·</span>
                  <span>{size * size - 1} tiles</span>
                  <span className="text-dim">·</span>
                  <span className={
                    size <= 3 ? "text-green" :
                    size <= 4 ? "text-tx" :
                    size <= 6 ? "text-yellow-400" :
                    "text-red-400"
                  }>{difficultyLabel(size)}</span>
                </div>
              )}
            </div>
            <p className="text-[9px] text-dim">any grid from {MIN_SIZE}×{MIN_SIZE} up to {MAX_SIZE}×{MAX_SIZE}</p>
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <span className="text-[9px] text-muted tracking-[0.08em] uppercase">image (optional)</span>
            <div className="flex items-center gap-2 flex-wrap">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <button onClick={() => fileInputRef.current?.click()}
                className="text-[10px] border border-border2 text-muted px-3 py-1.5 hover:text-tx hover:border-muted transition-colors tracking-[0.06em] font-mono">
                {imageUrl ? "replace image" : "upload image"}
              </button>
              {imageUrl && (
                <>
                  <button onClick={clearImage}
                    className="text-[10px] border border-red-900 text-red-500 hover:border-red-500 px-3 py-1.5 transition-colors tracking-[0.06em] font-mono">
                    remove
                  </button>
                  <span className="text-[9px] text-green tracking-[0.06em]">✓ image loaded</span>
                </>
              )}
              {imageError && <span className="text-[9px] text-red-400">failed to load image</span>}
            </div>
            {!imageUrl && (
              <p className="text-[9px] text-dim">no image → numbered tiles. upload any photo to use it as the puzzle.</p>
            )}
          </div>

          <button
            onClick={startGame}
            disabled={!!sizeError}
            className={`w-full border text-[11px] tracking-widest py-3 transition-colors font-mono
              ${sizeError
                ? "border-border2 text-dim cursor-not-allowed"
                : "border-green text-green hover:bg-green/10"}`}>
            {phase === "idle" ? "start game" : "new game"}
          </button>
        </div>

        {/* ── Board ── */}
        {phase !== "idle" && (
          <div className="space-y-4">

            {/* Stats bar */}
            <div className="flex items-center justify-between border border-border2 bg-surface px-4 py-2.5">
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <div className="text-[18px] tabular-nums text-tx">{moves}</div>
                  <div className="text-[9px] text-muted tracking-[0.08em] uppercase">moves</div>
                </div>
                <div className="w-px h-8 bg-border2" />
                <div className="text-center">
                  <div className="text-[18px] tabular-nums text-tx">{formatTime(elapsed)}</div>
                  <div className="text-[9px] text-muted tracking-[0.08em] uppercase">time</div>
                </div>
                {phase === "playing" && (
                  <>
                    <div className="w-px h-8 bg-border2" />
                    <div className="text-center">
                      <div className="text-[18px] tabular-nums text-green">
                        {tiles.filter((v, i) => v !== 0 && v === i + 1).length}
                        <span className="text-[11px] text-muted">/{size * size - 1}</span>
                      </div>
                      <div className="text-[9px] text-muted tracking-[0.08em] uppercase">correct</div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {imageUrl && phase === "playing" && (
                  <button onClick={() => setShowPreview(v => !v)}
                    className={`text-[9px] border px-2.5 py-1 transition-colors tracking-[0.06em] font-mono
                      ${showPreview
                        ? "border-green text-green"
                        : "border-border2 text-muted hover:text-tx hover:border-muted"}`}>
                    {showPreview ? "hide ref" : "show ref"}
                  </button>
                )}
                <button onClick={startGame}
                  className="text-[9px] text-muted border border-border2 px-2.5 py-1 hover:text-tx hover:border-muted transition-colors tracking-[0.06em]">
                  restart
                </button>
              </div>
            </div>

            {/* Reference image */}
            {imageUrl && showPreview && (
              <div className="flex justify-center">
                <div className="border border-border2 p-2 bg-surface">
                  <span className="text-[9px] text-muted tracking-[0.08em] uppercase block mb-2 text-center">reference</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="reference"
                    className="border border-border"
                    style={{ width: boardPx, height: boardPx, objectFit: "cover", display: "block" }} />
                </div>
              </div>
            )}

            {/* Puzzle board */}
            <div className="flex justify-center">
              <div className="relative select-none" style={{ width: boardPx, height: boardPx }}>

                {tiles.map((value, idx) => {
                  if (value === 0) return null;

                  const row = Math.floor(idx / size);
                  const col = idx % size;
                  const x   = col * (tp + GAP_PX);
                  const y   = row * (tp + GAP_PX);

                  const isMoveable = moveables.includes(idx);
                  const isCorrect  = value === idx + 1;
                  const isMoving   = movingTile === idx;

                  const srcRow = Math.floor((value - 1) / size);
                  const srcCol = (value - 1) % size;

                  return (
                    <div
                      key={value}
                      onClick={() => handleTileClick(idx)}
                      className="absolute overflow-hidden border font-mono"
                      style={{
                        left:        x,
                        top:         y,
                        width:       tp,
                        height:      tp,
                        borderColor: phase === "won" || isMoveable ? "var(--green)" : "var(--border2)",
                        background:  imageUrl ? "transparent" : "var(--surface)",
                        cursor:      phase === "won" ? "default" : isMoveable ? "pointer" : "not-allowed",
                        transition:  isMoving
                          ? "transform 0.12s ease-out"
                          : "border-color 0.15s ease, box-shadow 0.15s ease",
                        boxShadow:   isMoveable && phase !== "won"
                          ? "0 0 0 1px var(--green), 0 2px 12px rgba(0,0,0,0.4)"
                          : "0 2px 8px rgba(0,0,0,0.3)",
                        transform:   isMoving ? "scale(0.96)" : "scale(1)",
                        zIndex:      isMoveable ? 2 : 1,
                      }}>

                      {imageUrl ? (
                        <div style={{
                          width:              boardPx,
                          height:             boardPx,
                          backgroundImage:    `url(${imageUrl})`,
                          backgroundSize:     `${boardPx}px ${boardPx}px`,
                          backgroundPosition: `-${srcCol * (tp + GAP_PX)}px -${srcRow * (tp + GAP_PX)}px`,
                          backgroundRepeat:   "no-repeat",
                        }} />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            background: isCorrect && phase !== "won"
                              ? "rgba(74,222,128,0.06)"
                              : "var(--surface)",
                          }}>
                          <span
                            className="tabular-nums"
                            style={{
                              fontSize,
                              color: phase === "won" || isMoveable
                                ? "var(--green)"
                                : isCorrect ? "var(--text)" : "var(--muted)",
                              fontWeight: isMoveable ? 600 : 400,
                            }}>
                            {value}
                          </span>
                        </div>
                      )}

                      {/* Number overlay on image tiles */}
                      {imageUrl && phase !== "won" && tp >= 24 && (
                        <div
                          className="absolute bottom-0.5 right-1 tabular-nums leading-none"
                          style={{
                            fontSize:   Math.max(8, Math.min(11, tp / 5)),
                            color:      isMoveable ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.25)",
                            textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                          }}>
                          {value}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Blank slot */}
                {phase === "playing" && blankIdx >= 0 && (
                  <div
                    className="absolute border border-dashed"
                    style={{
                      left:        (blankIdx % size) * (tp + GAP_PX),
                      top:         Math.floor(blankIdx / size) * (tp + GAP_PX),
                      width:       tp,
                      height:      tp,
                      borderColor: "var(--border)",
                    }}
                  />
                )}
              </div>
            </div>

            {/* Hint */}
            {phase === "playing" && (
              <div className="flex justify-center">
                <span className="text-[9px] text-dim tracking-[0.06em]">
                  click tiles adjacent to blank · or use ← → ↑ ↓ arrow keys
                </span>
              </div>
            )}

            {/* Win screen */}
            {phase === "won" && (
              <div className={`border border-green bg-green/5 px-5 py-5 text-center space-y-3 transition-all duration-500 ${animWin ? "opacity-100" : "opacity-0"}`}>
                <div className="text-[11px] text-green tracking-[0.2em] uppercase">puzzle solved!</div>
                <div className="flex items-center justify-center gap-6">
                  <div>
                    <div className="text-[22px] text-tx tabular-nums">{moves}</div>
                    <div className="text-[9px] text-muted uppercase tracking-widest">moves</div>
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

          </div>
        )}
      </div>
    </div>
  );
}