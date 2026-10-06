import type { ReactNode } from "react";

/**
 * Estado vacío reutilizable: ícono, título, descripción y acción opcional.
 * Unifica el look de los "no hay nada" en todo el sitio.
 */
export function EmptyState({
  icon,
  title,
  text,
  action,
  className = "",
}: {
  icon?: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-14 text-center ${className}`}
    >
      {icon && (
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pebble text-slate-gray">
          {icon}
        </span>
      )}
      <h3 className="mt-5 text-body-lg font-semibold text-ink-navy">{title}</h3>
      {text && (
        <p className="mt-2 max-w-sm text-body-sm text-slate-gray">{text}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
