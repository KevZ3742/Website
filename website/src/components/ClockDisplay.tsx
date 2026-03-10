import type { Settings } from "../lib/settings";

const pad = (n: number) => String(n).padStart(2, "0");

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

interface ClockDisplayProps {
  now:        Date | null;
  timeFormat: Settings["timeFormat"];
}

export function ClockDisplay({ now, timeFormat }: ClockDisplayProps) {
  const h  = now ? (timeFormat === "24h" ? pad(now.getHours()) : String(now.getHours() % 12 || 12)) : "--";
  const m  = now ? pad(now.getMinutes()) : "--";
  const s  = now ? pad(now.getSeconds()) : "--";
  const ap = now ? (now.getHours() >= 12 ? "PM" : "AM") : "";

  return (
    <div className="text-center">
      <div className="text-[clamp(3rem,10vw,7rem)] font-light text-tx tracking-[-0.03em] leading-none tabular-nums">
        {h}<span className="text-dim mx-0.5">:</span>
        {m}<span className="text-dim mx-0.5">:</span>
        <span className="text-muted">{s}</span>
        {timeFormat === "12h" && now && (
          <span className="text-muted ml-2" style={{ fontSize: "0.35em" }}>{ap}</span>
        )}
      </div>
      <div className="mt-1.5 text-[11px] text-muted tracking-[0.12em] uppercase">
        {now ? formatDate(now) : ""}
      </div>
    </div>
  );
}