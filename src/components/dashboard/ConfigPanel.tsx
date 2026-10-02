import type { ReactNode } from "react";
import {
  BellRinging,
  Clock,
  GearSix,
  GlobeHemisphereWest,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/Button";
import { ReservationMode, ROUTES } from "@/types";
import type {
  BusinessConfigResponseDto,
  BusinessScheduleResponseDto,
} from "@/types";
import { Panel } from "./Panel";
import { formatPeriodsLabel } from "@/lib/schedule";
import { todayDayOfWeek } from "./dashboardUtils";

function ConfigRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <span className="flex items-center gap-2.5 text-body-sm text-slate-gray">
        <span className="text-signal-blue">{icon}</span>
        {label}
      </span>
      <span className="text-right text-body-sm font-medium text-ink-navy">
        {value}
      </span>
    </li>
  );
}

export function ConfigPanel({
  config,
  schedules,
  timeZone,
}: {
  config: BusinessConfigResponseDto | null;
  schedules: BusinessScheduleResponseDto[];
  timeZone?: string | null;
}) {
  const modeLabel =
    config?.reservationMode === ReservationMode.AUTHENTICATED
      ? "Verificado por OTP"
      : config?.reservationMode === ReservationMode.PUBLIC
        ? "Público"
        : "Sin definir";

  const todaySchedule = schedules.find(
    (schedule) => schedule.dayOfWeek === todayDayOfWeek(timeZone),
  );
  const hoursLabel = !todaySchedule
    ? "Sin horario"
    : todaySchedule.isClosed
      ? "Cerrado hoy"
      : formatPeriodsLabel(todaySchedule.periods) || "Sin horario";

  const remindersLabel = !config
    ? "Sin datos"
    : !config.enableReminders
      ? "Desactivados"
      : `${
          [
            config.reminder24hEnabled ? "24 h" : null,
            config.reminder2hEnabled ? "2 h" : null,
          ]
            .filter(Boolean)
            .join(" y ") || "Activos"
        } antes`;

  const cancellationLabel = !config
    ? "Sin datos"
    : config.cancellationToleranceHours === 0
      ? "Sin restricción"
      : `Hasta ${config.cancellationToleranceHours} h antes`;

  return (
    <Panel
      title="Configuración"
      icon={<GearSix className="h-5 w-5" weight="regular" />}
      action={
        <ButtonLink href={ROUTES.auth.configuracion} variant="ghost" size="sm">
          Editar
        </ButtonLink>
      }
    >
      <ul className="divide-y divide-hairline">
        <ConfigRow
          icon={<GlobeHemisphereWest className="h-4 w-4" weight="regular" />}
          label="Modo de reserva"
          value={modeLabel}
        />
        <ConfigRow
          icon={<Clock className="h-4 w-4" weight="regular" />}
          label="Horario de hoy"
          value={hoursLabel}
        />
        <ConfigRow
          icon={<BellRinging className="h-4 w-4" weight="regular" />}
          label="Recordatorios"
          value={remindersLabel}
        />
        <ConfigRow
          icon={<ShieldCheck className="h-4 w-4" weight="regular" />}
          label="Política de cancelación"
          value={cancellationLabel}
        />
      </ul>
    </Panel>
  );
}
