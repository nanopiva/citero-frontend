function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

/** Barra de progreso simple (0–100). Reutilizable en KPIs y medidores. */
export function ProgressBar({
  value,
  className = "bg-signal-blue",
  trackClassName = "bg-pebble",
  height = "h-1.5",
}: {
  value: number;
  /** Color de relleno (clase bg-*). */
  className?: string;
  trackClassName?: string;
  height?: string;
}) {
  return (
    <div
      className={`w-full overflow-hidden rounded-full ${height} ${trackClassName}`}
      role="progressbar"
      aria-valuenow={Math.round(clamp(value))}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full ${className}`}
        style={{ width: `${clamp(value)}%` }}
      />
    </div>
  );
}
