import { useState, useRef, useCallback, useEffect } from "react";
import { generateSVG, downloadSVG, applyTheme, type ThemeColors, type ThemeEntry } from "../lib/themes";

// ── Constants ─────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function forkName(baseName: string, allThemes: ThemeEntry[]): string {
  const existing = new Set(allThemes.map(t => t.name));
  let i = 1;
  while (existing.has(`${baseName} (${i})`)) i++;
  return `${baseName} (${i})`;
}

function toSlug(display: string): string {
  return display.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ThemeModalProps {
  themes:           ThemeEntry[];
  categories:       Record<string, ThemeEntry[]>;
  activeTheme:      ThemeEntry;
  customThemes:     ThemeEntry[];
  onSelect:         (name: string) => void;
  onSaveNew:        (entry: ThemeEntry) => void;
  onRename:         (oldName: string, newDisplay: string) => void;
  onDelete:         (name: string) => void;
  onClose:          () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ThemeModal({
  themes, categories, activeTheme, customThemes,
  onSelect, onSaveNew, onRename, onDelete, onClose,
}: ThemeModalProps) {
  const [selected,    setSelected]    = useState(activeTheme.name);
  const [editColors,  setEditColors]  = useState<ThemeColors | null>(null);
  const [isRenaming,  setIsRenaming]  = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  const selectedEntry  = themes.find(t => t.name === selected) ?? activeTheme;
  const displayColors  = editColors ?? selectedEntry.colors;
  const isCustom       = !!customThemes.find(t => t.name === selected);
  const isDirty        = editColors !== null;

  // Live preview — apply draft or selected colors to page
  useEffect(() => {
    applyTheme(displayColors);
  }, [displayColors]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelect = (name: string) => {
    setSelected(name);
    setEditColors(null);
    setIsRenaming(false);
    onSelect(name);
  };

  const handleColorChange = useCallback((key: keyof ThemeColors, value: string) => {
    setEditColors(prev => ({
      ...(prev ?? selectedEntry.colors),
      [key]: value,
    }));
  }, [selectedEntry.colors]);

  const handleSaveFork = () => {
    if (!editColors) return;
    const baseDisplay = selectedEntry.display;
    const newDisplay  = forkName(baseDisplay, themes);
    const newName     = toSlug(newDisplay) + "-" + Date.now();
    const entry: ThemeEntry = {
      name:     newName,
      display:  newDisplay,
      category: "Custom",
      colors:   editColors,
      isCustom: true,
    };
    onSaveNew(entry);
    setSelected(newName);
    setEditColors(null);
  };

  const handleDiscard = () => setEditColors(null);

  const handleStartRename = () => {
    setRenameValue(selectedEntry.display);
    setIsRenaming(true);
    setTimeout(() => renameRef.current?.select(), 0);
  };

  const handleCommitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== selectedEntry.display) {
      onRename(selected, trimmed);
    }
    setIsRenaming(false);
  };

  const handleExport = () => {
    const svg = generateSVG(selectedEntry.name, displayColors);
    downloadSVG(`${selectedEntry.display}.svg`, svg);
  };

  const handleDelete = () => {
    if (!isCustom) return;
    onDelete(selected);
    setSelected("dark");
    onSelect("dark");
    setEditColors(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="bg-surface border border-border2 shadow-2xl font-mono flex flex-col"
      style={{ width: 520, maxHeight: "85vh" }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="text-[11px] tracking-[0.15em] uppercase text-tx">Theme Editor</span>
        <button onClick={onClose} className="text-muted hover:text-tx text-[18px] leading-none transition-colors">×</button>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

        {/* Theme selector */}
        <div>
          <label className="block text-[10px] text-muted tracking-[0.08em] mb-1.5">theme</label>
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

        {/* Name / rename row */}
        <div className="flex items-center justify-between gap-3">
          {isRenaming ? (
            <input
              ref={renameRef}
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={handleCommitRename}
              onKeyDown={e => {
                if (e.key === "Enter") handleCommitRename();
                if (e.key === "Escape") setIsRenaming(false);
              }}
              className="flex-1 bg-transparent border-b border-green text-[12px] text-tx outline-none font-mono pb-0.5"
              autoFocus
            />
          ) : (
            <span className="text-[12px] text-tx truncate">{selectedEntry.display}</span>
          )}

          {isCustom && !isRenaming && (
            <button
              onClick={handleStartRename}
              className="text-[10px] text-muted border border-border2 px-2 py-0.5 hover:text-tx hover:border-muted transition-colors shrink-0"
            >
              rename
            </button>
          )}
        </div>

        {/* Dirty banner */}
        {isDirty && (
          <div className="flex items-center justify-between border border-dashed border-green px-3 py-2">
            <span className="text-[10px] text-green tracking-[0.08em]">unsaved changes</span>
            <div className="flex gap-2">
              <button
                onClick={handleDiscard}
                className="text-[10px] text-muted border border-border2 px-2.5 py-0.5 hover:text-tx hover:border-muted transition-colors"
              >
                discard
              </button>
              <button
                onClick={handleSaveFork}
                className="text-[10px] text-black bg-green border border-green px-2.5 py-0.5 hover:opacity-90 transition-opacity font-medium"
              >
                save as fork
              </button>
            </div>
          </div>
        )}

        {/* Colour editor */}
        <div>
          <label className="block text-[10px] text-muted tracking-[0.08em] mb-2">
            colours <span className="text-dim">— click a swatch to edit</span>
          </label>

          {/* Preview strip */}
          <div
            className="w-full h-10 border border-border flex items-center justify-center mb-3 transition-colors"
            style={{ background: displayColors.background }}
          >
            <span className="text-[9px] tracking-widest transition-colors" style={{ color: displayColors.f_high }}>
              {selectedEntry.display}{isDirty ? " *" : ""}
            </span>
          </div>

          {/* Swatch grid */}
          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              {(["f_high", "f_med", "f_low", "f_inv"] as (keyof ThemeColors)[]).map(k => (
                <ColorSwatch key={k} colorKey={k} value={displayColors[k]} onChange={handleColorChange} />
              ))}
            </div>
            <div className="flex gap-1.5">
              {(["b_high", "b_med", "b_low", "b_inv"] as (keyof ThemeColors)[]).map(k => (
                <ColorSwatch key={k} colorKey={k} value={displayColors[k]} onChange={handleColorChange} />
              ))}
            </div>
          </div>

          {/* Hex list */}
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-x-3 gap-y-1.5">
            {COLOR_LABELS.map(({ key, label }) => (
              <HexRow key={key} colorKey={key} label={label} value={displayColors[key]} onChange={handleColorChange} />
            ))}
          </div>
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

// ── ColorSwatch ───────────────────────────────────────────────────────────────

function ColorSwatch({
  colorKey, value, onChange,
}: {
  colorKey: keyof ThemeColors;
  value:    string;
  onChange: (key: keyof ThemeColors, value: string) => void;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-1 group relative cursor-pointer" onClick={() => pickerRef.current?.click()}>
      <div
        className="w-full h-8 border border-border group-hover:border-green transition-colors"
        style={{ background: value }}
      />
      <div className="text-[8px] text-muted text-center mt-0.5 tracking-wide group-hover:text-tx transition-colors">
        {colorKey.replace("_", "·")}
      </div>
      <input
        ref={pickerRef}
        type="color"
        value={value}
        onChange={e => onChange(colorKey, e.target.value)}
        className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
}

// ── HexRow ────────────────────────────────────────────────────────────────────

function HexRow({
  colorKey, label, value, onChange,
}: {
  colorKey: keyof ThemeColors;
  label:    string;
  value:    string;
  onChange: (key: keyof ThemeColors, value: string) => void;
}) {
  const [editing,    setEditing]    = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const pickerRef = useRef<HTMLInputElement>(null);

  const commit = (raw: string) => {
    setEditing(false);
    const hex = raw.startsWith("#") ? raw : "#" + raw;
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) {
      onChange(colorKey, hex.toLowerCase());
    } else {
      setInputValue(value);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => pickerRef.current?.click()}
        className="w-3 h-3 border border-border shrink-0 hover:border-green transition-colors relative"
        style={{ background: value }}
        title="Pick colour"
      >
        <input
          ref={pickerRef}
          type="color"
          value={value}
          onChange={e => { onChange(colorKey, e.target.value); setInputValue(e.target.value); }}
          className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
          tabIndex={-1}
        />
      </button>
      <span className="text-[9px] text-muted truncate w-14">{label}</span>
      {editing ? (
        <input
          autoFocus
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onBlur={() => commit(inputValue)}
          onKeyDown={e => {
            if (e.key === "Enter") commit(inputValue);
            if (e.key === "Escape") { setInputValue(value); setEditing(false); }
          }}
          className="ml-auto text-[9px] text-tx bg-transparent border-b border-green outline-none font-mono w-16 text-right"
          spellCheck={false}
        />
      ) : (
        <button
          onClick={() => { setInputValue(value); setEditing(true); }}
          className="ml-auto text-[9px] text-dim hover:text-tx font-mono transition-colors"
          title="Edit hex"
        >
          {value}
        </button>
      )}
    </div>
  );
}