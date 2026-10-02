import { CurrencyDollar } from "@phosphor-icons/react/dist/ssr";
import type { DashboardStatsDto } from "@/types";
import { Panel } from "./Panel";
import { daysElapsedThisMonth, formatCurrency } from "./dashboardUtils";

export function RevenuePanel({
  stats,
  timeZone,
}: {
  stats: DashboardStatsDto;
  timeZone?: string | null;
}) {
  const today = stats.estimatedRevenueToday ?? 0;
  const month = stats.estimatedRevenueThisMonth ?? 0;
  const elapsed = Math.max(1, daysElapsedThisMonth(timeZone));
  const average = month / elapsed;
  const ratio = average > 0 ? Math.round((today / average) * 100) : 0;

  return (
    <Panel
      title="Ingresos"
      icon={<CurrencyDollar className="h-5 w-5" weight="regular" />}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-caption text-slate-gray">Hoy</p>
          <p className="mt-1 text-subheading font-bold leading-none text-ink-navy">
            {formatCurrency(today)}
          </p>
        </div>
        <div>
          <p className="text-caption text-slate-gray">Este mes</p>
          <p className="mt-1 text-subheading font-bold leading-none text-ink-navy">
            {formatCurrency(month)}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-hairline pt-4">
        <div className="flex items-center justify-between gap-3 text-body-sm">
          <span className="text-slate-gray">Promedio diario del mes</span>
          <span className="font-semibold text-ink-navy">
            {formatCurrency(average)}
          </span>
        </div>
        {average > 0 && (
          <>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-pebble">
              <div
                className="h-full rounded-full bg-signal-blue"
                style={{ width: `${Math.min(100, ratio)}%` }}
              />
            </div>
            <p className="mt-2 text-caption text-slate-gray">
              Hoy estás al {ratio}% del promedio diario.
            </p>
          </>
        )}
      </div>
    </Panel>
  );
}
