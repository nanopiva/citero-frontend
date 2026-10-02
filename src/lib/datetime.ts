/**
 * Utilidades para interpretar fechas/horas "de pared" (LocalDateTime sin offset,
 * ej. "2026-10-02T14:30:00") en la zona horaria del negocio y no en la del
 * navegador. Así las comparaciones contra "ahora" (próximo/pasado, canCancel)
 * coinciden con el backend, que guarda la hora local del negocio.
 */

const HAS_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i;

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
    // Zona inválida o no soportada: no rompemos la UI, usamos la del navegador.
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
