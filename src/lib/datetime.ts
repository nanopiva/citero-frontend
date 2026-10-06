/**
 * Utilidades para interpretar fechas/horas "de pared" (LocalDateTime sin offset,
 * ej. "2026-10-02T14:30:00") en la zona horaria del negocio y no en la del
 * navegador. Así las comparaciones contra "ahora" (próximo/pasado, canCancel)
 * coinciden con el backend, que guarda la hora local del negocio.
 */

const HAS_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/** Zona por defecto de la app (misma que el backend, BusinessTime). */
export const DEFAULT_TIMEZONE = "America/Argentina/Buenos_Aires";

export interface WallClockParts {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const pad = (value: number) => String(value).padStart(2, "0");

function browserParts(date: Date): WallClockParts {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
  };
}

function partsInZone(date: Date, timeZone: string): WallClockParts {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = formatter.formatToParts(date);
    const get = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value ?? 0);
    return {
      year: get("year"),
      month: get("month"),
      day: get("day"),
      hours: get("hour"),
      minutes: get("minute"),
      seconds: get("second"),
    };
  } catch {
    // Zona inválida o no soportada: usamos la zona por defecto de la app
    // (coherente con el backend) en vez de la del navegador.
    if (timeZone !== DEFAULT_TIMEZONE) {
      return partsInZone(date, DEFAULT_TIMEZONE);
    }
    return browserParts(date);
  }
}

/**
 * Devuelve las partes de la hora de pared (año, mes, día, hora...) de un instante
 * en la zona indicada. Sin zona, usa la del navegador.
 */
export function wallClockParts(
  date: Date | number,
  timeZone?: string | null,
): WallClockParts {
  const asDate = typeof date === "number" ? new Date(date) : date;
  if (!timeZone) {
    return browserParts(asDate);
  }
  return partsInZone(asDate, timeZone);
}

/**
 * Convierte un datetime de pared interpretado en la zona indicada al instante
 * absoluto (epoch ms). Si no hay zona o el string ya trae offset, delega en Date.
 */
export function wallClockToMs(
  naive: string,
  timeZone?: string | null,
): number {
  if (!timeZone || HAS_OFFSET.test(naive)) {
    return new Date(naive).getTime();
  }

  const [datePart, timePart = "00:00:00"] = naive.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours = 0, minutes = 0, seconds = 0] = timePart.split(":").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hours, minutes, seconds);

  // Ajuste iterativo: el offset depende del instante, que depende del offset.
  let ts = utcGuess;
  for (let i = 0; i < 2; i += 1) {
    const p = partsInZone(new Date(ts), timeZone);
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hours, p.minutes, p.seconds);
    ts = utcGuess - (asUtc - ts);
  }
  return ts;
}

/** Fecha de hoy (YYYY-MM-DD) en la zona indicada. */
export function todayYMD(timeZone?: string | null): string {
  const p = wallClockParts(new Date(), timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/**
 * Minutos desde medianoche de una hora de pared. Acepta "HH:mm", "HH:mm:ss" o
 * un datetime completo "YYYY-MM-DDTHH:mm[:ss]".
 */
export function timeToMinutes(value: string): number {
  const timePart = value.includes("T") ? value.split("T")[1] : value;
  const [hours = 0, minutes = 0] = timePart.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Hora "HH:mm" de una hora de pared, sin convertir de zona horaria. */
export function formatHHmm(value: string): string {
  const total = timeToMinutes(value);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/**
 * Hora "HH:mm" de un instante en la zona del negocio. No depende de la zona del
 * navegador ni de que el backend emita fechas sin offset.
 */
export function formatTimeInZone(
  value: string,
  timeZone?: string | null,
): string {
  const parts = wallClockParts(new Date(wallClockToMs(value, timeZone)), timeZone);
  return `${pad(parts.hours)}:${pad(parts.minutes)}`;
}

/** Parte de fecha "YYYY-MM-DD" de un datetime de pared. */
export function wallClockDate(value: string): string {
  return value.split("T")[0];
}

/** Parsea "YYYY-MM-DD" como Date a medianoche local. */
export function parseYMDDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}
