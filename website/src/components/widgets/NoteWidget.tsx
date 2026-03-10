interface NoteWidgetProps {
  data:     Record<string, unknown>;
  onChange: (d: Record<string, unknown>) => void;
}

export function NoteWidget({ data, onChange }: NoteWidgetProps) {
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