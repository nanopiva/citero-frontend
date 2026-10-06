import type { BadgeVariant } from "@/components/ui/Badge";

export type StatusKey = "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export const STATUS_ORDER: StatusKey[] = [
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export interface StatusMeta {
  label: string;
  badge: BadgeVariant;
  /** Color sólido para barras, puntos y acentos. */
  solid: string;
  /** Contenedor de bloque coloreado (agenda). */
  container: string;
  /** Badge claro sobre fondo de color (agenda). */
  softBadge: string;
}

/**
 * Fuente única de verdad de los estados de turno: etiqueta, variante de badge y
 * colores. Evita inconsistencias entre panel, agenda y "Mis turnos".
 */
export const STATUS_META: Record<StatusKey, StatusMeta> = {
  CONFIRMED: {
    label: "Confirmado",
    badge: "primary",
    solid: "bg-signal-blue",
    container: "border-accent-border bg-accent-soft text-ink-navy",
    softBadge: "bg-paper text-signal-blue",
  },
  COMPLETED: {
    label: "Completado",
    badge: "success",
    solid: "bg-success",
    container: "border-success/30 bg-success-soft text-success",
    softBadge: "bg-paper text-success",
  },
  CANCELLED: {
    label: "Cancelado",
    badge: "neutral",
    solid: "bg-mist-gray",
    container: "border-hairline bg-pebble text-slate-gray",
    softBadge: "bg-paper text-slate-gray",
  },
  NO_SHOW: {
    label: "No asistió",
    badge: "danger",
    solid: "bg-danger",
    container: "border-danger-border bg-danger-soft text-danger",
    softBadge: "bg-paper text-danger",
  },
};

export function statusMeta(status: string): StatusMeta {
  return (
    STATUS_META[status as StatusKey] ?? {
      label: status,
      badge: "neutral",
      solid: "bg-mist-gray",
      container: "border-hairline bg-pebble text-slate-gray",
      softBadge: "bg-paper text-slate-gray",
    }
  );
}
