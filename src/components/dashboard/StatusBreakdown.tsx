import { ChartBarIcon } from "@phosphor-icons/react/dist/ssr";
import type { AppointmentResponseDto } from "@/types";
import { Panel } from "./Panel";
import { countByStatus, STATUS_META, STATUS_ORDER } from "./dashboardUtils";

export function StatusBreakdown({
  appointments,
}: {
  appointments: AppointmentResponseDto[];
}) {
  const counts = countByStatus(appointments);
  const total = appointments.length;

  return (
    <Panel
      title="Estado de hoy"
      icon={<ChartBarIcon className="h-5 w-5" weight="regular" />}
    >
      {total === 0 ? (
        <p className="py-4 text-center text-body-sm text-slate-gray">
          Todavía no hay turnos para analizar.
        </p>
      ) : (
        <>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-pebble">
            {STATUS_ORDER.map((key) => {
              const percent = (counts[key] / total) * 100;
              if (percent === 0) return null;
              return (
                <div
                  key={key}
                  className={STATUS_META[key].solid}
                  style={{ width: `${percent}%` }}
                />
              );
            })}
          </div>

          <ul className="mt-4 space-y-2.5">
            {STATUS_ORDER.map((key) => (
              <li
                key={key}
                className="flex items-center justify-between gap-3 text-body-sm"
              >
                <span className="flex items-center gap-2 text-slate-gray">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${STATUS_META[key].solid}`}
                  />
                  {STATUS_META[key].label}
                </span>
                <span className="font-semibold text-ink-navy">
                  {counts[key]}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}
