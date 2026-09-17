"use client";

import { ClockCountdown } from "@phosphor-icons/react";
import { useCurrentMinute } from "@/hooks/useCurrentMinute";
import type { AppointmentResponseDto } from "@/types";
import { Panel } from "./Panel";
import { formatTime } from "./dashboardUtils";

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
        +new Date(appointment.startTime) >= now,
    )
    .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))[0];

  const minutesUntil = next
    ? Math.round((+new Date(next.startTime) - now) / 60_000)
    : 0;
  const whenLabel = !next
    ? ""
    : minutesUntil <= 0
      ? "Ahora"
      : minutesUntil <= 60
        ? `En ${minutesUntil} min`
        : `Hoy a las ${formatTime(next.startTime)} hs`;

  return (
    <Panel
      title="Próximo turno"
      icon={<ClockCountdown className="h-5 w-5" weight="regular" />}
    >
      {next ? (
        <div>
          <div className="flex items-baseline gap-2">
            <p className="text-subheading font-bold leading-none text-ink-navy">
              {formatTime(next.startTime)}
            </p>
            <span className="text-body-sm text-slate-gray">hs</span>
          </div>
          <p className="mt-3 truncate text-body-sm font-semibold text-ink-navy">
            {next.client.email}
          </p>
          <p className="mt-0.5 truncate text-body-sm text-slate-gray">
            {next.service.name}
          </p>
          <p className="mt-1 text-caption text-slate-gray">
            Con {next.staff.customName}
          </p>
          {whenLabel && (
            <span className="mt-4 inline-flex items-center rounded-badges bg-[#e6f0ff] px-2.5 py-1 text-caption font-medium text-deep-cobalt">
              {whenLabel}
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <ClockCountdown
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
