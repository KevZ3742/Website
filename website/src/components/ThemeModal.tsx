import { useState } from "react";
import { generateSVG, downloadSVG, type ThemeColors, type ThemeEntry } from "../lib/themes";

const COLOR_LABELS: { key: keyof ThemeColors; label: string }[] = [
  { key: "background", label: "Background" },
  { key: "f_high",     label: "FG High"    },
  { key: "f_med",      label: "FG Med"     },
  { key: "f_low",      label: "FG Low"     },
  { key: "f_inv",      label: "FG Inv"     },
  { key: "b_high",     label: "BG High"    },
  { key: "b_med",      label: "BG Med"     },
  { key: "b_low",      label: "BG Low"     },
  { key: "b_inv",      label: "Accent"     },
];

interface ThemeModalProps {
  themes:       ThemeEntry[];
  categories:   Record<string, ThemeEntry[]>;
  activeTheme:  ThemeEntry;
  customThemes: ThemeEntry[];
  onSelect:     (name: string) => void;
  onDelete:     (name: string) => void;
  onClose:      () => void;
}

export function ThemeModal({
  themes, categories, activeTheme, customThemes, onSelect, onDelete, onClose,
}: ThemeModalProps) {
  const [selected, setSelected] = useState(activeTheme.name);
  const selectedEntry = themes.find(t => t.name === selected) ?? activeTheme;
  const isCustom = !!customThemes.find(t => t.name === selected);

  const handleSelect = (name: string) => { setSelected(name); onSelect(name); };

  const handleExport = () => {
    const svg = generateSVG(selectedEntry.name, selectedEntry.colors);
    downloadSVG(`${selectedEntry.name}.svg`, svg);
  };

  const handleDelete = () => {
    if (!isCustom) return;
    onDelete(selected);
    setSelected("dark");
    onSelect("dark");
  };

  return (
    <div
      className="bg-surface border border-border2 shadow-2xl font-mono flex flex-col"
      style={{ width: 480, maxHeight: "80vh" }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="text-[11px] tracking-[0.15em] uppercase text-tx">Theme Selector</span>
        <button onClick={onClose} className="text-muted hover:text-tx text-[18px] leading-none transition-colors">×</button>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

        {/* Current label */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted tracking-[0.08em]">current</span>
          <span className="text-[11px] text-tx">{selectedEntry.display}</span>
        </div>

        {/* Dropdown */}
        <div>
          <label className="block text-[10px] text-muted tracking-[0.08em] mb-1.5">select theme</label>
          <select
            value={selected}
            onChange={e => handleSelect(e.target.value)}
            className="w-full bg-surface border border-border2 text-[11px] text-tx px-3 py-2 font-mono outline-none focus:border-green transition-colors cursor-pointer"
          >
            {Object.entries(categories).map(([cat, ts]) => (
              <optgroup key={cat} label={cat}>
                {ts.map(t => (
                  <option key={t.name} value={t.name}>{t.display}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 text-[10px] tracking-[0.08em] border border-border2 px-3 py-1.5 text-muted hover:text-tx hover:border-muted transition-colors"
          >
            export svg
          </button>
          <button
            onClick={handleDelete}
            disabled={!isCustom}
            className={`flex-1 text-[10px] tracking-[0.08em] border px-3 py-1.5 transition-colors
              ${isCustom
                ? "border-red-900 text-red-500 hover:border-red-500 hover:text-red-400"
                : "border-border2 text-dim cursor-not-allowed"
              }`}
          >
            delete
          </button>
        </div>

        {/* Colour preview */}
        <div>
          <label className="block text-[10px] text-muted tracking-[0.08em] mb-2">colours</label>
          <div className="border border-border p-4 space-y-2">
            {/* Background strip */}
            <div
              className="w-full h-10 border border-border flex items-center justify-center mb-3"
              style={{ background: selectedEntry.colors.background }}
            >
              <span className="text-[9px] tracking-widest" style={{ color: selectedEntry.colors.f_high }}>
                {selectedEntry.display}
              </span>
            </div>

            {/* FG row */}
            <div className="flex gap-1.5">
              {(["f_high", "f_med", "f_low", "f_inv"] as (keyof ThemeColors)[]).map(k => (
                <div key={k} className="flex-1">
                  <div className="w-full h-6 border border-border" style={{ background: selectedEntry.colors[k] }} />
                  <div className="text-[8px] text-muted text-center mt-0.5 tracking-wide">
                    {k.replace("_", "·")}
                  </div>
                </div>
              ))}
            </div>

            {/* BG row */}
            <div className="flex gap-1.5">
              {(["b_high", "b_med", "b_low", "b_inv"] as (keyof ThemeColors)[]).map(k => (
                <div key={k} className="flex-1">
                  <div className="w-full h-6 border border-border" style={{ background: selectedEntry.colors[k] }} />
                  <div className="text-[8px] text-muted text-center mt-0.5 tracking-wide">
                    {k.replace("_", "·")}
                  </div>
                </div>
              ))}
            </div>

            {/* Hex grid */}
            <div className="pt-2 border-t border-border grid grid-cols-3 gap-x-3 gap-y-1">
              {COLOR_LABELS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 border border-border shrink-0"
                    style={{ background: selectedEntry.colors[key] }} />
                  <span className="text-[9px] text-muted truncate">{label}</span>
                  <span className="text-[9px] text-dim ml-auto font-mono">{selectedEntry.colors[key]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drop hint */}
        <div className="border border-dashed border-border p-3 text-center">
          <p className="text-[10px] text-muted tracking-[0.08em]">
            drop a <span className="text-tx">.svg</span> file anywhere to load a custom theme
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
        <button
          onClick={onClose}
          className="text-[10px] tracking-[0.08em] border border-green bg-green text-black px-5 py-1.5 hover:opacity-90 transition-opacity font-medium"
        >
          done
        </button>
      </div>
    </div>
  );
}