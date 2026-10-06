import { DEFAULT_TIMEZONE } from "./datetime";

interface TimezoneOption {
  value: string;
  label: string;
}

interface TimezoneGroup {
  region: string;
  zones: TimezoneOption[];
}

/**
 * Lista curada de zonas IANA para el selector del negocio. Se prioriza la zona por
 * defecto y la región local; el backend valida con ZoneId y guarda el id canónico.
 */
export const TIMEZONE_GROUPS: TimezoneGroup[] = [
  {
    region: "Argentina",
    zones: [
      "America/Argentina/Buenos_Aires",
      "America/Argentina/Cordoba",
      "America/Argentina/Mendoza",
      "America/Argentina/Salta",
      "America/Argentina/Jujuy",
      "America/Argentina/Tucuman",
      "America/Argentina/Catamarca",
      "America/Argentina/La_Rioja",
      "America/Argentina/San_Juan",
      "America/Argentina/San_Luis",
      "America/Argentina/Rio_Gallegos",
      "America/Argentina/Ushuaia",
    ].map((value) => ({ value, label: value })),
  },
  {
    region: "América Latina",
    zones: [
      "America/Montevideo",
      "America/Sao_Paulo",
      "America/Santiago",
      "America/Asuncion",
      "America/La_Paz",
      "America/Caracas",
      "America/Bogota",
      "America/Lima",
      "America/Guayaquil",
      "America/Mexico_City",
      "America/Cancun",
      "America/Panama",
      "America/Havana",
      "America/Santo_Domingo",
      "America/Puerto_Rico",
    ].map((value) => ({ value, label: value })),
  },
  {
    region: "Norteamérica",
    zones: [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Phoenix",
      "America/Los_Angeles",
      "America/Anchorage",
      "Pacific/Honolulu",
      "America/Toronto",
      "America/Vancouver",
      "America/Halifax",
    ].map((value) => ({ value, label: value })),
  },
  {
    region: "Europa",
    zones: [
      "Europe/London",
      "Europe/Lisbon",
      "Europe/Madrid",
      "Europe/Paris",
      "Europe/Brussels",
      "Europe/Amsterdam",
      "Europe/Berlin",
      "Europe/Zurich",
      "Europe/Vienna",
      "Europe/Rome",
      "Europe/Prague",
      "Europe/Warsaw",
      "Europe/Stockholm",
      "Europe/Oslo",
      "Europe/Copenhagen",
      "Europe/Helsinki",
      "Europe/Athens",
      "Europe/Istanbul",
      "Europe/Kyiv",
      "Europe/Moscow",
    ].map((value) => ({ value, label: value })),
  },
  {
    region: "África",
    zones: [
      "Africa/Casablanca",
      "Africa/Cairo",
      "Africa/Lagos",
      "Africa/Nairobi",
      "Africa/Johannesburg",
    ].map((value) => ({ value, label: value })),
  },
  {
    region: "Asia y Oceanía",
    zones: [
      "Asia/Jerusalem",
      "Asia/Dubai",
      "Asia/Karachi",
      "Asia/Kolkata",
      "Asia/Dhaka",
      "Asia/Bangkok",
      "Asia/Jakarta",
      "Asia/Singapore",
      "Asia/Hong_Kong",
      "Asia/Shanghai",
      "Asia/Taipei",
      "Asia/Seoul",
      "Asia/Tokyo",
      "Australia/Perth",
      "Australia/Brisbane",
      "Australia/Sydney",
      "Australia/Melbourne",
      "Pacific/Auckland",
    ].map((value) => ({ value, label: value })),
  },
  {
    region: "UTC",
    zones: [{ value: "UTC", label: "UTC" }],
  },
];

/** Lista plana de zonas válidas conocidas (incluye la zona por defecto). */
const TIMEZONE_VALUES: string[] = Array.from(
  new Set([DEFAULT_TIMEZONE, ...TIMEZONE_GROUPS.flatMap((g) => g.zones.map((z) => z.value))]),
);

/** true si la zona está en la lista curada (para el fallback del selector). */
export function isKnownTimezone(timezone?: string | null): boolean {
  return !!timezone && TIMEZONE_VALUES.includes(timezone);
}
