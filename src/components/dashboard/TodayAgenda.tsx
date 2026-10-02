"use client";

import { ArrowRight, CalendarDots } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { useCurrentMinute } from "@/hooks/useCurrentMinute";
import { wallClockToMs } from "@/lib/datetime";
import { ROUTES } from "@/types";
import type { AppointmentResponseDto } from "@/types";
import { Panel } from "./Panel";
import { formatTime, statusMeta } from "./dashboardUtils";

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
      wallClockToMs(a.startTime, a.businessTimezone) -
      wallClockToMs(b.startTime, b.businessTimezone),
  );
  const nextId = sorted.find(
    (appointment) =>
      appointment.status === "CONFIRMED" &&
      wallClockToMs(appointment.startTime, appointment.businessTimezone) >= now,
  )?.id;

  return (
    <Panel
      title="Agenda de hoy"
      icon={<CalendarDots className="h-5 w-5" weight="regular" />}
      action={
        <ButtonLink href={ROUTES.auth.agenda} variant="ghost" size="sm">
          Ver agenda
          <ArrowRight className="h-4 w-4" weight="bold" />
        </ButtonLink>
      }
      bodyClassName="p-0"
    >
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
          <CalendarDots className="h-7 w-7 text-mist-gray" weight="regular" />
          <p className="max-w-xs text-body-sm text-slate-gray">{emptyText}</p>
        </div>
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
                  {formatTime(appointment.startTime)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-body-sm font-semibold text-ink-navy">
                      {appointment.client.email}
                    </p>
                    {isNext && (
                      <span className="shrink-0 rounded-badges bg-[#e6f0ff] px-2 py-0.5 text-caption font-medium text-deep-cobalt">
                        Próximo
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-caption text-slate-gray">
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
