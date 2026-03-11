import { useEffect, useRef, useState } from "react";
import type { Widget, Stroke, TextLabel } from "../components/BulletinBoard";

const STORAGE_KEY = "hpBulletinBoard";
const SAVE_DELAY_MS = 600;

interface BoardState {
  widgets: Widget[];
  strokes: Stroke[];
  labels:  TextLabel[];
}

const EMPTY: BoardState = { widgets: [], strokes: [], labels: [] };

function loadBoard(): BoardState {
  // Guard for SSR — localStorage is not available on the server
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BoardState>;
      return {
        widgets: parsed.widgets ?? [],
        strokes: parsed.strokes ?? [],
        labels:  parsed.labels  ?? [],
      };
    }
  } catch {}
  return EMPTY;
}

function saveBoard(state: BoardState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function useBulletinStorage() {
  // Lazy initializers run only on the client (useState(() => fn) is never
  // called during SSR), so this is safe and avoids the setState-in-effect problem.
  const [widgets, setWidgets] = useState<Widget[]>(() => loadBoard().widgets);
  const [strokes, setStrokes] = useState<Stroke[]>(() => loadBoard().strokes);
  const [labels,  setLabels]  = useState<TextLabel[]>(() => loadBoard().labels);

  const stateRef = useRef<BoardState>({ widgets, strokes, labels });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = { widgets, strokes, labels };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveBoard(stateRef.current), SAVE_DELAY_MS);
  }, [widgets, strokes, labels]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      saveBoard(stateRef.current);
    };
  }, []);

  return { widgets, setWidgets, strokes, setStrokes, labels, setLabels };
}