function uid() { return Math.random().toString(36).slice(2, 9); }

interface TodoItem {
  id:   string;
  text: string;
  done: boolean;
}

interface TodoWidgetProps {
  data:     Record<string, unknown>;
  onChange: (d: Record<string, unknown>) => void;
}

export function TodoWidget({ data, onChange }: TodoWidgetProps) {
  const items = (data.items as TodoItem[]) ?? [];
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
            <button
              onClick={() => toggle(item.id)}
              className={`w-3 h-3 border shrink-0 transition-colors ${item.done ? "bg-green border-green" : "border-border2"}`}
            />
            <input
              value={item.text}
              onChange={e => edit(item.id, e.target.value)}
              placeholder="task..."
              className={`flex-1 bg-transparent outline-none text-[10px] font-mono border-b border-transparent focus:border-border2 transition-colors ${item.done ? "line-through text-muted" : "text-tx"}`}
            />
            <button
              onClick={() => remove(item.id)}
              className="text-[9px] text-muted opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
            >×</button>
          </div>
        ))}
      </div>
    </div>
  );
}