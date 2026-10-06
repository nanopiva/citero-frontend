import type { ReactNode } from "react";

/**
 * Encabezado de página reutilizable: sección (eyebrow), título, descripción y
 * una acción opcional. Fija la escala tipográfica para todas las pantallas.
 */
export function PageHeader({
  section,
  title,
  description,
  action,
}: {
  section: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-caption font-semibold uppercase tracking-wider text-signal-blue">
          {section}
        </p>
        <h1 className="mt-2 text-subheading font-bold leading-subheading text-ink-navy sm:text-heading-sm">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-body-sm text-slate-gray">{description}</p>
        )}
      </div>
      {action}
    </header>
  );
}
