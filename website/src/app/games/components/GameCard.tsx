import Link from "next/link";
import type { Game } from "../lib/gamesData";
import { STATUS_STYLES, STATUS_LABEL } from "../lib/gamesData";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const isSoon = game.status === "coming-soon";

  const inner = (
    <>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className={`text-[13px] text-tx tracking-tight leading-tight transition-colors
            ${!isSoon ? "group-hover:text-green" : ""}`}
        >
          {game.title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] text-muted border border-border2 px-1.5 py-0.5 leading-none">
            {game.players}
          </span>
          <span className={`text-[9px] border px-1.5 py-0.5 leading-none ${STATUS_STYLES[game.status]}`}>
            {STATUS_LABEL[game.status]}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-[10px] text-muted leading-relaxed mb-3 line-clamp-2">
        {game.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {game.tags.map(tag => (
          <span
            key={tag}
            className="text-[9px] text-dim tracking-[0.06em] border border-border px-1.5 py-0.5 leading-none"
          >
            {tag}
          </span>
        ))}
      </div>
    </>
  );

  const cardClass = `group block bg-surface border border-border2 p-4 transition-all duration-150 font-mono
    ${isSoon
      ? "opacity-50 cursor-not-allowed"
      : "hover:border-green hover:shadow-[0_0_0_1px_var(--green)] cursor-pointer"
    }`;

  if (isSoon) {
    return <div className={cardClass}>{inner}</div>;
  }

  return (
    <Link href={game.href} className={cardClass}>
      {inner}
    </Link>
  );
}