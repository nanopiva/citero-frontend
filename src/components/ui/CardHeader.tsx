import type { ReactNode } from "react";

/** Encabezado de tarjeta con ícono, título y acción opcional (ej. contador). */
export function CardHeader({
  title,
  icon,
  action,
}: {
  title: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-hairline px-5 py-3.5">
      <h2 className="flex items-center gap-2 text-body font-semibold text-ink-navy">
        {icon && <span className="text-signal-blue">{icon}</span>}
        {title}
      </h2>
      {action}
    </div>
  );
}
