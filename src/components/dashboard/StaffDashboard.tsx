"use client";

import {
  CalendarDotsIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCurrentMinute } from "@/hooks/useCurrentMinute";
import { formatTimeInZone, wallClockToMs } from "@/lib/datetime";
import { ROUTES, type WorkspaceResponseDto } from "@/types";
import type { DashboardData } from "@/hooks/useDashboardData";
import { StatItem, StatsStrip } from "./StatItem";
import { TodayAgenda } from "./TodayAgenda";
import { NextAppointment } from "./NextAppointment";
import { DashboardSkeleton, ErrorPanel } from "./DashboardStates";
import { todayLong } from "./dashboardUtils";

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
        wallClockToMs(appointment.startTime, appointment.timezone) >=
          now,
    )
    .sort(
      (a, b) =>
        wallClockToMs(a.startTime, a.timezone) -
        wallClockToMs(b.startTime, b.timezone),
    )[0];

  return (
    <div className="space-y-6">
      <PageHeader
        section={todayLong(workspace.timezone)}
        title="Tu agenda de hoy"
        description={`Estos son los turnos asignados a vos en ${workspace.businessName}.`}
        action={
          <ButtonLink href={ROUTES.auth.agenda}>
            <CalendarDotsIcon className="h-4 w-4" weight="bold" />
            Abrir agenda
          </ButtonLink>
        }
      />

      <StatsStrip columns={3}>
        <StatItem
          label="Turnos hoy"
          value={total}
          icon={<CalendarDotsIcon className="h-4 w-4" weight="bold" />}
          hint="Asignados a vos"
        />
        <StatItem
          label="Próximo turno"
          value={next ? formatTimeInZone(next.startTime, next.timezone) : "-"}
          icon={<ClockCountdownIcon className="h-4 w-4" weight="bold" />}
          hint={next ? next.service.name : "Sin turnos pendientes"}
        />
        <StatItem
          label="Completados"
          value={completed}
          icon={<CheckCircleIcon className="h-4 w-4" weight="bold" />}
          hint="De los turnos de hoy"
        />
      </StatsStrip>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <TodayAgenda
          appointments={staffTodayAppointments}
          emptyText="No tenés turnos programados para hoy."
        />
        <NextAppointment appointments={staffTodayAppointments} />
      </div>
    </div>
  );
}
