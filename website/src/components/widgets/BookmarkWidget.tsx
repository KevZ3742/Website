import { useState } from "react";

interface BookmarkWidgetProps {
  data:     Record<string, unknown>;
  onChange: (d: Record<string, unknown>) => void;
}

export function BookmarkWidget({ data, onChange }: BookmarkWidgetProps) {
  const [editing, setEditing] = useState(false);
  const url   = (data.url   as string) ?? "";
  const label = (data.label as string) ?? "";

  if (editing || !url) return (
    <div className="flex flex-col gap-2" onPointerDown={e => e.stopPropagation()}>
      <input
        value={label}
        onChange={e => onChange({ ...data, label: e.target.value })}
        placeholder="label"
        className="bg-transparent border-b border-border2 outline-none text-[11px] text-tx font-mono"
      />
      <input
        value={url}
        onChange={e => onChange({ ...data, url: e.target.value })}
        placeholder="https://..."
        className="bg-transparent border-b border-border2 outline-none text-[10px] text-muted font-mono"
      />
      <button onClick={() => setEditing(false)} className="text-[9px] text-green self-end">done</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-1 h-full justify-center" onPointerDown={e => e.stopPropagation()}>
      <a
        href={/^https?:\/\//i.test(url) ? url : `https://${url}`}
        target="_blank"
        rel="noreferrer"
        className="text-[13px] text-green hover:underline font-mono truncate"
      >{label || url}
      </a>
      <span className="text-[9px] text-muted truncate">{url}</span>
      <button onClick={() => setEditing(true)} className="text-[9px] text-muted hover:text-tx transition-colors self-start mt-1">
        edit
      </button>
    </div>
  );
}