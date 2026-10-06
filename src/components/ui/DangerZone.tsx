import type { ReactNode } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";

/** Sección destructiva (zona de peligro) con título, descripción y acción. */
export function DangerZone({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-danger-border bg-danger-soft/50 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger">
          <WarningCircleIcon className="h-5 w-5" weight="regular" />
        </span>
        <div>
          <h3 className="text-body font-semibold text-ink-navy">{title}</h3>
          <p className="mt-0.5 text-body-sm text-slate-gray">{description}</p>
        </div>
      </div>
      <div className="mt-4">{action}</div>
    </section>
  );
}
