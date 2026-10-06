import { wallClockParts } from "@/lib/datetime";
import { capitalize } from "@/lib/strings";
import {
  STATUS_META,
  STATUS_ORDER,
  statusMeta,
  type StatusKey,
} from "@/lib/appointmentStatus";
import { DayOfWeek } from "@/types";
import type {
  AppointmentResponseDto,
  BusinessConfigResponseDto,
  BusinessScheduleResponseDto,
} from "@/types";

// Fuente única de estados (compartida con agenda y "Mis turnos").
export { STATUS_META, STATUS_ORDER, statusMeta };
export type { StatusKey };

export function countByStatus(appointments: AppointmentResponseDto[]) {
  const counts: Record<StatusKey, number> = {
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    NO_SHOW: 0,
  };
  for (const appointment of appointments) {
    if (appointment.status in counts) {
      counts[appointment.status as StatusKey] += 1;
    }
  }
  return counts;
}

export function todayLong(timeZone?: string | null): string {
  return capitalize(
    new Date().toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      ...(timeZone ? { timeZone } : {}),
    }),
  );
}

export function daysElapsedThisMonth(timeZone?: string | null): number {
  return wallClockParts(new Date(), timeZone).day;
}

const WEEKDAYS: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

export function todayDayOfWeek(timeZone?: string | null): DayOfWeek {
  const p = wallClockParts(new Date(), timeZone);
  const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  return WEEKDAYS[weekday];
}

/**
 * Considera "configurado" el horario cuando difiere del default de creación
 * (7 días abiertos, una sola franja [defaultOpening, defaultClosing]). Así el paso
 * de onboarding se completa sólo si el dueño ajustó días/horarios/franjas.
 */
export function isScheduleConfigured(
  schedules: BusinessScheduleResponseDto[],
  config: BusinessConfigResponseDto | null,
): boolean {
  if (!schedules || schedules.length === 0) return false;
  const open = (config?.defaultOpeningTime ?? "09:00:00").slice(0, 5);
  const close = (config?.defaultClosingTime ?? "18:00:00").slice(0, 5);
  const isDefault =
    schedules.length === 7 &&
    schedules.every(
      (day) =>
        !day.isClosed &&
        day.periods?.length === 1 &&
        day.periods[0].openTime.slice(0, 5) === open &&
        day.periods[0].closeTime.slice(0, 5) === close,
    );
  return !isDefault;
}
