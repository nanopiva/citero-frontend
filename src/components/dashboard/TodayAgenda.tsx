"use client";

import { CalendarDotsIcon } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCurrentMinute } from "@/hooks/useCurrentMinute";
import { formatTimeInZone, wallClockToMs } from "@/lib/datetime";
import { clientDisplayName } from "@/lib/strings";
import type { AppointmentResponseDto } from "@/types";
import { Panel } from "./Panel";
import { statusMeta } from "./dashboardUtils";

export function TodayAgenda({
  appointments,
  emptyText = "No hay turnos programados para hoy.",
}: {
  appointments: AppointmentResponseDto[];
  emptyText?: string;
}) {
  const minute = useCurrentMinute();
  const now = minute * 60_000;
  const sorted = [...appointments].sort(
    (a, b) =>
      wallClockToMs(a.startTime, a.timezone) -
      wallClockToMs(b.startTime, b.timezone),
  );
  const nextId = sorted.find(
    (appointment) =>
      appointment.status === "CONFIRMED" &&
      wallClockToMs(appointment.startTime, appointment.timezone) >= now,
  )?.id;

  return (
    <Panel
      title="Agenda de hoy"
      icon={<CalendarDotsIcon className="h-5 w-5" weight="regular" />}
      bodyClassName="p-0"
    >
      {sorted.length === 0 ? (
        <EmptyState
          className="px-5 py-14"
          icon={<CalendarDotsIcon className="h-7 w-7" weight="regular" />}
          title={emptyText}
        />
      ) : (
        <ul className="divide-y divide-hairline">
          {sorted.map((appointment) => {
            const meta = statusMeta(appointment.status);
            const isNext = appointment.id === nextId;
            return (
              <li
                key={appointment.id}
                className="flex items-center gap-4 px-5 py-3.5"
              >
                <div
                  className={`flex h-11 w-14 shrink-0 items-center justify-center rounded-lg text-body-sm font-semibold ${
                    isNext
                      ? "bg-signal-blue text-paper"
                      : "bg-pebble text-ink-navy"
                  }`}
                >
                  {formatTimeInZone(
                    appointment.startTime,
                    appointment.timezone,
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 truncate text-body-sm font-semibold text-ink-navy">
                      {clientDisplayName(appointment.client)}
                    </p>
                    {isNext && (
                      <Badge variant="primary" className="shrink-0 py-0.5">
                        Próximo
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-caption text-slate-gray">
                    {appointment.service.name} · {appointment.staff.customName}
                  </p>
                </div>
                <Badge variant={meta.badge}>{meta.label}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
