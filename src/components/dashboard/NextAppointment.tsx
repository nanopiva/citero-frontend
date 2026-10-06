"use client";

import { ClockCountdownIcon } from "@phosphor-icons/react";
import { useCurrentMinute } from "@/hooks/useCurrentMinute";
import { Badge } from "@/components/ui/Badge";
import { formatTimeInZone, wallClockToMs } from "@/lib/datetime";
import { clientDisplayName } from "@/lib/strings";
import type { AppointmentResponseDto } from "@/types";
import { Panel } from "./Panel";

export function NextAppointment({
  appointments,
}: {
  appointments: AppointmentResponseDto[];
}) {
  const minute = useCurrentMinute();
  const now = minute * 60_000;

  const next = [...appointments]
    .filter(
      (appointment) =>
        appointment.status === "CONFIRMED" &&
        wallClockToMs(appointment.startTime, appointment.timezone) >=
          now,
    )
    .sort(
      (a, b) =>
        wallClockToMs(a.startTime, a.timezone) -
        wallClockToMs(b.startTime, b.timezone),
    )[0];

  const minutesUntil = next
    ? Math.round(
        (wallClockToMs(next.startTime, next.timezone) - now) / 60_000,
      )
    : 0;
  const whenLabel = !next
    ? ""
    : minutesUntil <= 0
      ? "Ahora"
      : minutesUntil <= 60
        ? `En ${minutesUntil} min`
        : `Hoy a las ${formatTimeInZone(next.startTime, next.timezone)} hs`;

  return (
    <Panel
      title="Próximo turno"
      icon={<ClockCountdownIcon className="h-5 w-5" weight="regular" />}
    >
      {next ? (
        <div>
          <div className="flex items-baseline gap-2">
            <p className="text-subheading font-bold leading-none text-ink-navy">
              {formatTimeInZone(next.startTime, next.timezone)}
            </p>
            <span className="text-body-sm text-slate-gray">hs</span>
          </div>
          <p className="mt-3 truncate text-body-sm font-semibold text-ink-navy">
            {clientDisplayName(next.client)}
          </p>
          <p className="mt-0.5 truncate text-body-sm text-slate-gray">
            {next.service.name}
          </p>
          <p className="mt-1 text-caption text-slate-gray">
            Con {next.staff.customName}
          </p>
          {whenLabel && (
            <Badge variant="primary" className="mt-4">
              {whenLabel}
            </Badge>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <ClockCountdownIcon
            className="h-7 w-7 text-mist-gray"
            weight="regular"
          />
          <p className="text-body-sm text-slate-gray">
            No hay más turnos confirmados por hoy.
          </p>
        </div>
      )}
    </Panel>
  );
}
