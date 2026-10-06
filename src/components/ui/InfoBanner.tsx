import type { ReactNode } from "react";

/** Banner informativo con ícono, título, texto y acción opcional. */
export function InfoBanner({
  icon,
  title,
  text,
  action,
  className = "",
}: {
  icon?: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-3xl border border-accent-border bg-accent-soft p-5 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-signal-blue">
            {icon}
          </span>
        )}
        <div>
          <p className="text-body font-semibold text-ink-navy">{title}</p>
          <p className="mt-0.5 text-body-sm text-deep-cobalt/90">{text}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
