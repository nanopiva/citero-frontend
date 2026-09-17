import type { ReactNode } from "react";

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

export function StatsStrip({
  children,
  columns = 4,
}: {
  children: ReactNode;
  columns?: 3 | 4;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline shadow-sm ${
        columns === 4 ? "lg:grid-cols-4" : "sm:grid-cols-3"
      }`}
    >
      {children}
    </div>
  );
}

export function StatItem({
  label,
  value,
  icon,
  hint,
  progress,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  hint?: string;
  progress?: number;
}) {
  return (
    <div className="bg-paper px-5 py-5 sm:px-6">
      <div className="flex items-center gap-2">
        <span className="text-signal-blue">{icon}</span>
        <p className="text-body-sm font-medium text-slate-gray">{label}</p>
      </div>
      <p className="mt-3 text-subheading font-bold leading-none text-ink-navy">
        {value}
      </p>
      {typeof progress === "number" && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-pebble">
          <div
            className="h-full rounded-full bg-signal-blue"
            style={{ width: `${clampPercent(progress)}%` }}
          />
        </div>
      )}
      {hint && <p className="mt-2 text-caption text-slate-gray">{hint}</p>}
    </div>
  );
}
