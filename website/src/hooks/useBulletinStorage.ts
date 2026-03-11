import { useEffect, useReducer, useRef } from "react";
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

type Action =
  | { type: "load"; payload: BoardState }
  | { type: "setWidgets"; payload: Widget[] | ((prev: Widget[]) => Widget[]) }
  | { type: "setStrokes"; payload: Stroke[] | ((prev: Stroke[]) => Stroke[]) }
  | { type: "setLabels";  payload: TextLabel[] | ((prev: TextLabel[]) => TextLabel[]) };

function reducer(state: BoardState, action: Action): BoardState {
  switch (action.type) {
    case "load":
      return action.payload;
    case "setWidgets":
      return { ...state, widgets: typeof action.payload === "function" ? action.payload(state.widgets) : action.payload };
    case "setStrokes":
      return { ...state, strokes: typeof action.payload === "function" ? action.payload(state.strokes) : action.payload };
    case "setLabels":
      return { ...state, labels:  typeof action.payload === "function" ? action.payload(state.labels)  : action.payload };
  }
}

export function useBulletinStorage() {
  const [state, dispatch] = useReducer(reducer, EMPTY);

  // Single dispatch after hydration — avoids multiple synchronous setState calls in an effect
  useEffect(() => {
    dispatch({ type: "load", payload: loadBoard() });
  }, []);

  const stateRef = useRef<BoardState>(state);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = state;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveBoard(stateRef.current), SAVE_DELAY_MS);
  }, [state]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      saveBoard(stateRef.current);
    };
  }, []);

  const setWidgets = (payload: Widget[] | ((prev: Widget[]) => Widget[])) =>
    dispatch({ type: "setWidgets", payload });
  const setStrokes = (payload: Stroke[] | ((prev: Stroke[]) => Stroke[])) =>
    dispatch({ type: "setStrokes", payload });
  const setLabels  = (payload: TextLabel[] | ((prev: TextLabel[]) => TextLabel[])) =>
    dispatch({ type: "setLabels",  payload });

  return {
    widgets: state.widgets, setWidgets,
    strokes: state.strokes, setStrokes,
    labels:  state.labels,  setLabels,
  };
}