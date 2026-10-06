import type { ReactNode } from "react";
import {
  CalendarCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/currency";
import type { ServiceResponseDto } from "@/types";

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wider text-slate-gray">
        <span className="text-slate-gray">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 text-body-sm font-medium text-ink-navy">{value}</dd>
    </div>
  );
}

export function BookingSummary({
  service,
  weekday,
  dateLong,
  timeLabel,
  staffName,
}: {
  service: ServiceResponseDto;
  weekday: string;
  dateLong: string;
  timeLabel: string;
  staffName: string | null;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-signal-blue">
          <CalendarCheckIcon className="h-6 w-6" weight="regular" />
        </span>
        <div>
          <h2 className="text-body font-semibold text-ink-navy">
            Resumen del turno
          </h2>
          <p className="text-caption text-slate-gray">
            Revisá los datos antes de confirmar.
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4 rounded-xl bg-cloud p-4">
        <div className="flex w-20 shrink-0 flex-col items-center rounded-lg bg-pebble px-3 py-2 text-center">
          <span className="text-caption font-semibold uppercase tracking-wider text-slate-gray">
            {weekday}
          </span>
          <span className="mt-0.5 text-body-sm font-semibold text-signal-blue">
            {timeLabel} hs
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-body font-semibold text-ink-navy">
            {service.name}
          </p>
          <p className="mt-0.5 text-body-sm text-slate-gray">
            {service.durationMinutes} min
          </p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-hairline pt-5 sm:grid-cols-4">
        <SummaryItem
          icon={<CalendarCheckIcon className="h-3.5 w-3.5" weight="bold" />}
          label="Fecha"
          value={dateLong}
        />
        <SummaryItem
          icon={<ClockIcon className="h-3.5 w-3.5" weight="bold" />}
          label="Hora"
          value={`${timeLabel} hs`}
        />
        <SummaryItem
          icon={<ClockIcon className="h-3.5 w-3.5" weight="bold" />}
          label="Duración"
          value={`${service.durationMinutes} min`}
        />
        <SummaryItem
          icon={<CurrencyDollarIcon className="h-3.5 w-3.5" weight="bold" />}
          label="Precio"
          value={formatCurrency(service.price)}
        />
      </dl>

      {staffName && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-pebble px-3 py-2 text-body-sm text-ink-navy">
          <UsersThreeIcon
            className="h-4 w-4 shrink-0 text-signal-blue"
            weight="regular"
          />
          <span>
            Profesional:{" "}
            <strong className="font-semibold">{staffName}</strong>
          </span>
        </div>
      )}
    </Card>
  );
}
