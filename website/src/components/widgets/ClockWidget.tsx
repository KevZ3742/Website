import { useEffect, useState } from "react";

function pad(n: number) { return String(n).padStart(2, "0"); }

function formatTime(d: Date, fmt: "24h" | "12h") {
  const h = fmt === "24h" ? pad(d.getHours()) : String(d.getHours() % 12 || 12);
  return `${h}:${pad(d.getMinutes())}`;
}

interface ClockWidgetProps {
  timeFormat: "24h" | "12h";
}

export function ClockWidget({ timeFormat }: ClockWidgetProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <span className="text-[2rem] font-light text-tx tabular-nums leading-none">
        {formatTime(now, timeFormat)}
      </span>
      <span className="text-[9px] text-muted mt-1 tracking-widest uppercase">
        {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
      </span>
    </div>
  );
}