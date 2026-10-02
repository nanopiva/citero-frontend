import type { BadgeVariant } from "@/components/ui/Badge";
import { wallClockParts } from "@/lib/datetime";
import { DayOfWeek } from "@/types";
import type { AppointmentResponseDto } from "@/types";

export type StatusKey = "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export const STATUS_ORDER: StatusKey[] = [
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export const STATUS_META: Record<
  StatusKey,
  { label: string; badge: BadgeVariant; bar: string; dot: string }
> = {
  CONFIRMED: {
    label: "Confirmados",
    badge: "primary",
    bar: "bg-signal-blue",
    dot: "bg-signal-blue",
  },
  COMPLETED: {
    label: "Completados",
    badge: "primary",
    bar: "bg-[#004eba]",
    dot: "bg-[#004eba]",
  },
  CANCELLED: {
    label: "Cancelados",
    badge: "neutral",
    bar: "bg-mist-gray",
    dot: "bg-mist-gray",
  },
  NO_SHOW: {
    label: "No asistió",
    badge: "danger",
    bar: "bg-red-400",
    dot: "bg-red-400",
  },
};

export function statusMeta(status: string) {
  return (
    STATUS_META[status as StatusKey] ?? {
      label: status,
      badge: "neutral" as BadgeVariant,
      bar: "bg-mist-gray",
      dot: "bg-mist-gray",
    }
  );
}

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

export function formatCurrency(value: number | null | undefined): string {
  return `$${(value ?? 0).toLocaleString("es-AR", {
    maximumFractionDigits: 0,
  })}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
