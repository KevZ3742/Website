"use client";

import { useRef, useState, useCallback, useEffect } from "react";

import { NoteWidget, TodoWidget, BookmarkWidget, ClockWidget, WeatherWidget } from "./widgets";

// ── Types ─────────────────────────────────────────────────────────────────────

export type WidgetKind = "note" | "todo" | "bookmark" | "clock" | "weather";
export type DrawTool   = "pen" | "line" | "eraser" | "circle" | "box" | "text";

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
  tool:   "pen" | "line" | "circle" | "box";
}

export interface TextLabel {
  id:    string;
  x:     number;
  y:     number;
  text:  string;
  color: string;
  size:  number;
}

interface BulletinBoardProps {
  weather:    { temp: number; condition: string; icon: string; city: string } | null;
  timeFormat: "24h" | "12h";
  tempUnit:   "C" | "F";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

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

function eraserHitsStroke(eraserPts: [number, number][], stroke: Stroke, threshold: number): boolean {
  for (let i = 0; i < eraserPts.length; i++) {
    const ep = eraserPts[i];
    for (let j = 0; j < stroke.points.length - 1; j++) {
      if (pointNearSegment(ep, stroke.points[j], stroke.points[j + 1], threshold)) return true;
    }
    if (stroke.points.length === 1) {
      const dx = ep[0] - stroke.points[0][0], dy = ep[1] - stroke.points[0][1];
      if (Math.sqrt(dx * dx + dy * dy) < threshold) return true;
    }
  }
  return false;
}

function eraserHitsText(eraserPts: [number, number][], label: TextLabel, threshold: number): boolean {
  // approximate hit: any eraser point within threshold of the text origin
  for (const ep of eraserPts) {
    const dx = ep[0] - label.x, dy = ep[1] - label.y;
    if (Math.sqrt(dx * dx + dy * dy) < threshold + 40) return true;
  }
  return false;
}

function pointsToPath(pts: [number, number][]): string {
  if (pts.length < 2) return pts.length === 1 ? `M ${pts[0][0]} ${pts[0][1]}` : "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
  return d;
}

/** Build an SVG ellipse path from two corner points (bounding box style) */
function ellipsePath(a: [number, number], b: [number, number]): string {
  const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
  const rx = Math.abs(b[0] - a[0]) / 2, ry = Math.abs(b[1] - a[1]) / 2;
  if (rx < 1 || ry < 1) return "";
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy} Z`;
}

/** Build a rect path from two corner points */
function rectPath(a: [number, number], b: [number, number]): string {
  const x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]);
  const w = Math.abs(b[0] - a[0]), h = Math.abs(b[1] - a[1]);
  if (w < 1 || h < 1) return "";
  return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
}

/** Render a committed stroke as an SVG path string */
function strokeToPath(s: Stroke): string {
  if (s.tool === "circle") return ellipsePath(s.points[0], s.points[1] ?? s.points[0]);
  if (s.tool === "box")    return rectPath(s.points[0], s.points[1] ?? s.points[0]);
  return pointsToPath(s.points);
}

const WIDGET_DEFAULTS: Record<WidgetKind, Omit<Widget, "id" | "x" | "y">> = {
  note:     { kind: "note",     w: 200, h: 180, rotation: -1.2, data: { text: "" } },
  todo:     { kind: "todo",     w: 200, h: 220, rotation: 0.8,  data: { items: [] } },
  bookmark: { kind: "bookmark", w: 180, h: 100, rotation: -0.5, data: { url: "", label: "" } },
  clock:    { kind: "clock",    w: 160, h: 90,  rotation: 1.0,  data: {} },
  weather:  { kind: "weather",  w: 180, h: 110, rotation: -0.8, data: {} },
};

const PALETTE = ["#4ade80", "#f87171", "#facc15", "#60a5fa", "#e879f9", "#34d399", "#fb923c"];

// ── Drawing canvas ────────────────────────────────────────────────────────────

interface DrawCanvasProps {
  strokes:     Stroke[];
  labels:      TextLabel[];
  tool:        DrawTool;
  color:       string;
  brushSize:   number;
  eraserSize:  number;
  fontSize:    number;
  active:      boolean;
  onStrokeEnd: (s: Stroke) => void;
  onErase:     (pts: [number, number][]) => void;
  onAddLabel:  (l: TextLabel) => void;
}

function DrawCanvas({
  strokes, labels, tool, color, brushSize, eraserSize, fontSize,
  active, onStrokeEnd, onErase, onAddLabel,
}: DrawCanvasProps) {
  const svgRef      = useRef<SVGSVGElement>(null);
  const currentPts  = useRef<[number, number][]>([]);
  const shapeStart  = useRef<[number, number] | null>(null);
  const drawing     = useRef(false);
  const [eraserPos, setEraserPos] = useState<[number, number] | null>(null);
  const [livePath,  setLivePath]  = useState("");

  // ── Pending text input ──────────────────────────────────────────────────────
  const [pendingText, setPendingText] = useState<{ x: number; y: number; id: string } | null>(null);
  const [textValue,   setTextValue]   = useState("");
  const textInputRef = useRef<HTMLInputElement>(null);

  // Keep latest values accessible inside listeners without re-registering
  const stateRef = useRef({ tool, color, brushSize, eraserSize, fontSize, active, onStrokeEnd, onErase, onAddLabel });
  useEffect(() => {
    stateRef.current = { tool, color, brushSize, eraserSize, fontSize, active, onStrokeEnd, onErase, onAddLabel };
  });

  const getPos = useCallback((e: PointerEvent): [number, number] => {
    const r = svgRef.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }, []);

  // Commit pending text on blur / enter
  const commitText = useCallback(() => {
    if (!pendingText) return;
    const trimmed = textValue.trim();
    if (trimmed) {
      onAddLabel({ id: pendingText.id, x: pendingText.x, y: pendingText.y, text: trimmed, color, size: fontSize });
    }
    setPendingText(null);
    setTextValue("");
  }, [pendingText, textValue, color, fontSize, onAddLabel]);

  // Register pointer listeners once
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onDown = (e: PointerEvent) => {
      const { active, tool, onErase } = stateRef.current;
      if (!active) return;

      // Text tool: place an input on click, don't draw
      if (tool === "text") return;

      const pos = getPos(e);
      drawing.current = true;
      svg.setPointerCapture(e.pointerId);

      if (tool === "pen") {
        currentPts.current = [pos];
        setLivePath(pointsToPath([pos]));
      } else if (tool === "line" || tool === "circle" || tool === "box") {
        shapeStart.current = pos;
        setLivePath("");
      } else if (tool === "eraser") {
        currentPts.current = [pos];
        onErase([pos]);
      }
    };

    const onMove = (e: PointerEvent) => {
      const { active, tool, onErase } = stateRef.current;
      const pos = getPos(e);

      if (active && tool === "eraser") setEraserPos(pos);
      else setEraserPos(null);

      if (!drawing.current || !active) return;

      if (tool === "pen") {
        currentPts.current.push(pos);
        setLivePath(pointsToPath(currentPts.current));
      } else if (tool === "line" && shapeStart.current) {
        setLivePath(pointsToPath([shapeStart.current, pos]));
      } else if (tool === "circle" && shapeStart.current) {
        setLivePath(ellipsePath(shapeStart.current, pos));
      } else if (tool === "box" && shapeStart.current) {
        setLivePath(rectPath(shapeStart.current, pos));
      } else if (tool === "eraser") {
        currentPts.current.push(pos);
        onErase(currentPts.current);
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!drawing.current) return;
      drawing.current = false;
      const { tool, color, brushSize, onStrokeEnd } = stateRef.current;
      const pos = getPos(e);

      if (tool === "pen" && currentPts.current.length >= 2) {
        onStrokeEnd({ id: uid(), points: [...currentPts.current], color, width: brushSize, tool: "pen" });
      } else if ((tool === "line" || tool === "circle" || tool === "box") && shapeStart.current) {
        onStrokeEnd({ id: uid(), points: [shapeStart.current, pos], color, width: brushSize, tool });
        shapeStart.current = null;
      }

      currentPts.current = [];
      setLivePath("");
    };

    const onLeave = () => setEraserPos(null);

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
  }, [getPos]);

  // Text tool click handler (on the SVG wrapper div)
  const handleTextClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!active || tool !== "text") return;
    if (pendingText) { commitText(); return; }
    const r = svgRef.current!.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const id = uid();
    setPendingText({ x, y, id });
    setTextValue("");
    setTimeout(() => textInputRef.current?.focus(), 0);
  }, [active, tool, pendingText, commitText]);

  const cursor = !active
    ? "default"
    : tool === "eraser" ? "none"
    : tool === "text"   ? "text"
    : "crosshair";

  const liveStrokeDash = (tool === "line" || tool === "circle" || tool === "box") ? "4 3" : undefined;

  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: active ? 30 : 5, pointerEvents: active ? "all" : "none", cursor }}
      onClick={handleTextClick}
    >
      <svg ref={svgRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: tool === "text" ? "none" : "all" }}>
        {/* Committed strokes */}
        {strokes.map(s => (
          <path
            key={s.id}
            d={strokeToPath(s)}
            fill="none"
            stroke={s.color}
            strokeWidth={s.width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Live preview */}
        {livePath && (
          <path
            d={livePath}
            fill="none"
            stroke={color}
            strokeWidth={brushSize}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={liveStrokeDash}
          />
        )}

        {/* Eraser cursor */}
        {active && tool === "eraser" && eraserPos && (
          <circle
            cx={eraserPos[0]} cy={eraserPos[1]} r={eraserSize / 2}
            fill="rgba(255,255,255,0.08)"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={1}
            style={{ pointerEvents: "none" }}
          />
        )}
      </svg>

      {/* Text labels */}
      {labels.map(l => (
        <span
          key={l.id}
          className="absolute font-mono select-none pointer-events-none whitespace-pre"
          style={{ left: l.x, top: l.y - l.size, color: l.color, fontSize: l.size, lineHeight: 1.2 }}
        >
          {l.text}
        </span>
      ))}

      {/* Pending text input */}
      {pendingText && (
        <input
          ref={textInputRef}
          value={textValue}
          onChange={e => setTextValue(e.target.value)}
          onBlur={commitText}
          onKeyDown={e => {
            if (e.key === "Enter")  { commitText(); }
            if (e.key === "Escape") { setPendingText(null); setTextValue(""); }
          }}
          className="absolute bg-transparent outline-none font-mono caret-green border-b border-dashed border-green"
          style={{
            left:     pendingText.x,
            top:      pendingText.y - fontSize,
            color,
            fontSize,
            lineHeight: 1.2,
            minWidth:   80,
          }}
          placeholder="type here..."
          spellCheck={false}
        />
      )}
    </div>
  );
}

// ── Widget card ───────────────────────────────────────────────────────────────

const WIDGET_LABELS: Record<WidgetKind, string> = {
  note: "note", todo: "tasks", bookmark: "bookmark", clock: "clock", weather: "weather",
};

interface WidgetCardProps {
  widget:         Widget;
  drawMode:       boolean;
  timeFormat:     "24h" | "12h";
  tempUnit:       "C" | "F";
  weather:        BulletinBoardProps["weather"];
  onMove:         (id: string, x: number, y: number) => void;
  onChange:       (id: string, data: Record<string, unknown>) => void;
  onDelete:       (id: string) => void;
  onBringForward: (id: string) => void;
}

function WidgetCard({
  widget, drawMode, timeFormat, tempUnit, weather,
  onMove, onChange, onDelete, onBringForward,
}: WidgetCardProps) {
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
        left:   widget.x,
        top:    widget.y,
        width:  widget.w,
        height: widget.h,
        transform:   `rotate(${widget.rotation}deg)`,
        cursor:      drawMode ? "crosshair" : "grab",
        zIndex:      widget.z ?? 10,
        touchAction: "none",
      }}
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-green border border-surface z-10 opacity-80" />
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
          {widget.kind === "clock"    && <ClockWidget    timeFormat={timeFormat} />}
          {widget.kind === "weather"  && <WeatherWidget  weather={weather} tempUnit={tempUnit} />}
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
  const [labels,      setLabels]      = useState<TextLabel[]>([]);
  const [drawMode,    setDrawMode]    = useState(false);
  const [activeTool,  setActiveTool]  = useState<DrawTool>("pen");
  const [drawColor,   setDrawColor]   = useState(PALETTE[0]);
  const [brushSize,   setBrushSize]   = useState(2);
  const [eraserSize,  setEraserSize]  = useState(20);
  const [fontSize,    setFontSize]    = useState(14);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [, setZCounter] = useState(10);
  const boardRef = useRef<HTMLDivElement>(null);

  const addWidget = useCallback((kind: WidgetKind) => {
    const board = boardRef.current;
    const cx = board ? board.clientWidth  / 2 - 100 + (Math.random() - 0.5) * 120 : 200;
    const cy = board ? board.clientHeight / 2 - 100 + (Math.random() - 0.5) * 80  : 200;
    const defaults = WIDGET_DEFAULTS[kind];
    const w: Widget = { ...defaults, id: uid(), x: cx, y: cy };
    setZCounter(z => { w.z = z + 1; return z + 1; });
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

  const addStroke  = useCallback((s: Stroke) => setStrokes(prev => [...prev, s]), []);

  const handleErase = useCallback((pts: [number, number][]) => {
    setStrokes(prev => prev.filter(s => !eraserHitsStroke(pts, s, eraserSize / 2 + s.width)));
    setLabels(prev  => prev.filter(l  => !eraserHitsText(pts, l, eraserSize / 2)));
  }, [eraserSize]);

  const addLabel  = useCallback((l: TextLabel) => setLabels(prev => [...prev, l]), []);

  const enterDrawMode = useCallback((tool: DrawTool) => {
    setActiveTool(tool);
    setDrawMode(true);
    setShowAddMenu(false);
  }, []);

  const exitDrawMode = useCallback(() => setDrawMode(false), []);

  const isEraserTool = activeTool === "eraser";
  const isTextTool   = activeTool === "text";
  const showColorPicker = drawMode && !isEraserTool;
  const showBrushSize   = drawMode && !isEraserTool && !isTextTool;
  const showEraserSize  = drawMode && isEraserTool;
  const showFontSize    = drawMode && isTextTool;

  return (
    <div ref={boardRef} className="relative w-full h-full overflow-hidden">
      <DrawCanvas
        strokes={strokes}
        labels={labels}
        tool={activeTool}
        color={drawColor}
        brushSize={brushSize}
        eraserSize={eraserSize}
        fontSize={fontSize}
        active={drawMode}
        onStrokeEnd={addStroke}
        onErase={handleErase}
        onAddLabel={addLabel}
      />

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

        <div className="w-px h-5 bg-border2" />

        {/* Draw tools */}
        <ToolBtn label="pen"    icon="✏"  active={drawMode && activeTool === "pen"}    onClick={() => drawMode && activeTool === "pen"    ? exitDrawMode() : enterDrawMode("pen")} />
        <ToolBtn label="line"   icon="╱"  active={drawMode && activeTool === "line"}   onClick={() => drawMode && activeTool === "line"   ? exitDrawMode() : enterDrawMode("line")} />
        <ToolBtn label="circle" icon="○"  active={drawMode && activeTool === "circle"} onClick={() => drawMode && activeTool === "circle" ? exitDrawMode() : enterDrawMode("circle")} />
        <ToolBtn label="box"    icon="□"  active={drawMode && activeTool === "box"}    onClick={() => drawMode && activeTool === "box"    ? exitDrawMode() : enterDrawMode("box")} />
        <ToolBtn label="text"   icon="T"  active={drawMode && activeTool === "text"}   onClick={() => drawMode && activeTool === "text"   ? exitDrawMode() : enterDrawMode("text")} />
        <ToolBtn label="eraser" icon="◻"  active={drawMode && activeTool === "eraser"} onClick={() => drawMode && activeTool === "eraser" ? exitDrawMode() : enterDrawMode("eraser")} />

        {/* Draw options */}
        {drawMode && (
          <>
            <div className="w-px h-5 bg-border2" />

            {/* Color palette */}
            {showColorPicker && (
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

            {/* Brush size */}
            {showBrushSize && (
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

            {/* Eraser size */}
            {showEraserSize && (
              <div className="flex items-center gap-1 border border-border2 px-2 py-1.5">
                <span className="text-[9px] text-muted mr-1">size</span>
                {[12, 20, 36, 56].map(s => (
                  <button
                    key={s}
                    onClick={() => setEraserSize(s)}
                    className={`flex items-center justify-center transition-colors ${eraserSize === s ? "text-green" : "text-muted hover:text-tx"}`}
                    style={{ width: 18, height: 18 }}
                  >
                    <div className="rounded-full border border-current" style={{ width: Math.min(s / 3, 14), height: Math.min(s / 3, 14) }} />
                  </button>
                ))}
              </div>
            )}

            {/* Font size */}
            {showFontSize && (
              <div className="flex items-center gap-1.5 border border-border2 px-2 py-1.5">
                <span className="text-[9px] text-muted mr-1">size</span>
                {[10, 14, 20, 28].map(s => (
                  <button
                    key={s}
                    onClick={() => setFontSize(s)}
                    className={`font-mono transition-colors leading-none ${fontSize === s ? "text-green" : "text-muted hover:text-tx"}`}
                    style={{ fontSize: Math.max(8, s * 0.6) }}
                  >
                    A
                  </button>
                ))}
              </div>
            )}

            <div className="w-px h-5 bg-border2" />

            {/* Clear */}
            <button
              onClick={() => { setStrokes([]); setLabels([]); }}
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