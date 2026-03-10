// ── SettingRow ────────────────────────────────────────────────────────────────

export function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3.5 last:mb-0">
      <span className="text-[11px] text-tx tracking-[0.04em]">{label}</span>
      <div className="flex gap-0.5">{children}</div>
    </div>
  );
}

// ── SettingOpt ────────────────────────────────────────────────────────────────

export function SettingOpt({
  active, onClick, children,
}: {
  active:   boolean;
  onClick:  () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] tracking-[0.06em] px-2 py-0.5 border font-mono transition-all
        ${active
          ? "bg-green text-black border-green font-medium"
          : "bg-transparent text-muted border-border2 hover:text-tx hover:border-muted"
        }`}
    >
      {children}
    </button>
  );
}