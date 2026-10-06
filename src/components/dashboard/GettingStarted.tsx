"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { ROUTES } from "@/types";

/**
 * Guía de primeros pasos para negocios nuevos. Se oculta cuando todo está hecho.
 */
export function GettingStarted({
  servicesCount,
  staffCount,
  scheduleConfigured,
}: {
  servicesCount: number;
  staffCount: number;
  scheduleConfigured: boolean;
}) {
  const steps = [
    {
      label: "Cargá al menos un servicio",
      done: servicesCount > 0,
      href: ROUTES.auth.servicios,
    },
    {
      label: "Sumá a tu equipo",
      done: staffCount > 0,
      href: ROUTES.auth.staff,
    },
    {
      label: "Configurá tus horarios de atención",
      done: scheduleConfigured,
      href: `${ROUTES.auth.configuracion}?tab=horarios`,
    },
  ];
  const completed = steps.filter((step) => step.done).length;
  if (completed === steps.length) return null;

  return (
    <Card className="border-accent-border bg-accent-soft/40">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-body-lg font-semibold text-ink-navy">
            Primeros pasos
          </h2>
          <p className="mt-0.5 text-body-sm text-slate-gray">
            Completá esto para dejar tu negocio listo.
          </p>
        </div>
        <span className="shrink-0 text-caption font-semibold text-deep-cobalt">
          {completed}/{steps.length}
        </span>
      </div>

      <ol className="mt-4 space-y-2">
        {steps.map((step, index) => (
          <li
            key={step.label}
            className="flex items-center gap-3 rounded-xl border border-hairline bg-paper px-4 py-3"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption font-semibold ${
                step.done
                  ? "bg-success text-paper"
                  : "bg-pebble text-slate-gray"
              }`}
            >
              {step.done ? (
                <CheckIcon className="h-3.5 w-3.5" weight="bold" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={`flex-1 text-body-sm ${
                step.done
                  ? "text-slate-gray line-through"
                  : "font-medium text-ink-navy"
              }`}
            >
              {step.label}
            </span>
            {!step.done && (
              <ButtonLink href={step.href} variant="outline" size="sm">
                Ir
              </ButtonLink>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}
