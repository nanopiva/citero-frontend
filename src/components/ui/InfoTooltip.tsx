import { QuestionIcon } from "@phosphor-icons/react";

export function InfoTooltip({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={`group relative inline-flex align-middle ${className}`}>
      <button
        type="button"
        aria-label="Más información"
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-pebble text-slate-gray transition-colors hover:bg-accent-hover hover:text-signal-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue/30"
      >
        <QuestionIcon className="h-3 w-3" weight="bold" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-52 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg bg-ink-navy px-3 py-2 text-left text-caption leading-snug text-paper opacity-0 shadow-sm-3 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
