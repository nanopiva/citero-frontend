"use client";

import {
  CalendarDots,
  CheckCircle,
  ClockCountdown,
} from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/Button";
import { useCurrentMinute } from "@/hooks/useCurrentMinute";
import { wallClockToMs } from "@/lib/datetime";
import { ROUTES, type WorkspaceResponseDto } from "@/types";
import type { DashboardData } from "@/hooks/useDashboardData";
import { StatItem, StatsStrip } from "./StatItem";
import { TodayAgenda } from "./TodayAgenda";
import { NextAppointment } from "./NextAppointment";
import { DashboardSkeleton, ErrorPanel } from "./DashboardStates";
import { formatTime, todayLong } from "./dashboardUtils";

export function StaffDashboard({
  data,
  workspace,
}: {
  data: DashboardData;
  workspace: WorkspaceResponseDto;
}) {
  const { staffTodayAppointments, loading, error, refresh } = data;
  const minute = useCurrentMinute();

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorPanel message={error} onRetry={refresh} />;

  const now = minute * 60_000;
  const total = staffTodayAppointments.length;
  const completed = staffTodayAppointments.filter(
    (appointment) => appointment.status === "COMPLETED",
  ).length;
  const next = [...staffTodayAppointments]
    .filter(
      (appointment) =>
        appointment.status === "CONFIRMED" &&
        wallClockToMs(appointment.startTime, appointment.businessTimezone) >=
          now,
    )
    .sort(
      (a, b) =>
        wallClockToMs(a.startTime, a.businessTimezone) -
        wallClockToMs(b.startTime, b.businessTimezone),
    )[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-caption font-semibold uppercase tracking-wider text-signal-blue">
            {todayLong(workspace.timezone)}
          </p>
          <h1 className="mt-2 text-subheading font-bold leading-subheading text-ink-navy sm:text-heading-sm">
            Tu agenda de hoy
          </h1>
          <p className="mt-2 text-body-sm text-slate-gray">
            Estos son los turnos asignados a vos en {workspace.businessName}.
          </p>
        </div>
        <ButtonLink href={ROUTES.auth.agenda}>
          <CalendarDots className="h-4 w-4" weight="bold" />
          Abrir agenda
        </ButtonLink>
      </header>

      <StatsStrip columns={3}>
        <StatItem
          label="Turnos hoy"
          value={total}
          icon={<CalendarDots className="h-4 w-4" weight="bold" />}
          hint="Asignados a vos"
        />
        <StatItem
          label="Próximo turno"
          value={next ? formatTime(next.startTime) : "-"}
          icon={<ClockCountdown className="h-4 w-4" weight="bold" />}
          hint={next ? next.service.name : "Sin turnos pendientes"}
        />
        <StatItem
          label="Completados"
          value={completed}
          icon={<CheckCircle className="h-4 w-4" weight="bold" />}
          hint="De los turnos de hoy"
        />
      </StatsStrip>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <TodayAgenda
          appointments={staffTodayAppointments}
          emptyText="No tenés turnos programados para hoy."
        />
        <NextAppointment appointments={staffTodayAppointments} />
      </div>
    </div>
  );
}
