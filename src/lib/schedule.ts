import {
  DayOfWeek,
  type BusinessScheduleResponseDto,
  type ScheduleExceptionResponseDto,
  type SchedulePeriodDto,
} from "@/types";

const DAY_KEYS: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

export function timeToMinutes(value: string): number {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function weekdayKey(dateStr: string): DayOfWeek {
  const [year, month, day] = dateStr.split("-").map(Number);
  return DAY_KEYS[new Date(year, month - 1, day).getDay()];
}

/** Une franjas adyacentes o solapadas en una sola (mismo criterio que el backend). */
export function mergePeriods(periods: SchedulePeriodDto[]): SchedulePeriodDto[] {
  const sorted = [...periods].sort(
    (a, b) => timeToMinutes(a.openTime) - timeToMinutes(b.openTime),
  );
  const merged: SchedulePeriodDto[] = [];
  for (const period of sorted) {
    const last = merged[merged.length - 1];
    if (last && timeToMinutes(period.openTime) <= timeToMinutes(last.closeTime)) {
      if (timeToMinutes(period.closeTime) > timeToMinutes(last.closeTime)) {
        last.closeTime = period.closeTime;
      }
    } else {
      merged.push({ ...period });
    }
  }
  return merged;
}

export function formatPeriod(period: SchedulePeriodDto): string {
  return `${period.openTime.slice(0, 5)} - ${period.closeTime.slice(0, 5)}`;
}

/** "09:00 - 12:00 y 17:00 - 20:00", uniendo adyacentes. */
export function formatPeriodsLabel(periods: SchedulePeriodDto[]): string {
  if (!periods || periods.length === 0) return "";
  return mergePeriods(periods).map(formatPeriod).join(" y ");
}

export interface DayBounds {
  open: number;
  close: number;
}

/** Rango mínimo/máximo (en minutos) abarcado por las franjas. */
export function periodsBounds(periods: SchedulePeriodDto[]): DayBounds | null {
  if (!periods || periods.length === 0) return null;
  let open = Infinity;
  let close = -Infinity;
  for (const period of periods) {
    open = Math.min(open, timeToMinutes(period.openTime));
    close = Math.max(close, timeToMinutes(period.closeTime));
  }
  return { open, close };
}

export interface ResolvedDay {
  closed: boolean;
  periods: SchedulePeriodDto[];
}

/**
 * Horario efectivo de una fecha: excepción puntual > regla semanal. Devuelve null
 * cuando no hay ninguna regla (el backend cae a los valores por defecto).
 */
export function resolveDaySchedule(
  dateStr: string,
  weekly: BusinessScheduleResponseDto[],
  exceptions: ScheduleExceptionResponseDto[],
): ResolvedDay | null {
  const exception = exceptions.find((item) => item.date === dateStr);
  if (exception) {
    return { closed: exception.isClosed, periods: exception.periods ?? [] };
  }
  const weeklyDay = weekly.find((item) => item.dayOfWeek === weekdayKey(dateStr));
  if (weeklyDay) {
    return { closed: weeklyDay.isClosed, periods: weeklyDay.periods ?? [] };
  }
  return null;
}
