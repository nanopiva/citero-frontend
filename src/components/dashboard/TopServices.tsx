import { ScissorsIcon } from "@phosphor-icons/react/dist/ssr";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { AppointmentResponseDto } from "@/types";
import { Panel } from "./Panel";

export function TopServices({
  appointments,
}: {
  appointments: AppointmentResponseDto[];
}) {
  const counts = new Map<string, number>();
  for (const appointment of appointments) {
    if (appointment.status === "CANCELLED") continue;
    const name = appointment.service.name;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = rows[0]?.[1] ?? 1;

  return (
    <Panel
      title="Servicios más pedidos"
      icon={<ScissorsIcon className="h-5 w-5" weight="regular" />}
    >
      {rows.length === 0 ? (
        <p className="py-6 text-center text-body-sm text-slate-gray">
          Todavía no hay turnos para hoy.
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map(([name, count]) => (
            <li key={name}>
              <div className="flex items-center justify-between gap-3 text-body-sm">
                <span className="truncate text-ink-navy">{name}</span>
                <span className="shrink-0 font-semibold text-ink-navy">
                  {count}
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar value={(count / max) * 100} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
