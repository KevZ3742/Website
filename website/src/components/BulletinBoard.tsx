"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type WidgetKind = "note" | "todo" | "bookmark" | "clock" | "weather";
export type DrawTool   = "pen" | "line" | "eraser";

export interface Widget {
  id:       string;
  kind:     WidgetKind;
  x:        number;
  y:        number;
  w:        number;
  h:        number;
  data:     Record<string, unknown>;
  pinned?:  boolean;
  rotation: number;
  z?:       number;
}

export interface Stroke {
  id:     string;
  points: [number, number][];
  color:  string;
  width:  number;
  tool:   "pen" | "line";  // eraser removes strokes, doesn't create them
}

interface BulletinBoardProps {
  weather:    { temp: number; condition: string; icon: string; city: string } | null;
  timeFormat: "24h" | "12h";
  tempUnit:   "C" | "F";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function formatTime(d: Date, fmt: "24h" | "12h") {
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = fmt === "24h" ? pad(d.getHours()) : String(d.getHours() % 12 || 12);
  return `${h}:${pad(d.getMinutes())}`;
}

function displayTemp(t: number, unit: "C" | "F") {
  return unit === "F" ? `${Math.round(t * 9 / 5 + 32)}°F` : `${t}°C`;
}

/** Returns true if point p is within `threshold` px of line segment (a→b) */
function pointNearSegment(
  p: [number, number], a: [number, number], b: [number, number], threshold: number,
): boolean {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ex = p[0] - a[0], ey = p[1] - a[1];
    return Math.sqrt(ex * ex + ey * ey) < threshold;
  }
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq));
  const px = a[0] + t * dx - p[0], py = a[1] + t * dy - p[1];
  return Math.sqrt(px * px + py * py) < threshold;
}

/** Returns true if eraser path comes close enough to any segment of a stroke */
function eraserHitsStroke(eraserPts: [number, number][], stroke: Stroke, threshold: number): boolean {
  for (let i = 0; i < eraserPts.length; i++) {
    const ep = eraserPts[i];
    for (let j = 0; j < stroke.points.length - 1; j++) {
      if (pointNearSegment(ep, stroke.points[j], stroke.points[j + 1], threshold)) return true;
    }
    // Also check single-point strokes
    if (stroke.points.length === 1) {
      const dx = ep[0] - stroke.points[0][0], dy = ep[1] - stroke.points[0][1];
      if (Math.sqrt(dx * dx + dy * dy) < threshold) return true;
    }
  }
  return false;
}

function pointsToPath(pts: [number, number][]): string {
  if (pts.length < 2) return pts.length === 1 ? `M ${pts[0][0]} ${pts[0][1]}` : "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
  return d;
}

const WIDGET_DEFAULTS: Record<WidgetKind, Omit<Widget, "id" | "x" | "y">> = {
  note:     { kind: "note",     w: 200, h: 180, rotation: -1.2, data: { text: "" } },
  todo:     { kind: "todo",     w: 200, h: 220, rotation: 0.8,  data: { items: [] } },
  bookmark: { kind: "bookmark", w: 180, h: 100, rotation: -0.5, data: { url: "", label: "" } },
  clock:    { kind: "clock",    w: 160, h: 90,  rotation: 1.0,  data: {} },
  weather:  { kind: "weather",  w: 180, h: 110, rotation: -0.8, data: {} },
};

const PALETTE = ["#4ade80", "#f87171", "#facc15", "#60a5fa", "#e879f9", "#34d399", "#fb923c"];

// ── Widget renderers ──────────────────────────────────────────────────────────

function NoteWidget({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <textarea
      value={data.text as string}
      onChange={e => onChange({ text: e.target.value })}
      placeholder="write something..."
      onPointerDown={e => e.stopPropagation()}
      className="w-full h-full bg-transparent border-none outline-none resize-none text-[11px] text-tx font-mono placeholder:text-muted leading-relaxed"
    />
  );
}

function TodoWidget({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const items = (data.items as { id: string; text: string; done: boolean }[]) ?? [];
  const add    = () => onChange({ items: [...items, { id: uid(), text: "", done: false }] });
  const toggle = (id: string) => onChange({ items: items.map(i => i.id === id ? { ...i, done: !i.done } : i) });
  const edit   = (id: string, text: string) => onChange({ items: items.map(i => i.id === id ? { ...i, text } : i) });
  const remove = (id: string) => onChange({ items: items.filter(i => i.id !== id) });

  return (
    <div className="flex flex-col gap-1 h-full" onPointerDown={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted tracking-widest uppercase">tasks</span>
        <button onClick={add} className="text-[10px] text-green hover:opacity-70 transition-opacity">+ add</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-1.5 group">
            <button onClick={() => toggle(item.id)} className={`w-3 h-3 border shrink-0 transition-colors ${item.done ? "bg-green border-green" : "border-border2"}`} />
            <input
              value={item.text}
              onChange={e => edit(item.id, e.target.value)}
              placeholder="task..."
              className={`flex-1 bg-transparent outline-none text-[10px] font-mono border-b border-transparent focus:border-border2 transition-colors ${item.done ? "line-through text-muted" : "text-tx"}`}
            />
            <button onClick={() => remove(item.id)} className="text-[9px] text-muted opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookmarkWidget({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const [editing, setEditing] = useState(false);
  const url   = (data.url   as string) ?? "";
  const label = (data.label as string) ?? "";

  if (editing || !url) return (
    <div className="flex flex-col gap-2" onPointerDown={e => e.stopPropagation()}>
      <input value={label} onChange={e => onChange({ ...data, label: e.target.value })} placeholder="label" className="bg-transparent border-b border-border2 outline-none text-[11px] text-tx font-mono" />
      <input value={url}   onChange={e => onChange({ ...data, url:   e.target.value })} placeholder="https://..." className="bg-transparent border-b border-border2 outline-none text-[10px] text-muted font-mono" />
      <button onClick={() => setEditing(false)} className="text-[9px] text-green self-end">done</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-1 h-full justify-center" onPointerDown={e => e.stopPropagation()}>
      <a href={url} target="_blank" rel="noreferrer" className="text-[13px] text-green hover:underline font-mono truncate">{label || url}</a>
      <span className="text-[9px] text-muted truncate">{url}</span>
      <button onClick={() => setEditing(true)} className="text-[9px] text-muted hover:text-tx transition-colors self-start mt-1">edit</button>
    </div>
  );
}

function ClockWidgetContent({ timeFormat }: { timeFormat: "24h" | "12h" }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <span className="text-[2rem] font-light text-tx tabular-nums leading-none">{formatTime(now, timeFormat)}</span>
      <span className="text-[9px] text-muted mt-1 tracking-widest uppercase">{now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
    </div>
  );
}

function WeatherWidgetContent({ weather, tempUnit }: { weather: BulletinBoardProps["weather"]; tempUnit: "C" | "F" }) {
  if (!weather) return <div className="text-[10px] text-muted text-center mt-6">no weather data</div>;
  return (
    <div className="flex flex-col items-center justify-center h-full gap-1">
      <span className="text-3xl">{weather.icon}</span>
      <span className="text-[1.4rem] text-tx font-light tabular-nums">{displayTemp(weather.temp, tempUnit)}</span>
      <span className="text-[9px] text-muted tracking-widest">{weather.condition} · {weather.city}</span>
    </div>
  );
}

// ── Drawing canvas ────────────────────────────────────────────────────────────

interface DrawCanvasProps {
  strokes:      Stroke[];
  tool:         DrawTool;
  color:        string;
  brushSize:    number;
  eraserSize:   number;
  active:       boolean;
  onStrokeEnd:  (s: Stroke) => void;
  onErase:      (pts: [number, number][]) => void;
}

function DrawCanvas({ strokes, tool, color, brushSize, eraserSize, active, onStrokeEnd, onErase }: DrawCanvasProps) {
  const svgRef      = useRef<SVGSVGElement>(null);
  const currentPts  = useRef<[number, number][]>([]);
  const lineStart   = useRef<[number, number] | null>(null);
  const drawing     = useRef(false);

  // Eraser cursor position for visual feedback
  const [eraserPos, setEraserPos] = useState<[number, number] | null>(null);

  const getPos = useCallback((e: PointerEvent): [number, number] => {
    const r = svgRef.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }, []);

  const onDown = useCallback((e: PointerEvent) => {
    if (!active) return;
    const pos = getPos(e);
    drawing.current = true;
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);

    if (tool === "pen") {
      currentPts.current = [pos];
    } else if (tool === "line") {
      lineStart.current  = pos;
      currentPts.current = [pos, pos];
    } else if (tool === "eraser") {
      currentPts.current = [pos];
      onErase([pos]);
    }
  }, [active, tool, onErase, getPos]);

  const onMove = useCallback((e: PointerEvent) => {
    const pos = getPos(e);

    if (active && tool === "eraser") {
      setEraserPos(pos);
    }

    if (!drawing.current || !active) return;

    if (tool === "pen") {
      currentPts.current.push(pos);
      svgRef.current?.querySelector("#live-path")?.setAttribute("d", pointsToPath(currentPts.current));
    } else if (tool === "line" && lineStart.current) {
      // Update the live preview endpoint
      const preview = [lineStart.current, pos] as [number, number][];
      svgRef.current?.querySelector("#live-path")?.setAttribute("d", pointsToPath(preview));
    } else if (tool === "eraser") {
      currentPts.current.push(pos);
      onErase(currentPts.current);
    }
  }, [active, tool, onErase, getPos]);

  const onUp = useCallback((e: PointerEvent) => {
    if (!drawing.current) return;
    drawing.current = false;
    const pos = getPos(e);

    if (tool === "pen" && currentPts.current.length >= 2) {
      onStrokeEnd({ id: uid(), points: [...currentPts.current], color, width: brushSize, tool: "pen" });
    } else if (tool === "line" && lineStart.current) {
      const pts: [number, number][] = [lineStart.current, pos];
      onStrokeEnd({ id: uid(), points: pts, color, width: brushSize, tool: "line" });
      lineStart.current = null;
    }

    currentPts.current = [];
    svgRef.current?.querySelector("#live-path")?.setAttribute("d", "");
  }, [tool, color, brushSize, onStrokeEnd, getPos]);

  const onLeave = useCallback(() => {
    setEraserPos(null);
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener("pointerdown",  onDown);
    svg.addEventListener("pointermove",  onMove);
    svg.addEventListener("pointerup",    onUp);
    svg.addEventListener("pointerleave", onLeave);
    return () => {
      svg.removeEventListener("pointerdown",  onDown);
      svg.removeEventListener("pointermove",  onMove);
      svg.removeEventListener("pointerup",    onUp);
      svg.removeEventListener("pointerleave", onLeave);
    };
  }, [onDown, onMove, onUp, onLeave]);

  const cursor = !active
    ? "default"
    : tool === "eraser"
      ? "none"
      : tool === "line"
        ? "crosshair"
        : "crosshair";

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full"
      style={{ cursor, zIndex: active ? 30 : 5, pointerEvents: active ? "all" : "none" }}
    >
      {/* Committed strokes */}
      {strokes.map(s => (
        <path
          key={s.id}
          d={pointsToPath(s.points)}
          fill="none"
          stroke={s.color}
          strokeWidth={s.width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* Live preview stroke */}
      <path
        id="live-path"
        fill="none"
        stroke={tool === "eraser" ? "transparent" : color}
        strokeWidth={brushSize}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={tool === "line" ? "4 3" : undefined}
      />

      {/* Eraser cursor circle */}
      {active && tool === "eraser" && eraserPos && (
        <circle
          cx={eraserPos[0]}
          cy={eraserPos[1]}
          r={eraserSize / 2}
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={1}
          style={{ pointerEvents: "none" }}
        />
      )}
    </svg>
  );
}

// ── Widget card ───────────────────────────────────────────────────────────────

const WIDGET_LABELS: Record<WidgetKind, string> = {
  note: "note", todo: "tasks", bookmark: "link", clock: "clock", weather: "weather",
};

function WidgetCard({
  widget, drawMode, timeFormat, tempUnit, weather,
  onMove, onChange, onDelete, onBringForward,
}: {
  widget:         Widget;
  drawMode:       boolean;
  timeFormat:     "24h" | "12h";
  tempUnit:       "C" | "F";
  weather:        BulletinBoardProps["weather"];
  onMove:         (id: string, x: number, y: number) => void;
  onChange:       (id: string, data: Record<string, unknown>) => void;
  onDelete:       (id: string) => void;
  onBringForward: (id: string) => void;
}) {
  const dragBase = useRef<{ mx: number; my: number; wx: number; wy: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (drawMode) return;
    if ((e.target as HTMLElement).closest("textarea, input, a, button")) return;
    dragBase.current = { mx: e.clientX, my: e.clientY, wx: widget.x, wy: widget.y };
    onBringForward(widget.id);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragBase.current) return;
    onMove(widget.id, dragBase.current.wx + e.clientX - dragBase.current.mx, dragBase.current.wy + e.clientY - dragBase.current.my);
  };

  const handlePointerUp = () => { dragBase.current = null; };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute group select-none"
      style={{
        left:  widget.x,
        top:   widget.y,
        width: widget.w,
        height: widget.h,
        transform: `rotate(${widget.rotation}deg)`,
        cursor: drawMode ? "crosshair" : "grab",
        zIndex: widget.z ?? 10,
        touchAction: "none",
      }}
    >
      {/* Pin */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-green border border-surface z-10 opacity-80" />

      {/* Card */}
      <div
        className="w-full h-full bg-surface border border-border2 p-3 flex flex-col overflow-hidden"
        style={{ boxShadow: "2px 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)" }}
      >
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[8px] text-muted tracking-[0.15em] uppercase">{WIDGET_LABELS[widget.kind]}</span>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => onDelete(widget.id)}
            className="text-[10px] text-muted opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
          >×</button>
        </div>
        <div className="flex-1 min-h-0">
          {widget.kind === "note"     && <NoteWidget     data={widget.data} onChange={d => onChange(widget.id, d)} />}
          {widget.kind === "todo"     && <TodoWidget     data={widget.data} onChange={d => onChange(widget.id, d)} />}
          {widget.kind === "bookmark" && <BookmarkWidget data={widget.data} onChange={d => onChange(widget.id, d)} />}
          {widget.kind === "clock"    && <ClockWidgetContent timeFormat={timeFormat} />}
          {widget.kind === "weather"  && <WeatherWidgetContent weather={weather} tempUnit={tempUnit} />}
        </div>
      </div>
    </div>
  );
}

// ── Tool button ───────────────────────────────────────────────────────────────

function ToolBtn({
  label, icon, active, onClick,
}: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 text-[10px] tracking-[0.07em] border px-2.5 py-1.5 font-mono transition-colors
        ${active
          ? "border-green text-green bg-green/10"
          : "border-border2 text-muted hover:text-tx hover:border-muted"
        }`}
    >
      <span>{icon}</span>{label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function BulletinBoard({ weather, timeFormat, tempUnit }: BulletinBoardProps) {
  const [widgets,     setWidgets]     = useState<Widget[]>([]);
  const [strokes,     setStrokes]     = useState<Stroke[]>([]);
  const [drawMode,    setDrawMode]    = useState(false);
  const [activeTool,  setActiveTool]  = useState<DrawTool>("pen");
  const [drawColor,   setDrawColor]   = useState(PALETTE[0]);
  const [brushSize,   setBrushSize]   = useState(2);
  const [eraserSize,  setEraserSize]  = useState(20);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [, setZCounter] = useState(10);
  const boardRef = useRef<HTMLDivElement>(null);

  const addWidget = useCallback((kind: WidgetKind) => {
    const board = boardRef.current;
    const cx = board ? board.clientWidth  / 2 - 100 + (Math.random() - 0.5) * 120 : 200;
    const cy = board ? board.clientHeight / 2 - 100 + (Math.random() - 0.5) * 80  : 200;
    const defaults = WIDGET_DEFAULTS[kind];
    const w: Widget = { ...defaults, id: uid(), x: cx, y: cy };
    setZCounter(z => {
      w.z = z + 1;
      return z + 1;
    });
    setWidgets(ws => [...ws, w]);
    setShowAddMenu(false);
  }, []);

  const moveWidget   = useCallback((id: string, x: number, y: number) =>
    setWidgets(ws => ws.map(w => w.id === id ? { ...w, x, y } : w)), []);

  const updateWidget = useCallback((id: string, data: Record<string, unknown>) =>
    setWidgets(ws => ws.map(w => w.id === id ? { ...w, data } : w)), []);

  const deleteWidget = useCallback((id: string) =>
    setWidgets(ws => ws.filter(w => w.id !== id)), []);

  const bringForward = useCallback((id: string) => {
    setZCounter(z => {
      const next = z + 1;
      setWidgets(ws => ws.map(w => w.id === id ? { ...w, z: next } : w));
      return next;
    });
  }, []);

  const addStroke = useCallback((s: Stroke) => setStrokes(prev => [...prev, s]), []);

  const handleErase = useCallback((pts: [number, number][]) => {
    setStrokes(prev => prev.filter(s => !eraserHitsStroke(pts, s, eraserSize / 2 + s.width)));
  }, [eraserSize]);

  const enterDrawMode = useCallback((tool: DrawTool) => {
    setActiveTool(tool);
    setDrawMode(true);
    setShowAddMenu(false);
  }, []);

  const exitDrawMode = useCallback(() => setDrawMode(false), []);

  return (
    <div ref={boardRef} className="relative w-full h-full overflow-hidden">
      {/* Draw canvas */}
      <DrawCanvas
        strokes={strokes}
        tool={activeTool}
        color={drawColor}
        brushSize={brushSize}
        eraserSize={eraserSize}
        active={drawMode}
        onStrokeEnd={addStroke}
        onErase={handleErase}
      />

      {/* Widgets */}
      {widgets.map(w => (
        <WidgetCard
          key={w.id}
          widget={w}
          drawMode={drawMode}
          timeFormat={timeFormat}
          tempUnit={tempUnit}
          weather={weather}
          onMove={moveWidget}
          onChange={updateWidget}
          onDelete={deleteWidget}
          onBringForward={bringForward}
        />
      ))}

      {/* Empty state */}
      {widgets.length === 0 && !drawMode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-[11px] text-muted tracking-[0.12em] uppercase">empty board</p>
            <p className="text-[10px] text-dim mt-1">add a widget or start drawing</p>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-40 flex-wrap justify-center">

        {/* Add widget */}
        <div className="relative">
          <button
            onClick={() => { setShowAddMenu(m => !m); exitDrawMode(); }}
            className={`text-[10px] tracking-[0.08em] border px-3 py-1.5 font-mono transition-colors
              ${showAddMenu ? "border-green text-green" : "border-border2 text-muted hover:text-tx hover:border-muted"}`}
          >
            + widget
          </button>
          {showAddMenu && (
            <div className="absolute bottom-[calc(100%+6px)] left-0 bg-surface border border-border2 py-1 shadow-xl min-w-30">
              {(["note", "todo", "bookmark", "clock", "weather"] as WidgetKind[]).map(k => (
                <button key={k} onClick={() => addWidget(k)}
                  className="block w-full text-left px-3 py-1.5 text-[10px] text-muted hover:text-tx hover:bg-border transition-colors font-mono tracking-wider">
                  {k}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-border2" />

        {/* Draw tools */}
        <ToolBtn label="pen"    icon="✏"  active={drawMode && activeTool === "pen"}    onClick={() => drawMode && activeTool === "pen"    ? exitDrawMode() : enterDrawMode("pen")} />
        <ToolBtn label="line"   icon="╱"  active={drawMode && activeTool === "line"}   onClick={() => drawMode && activeTool === "line"   ? exitDrawMode() : enterDrawMode("line")} />
        <ToolBtn label="eraser" icon="◻"  active={drawMode && activeTool === "eraser"} onClick={() => drawMode && activeTool === "eraser" ? exitDrawMode() : enterDrawMode("eraser")} />

        {/* Draw options (only when draw mode active) */}
        {drawMode && (
          <>
            <div className="w-px h-5 bg-border2" />

            {/* Color palette (hide for eraser) */}
            {activeTool !== "eraser" && (
              <div className="flex items-center gap-1 border border-border2 px-2 py-1.5">
                {PALETTE.map(c => (
                  <button
                    key={c}
                    onClick={() => setDrawColor(c)}
                    className={`w-3.5 h-3.5 rounded-full transition-transform ${drawColor === c ? "scale-125 ring-1 ring-white/40" : ""}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            )}

            {/* Size picker */}
            {activeTool === "eraser" ? (
              <div className="flex items-center gap-1 border border-border2 px-2 py-1.5">
                <span className="text-[9px] text-muted mr-1">size</span>
                {[12, 20, 36, 56].map(s => (
                  <button
                    key={s}
                    onClick={() => setEraserSize(s)}
                    className={`flex items-center justify-center transition-colors ${eraserSize === s ? "text-green" : "text-muted hover:text-tx"}`}
                    style={{ width: 18, height: 18 }}
                  >
                    <div
                      className="rounded-full border border-current"
                      style={{ width: Math.min(s / 3, 14), height: Math.min(s / 3, 14) }}
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 border border-border2 px-2 py-1.5">
                {[1, 2, 4, 8].map(s => (
                  <button
                    key={s}
                    onClick={() => setBrushSize(s)}
                    className={`w-4 h-4 flex items-center justify-center transition-colors ${brushSize === s ? "text-green" : "text-muted hover:text-tx"}`}
                  >
                    <div className="rounded-full bg-current" style={{ width: s * 2 + 2, height: s * 2 + 2 }} />
                  </button>
                ))}
              </div>
            )}

            <div className="w-px h-5 bg-border2" />

            {/* Clear */}
            <button
              onClick={() => setStrokes([])}
              className="text-[10px] tracking-[0.08em] border border-red-900 text-red-500 hover:border-red-500 px-3 py-1.5 font-mono transition-colors"
            >
              clear
            </button>
          </>
        )}
      </div>
    </div>
  );
}