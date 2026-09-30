import {
  CalendarDots,
  ChartLineUp,
  ClockCountdown,
  CurrencyDollar,
} from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/Button";
import { ROUTES, type WorkspaceResponseDto } from "@/types";
import type { DashboardData } from "@/hooks/useDashboardData";
import { StatItem, StatsStrip } from "./StatItem";
import { TodayAgenda } from "./TodayAgenda";
import { StatusBreakdown } from "./StatusBreakdown";
import { NextAppointment } from "./NextAppointment";
import { RevenuePanel } from "./RevenuePanel";
import { TopServices } from "./TopServices";
import { ConfigPanel } from "./ConfigPanel";
import { PublicBookingLink } from "@/components/ui/PublicBookingLink";
import { DashboardSkeleton, ErrorPanel } from "./DashboardStates";
import { formatCurrency, todayLong } from "./dashboardUtils";

export function OwnerDashboard({
  data,
  workspace,
}: {
  data: DashboardData;
  workspace: WorkspaceResponseDto;
}) {
  const {
    stats,
    todayAppointments,
    config,
    schedules,
    loading,
    error,
    refresh,
  } = data;

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorPanel message={error} onRetry={refresh} />;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-caption font-semibold uppercase tracking-wider text-signal-blue">
            {todayLong()}
          </p>
          <h1 className="mt-2 text-subheading font-bold leading-subheading text-ink-navy sm:text-heading-sm">
            Resumen de {workspace.businessName}
          </h1>
          <p className="mt-2 text-body-sm text-slate-gray">
            Así está la agenda de tu negocio hoy.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href={ROUTES.auth.agenda}>
            <CalendarDots className="h-4 w-4" weight="bold" />
            Abrir agenda
          </ButtonLink>
        </div>
      </header>

      <PublicBookingLink slug={workspace.slug} />

      <StatsStrip>
        <StatItem
          label="Turnos hoy"
          value={stats.appointmentsToday ?? 0}
          icon={<CalendarDots className="h-4 w-4" weight="bold" />}
          hint={`${stats.appointmentsThisMonth ?? 0} este mes`}
        />
        <StatItem
          label="Pendientes"
          value={stats.appointmentsPending ?? 0}
          icon={<ClockCountdown className="h-4 w-4" weight="bold" />}
          hint="Turnos por atender"
        />
        <StatItem
          label="Ingresos de hoy"
          value={formatCurrency(stats.estimatedRevenueToday)}
          icon={<CurrencyDollar className="h-4 w-4" weight="bold" />}
          hint={`${formatCurrency(stats.estimatedRevenueThisMonth)} este mes`}
        />
        <StatItem
          label="Ocupación"
          value={`${stats.occupancyRate ?? 0}%`}
          icon={<ChartLineUp className="h-4 w-4" weight="bold" />}
          progress={stats.occupancyRate ?? 0}
          hint="De la capacidad de hoy"
        />
      </StatsStrip>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <TodayAgenda appointments={todayAppointments} />
        <div className="space-y-6">
          <NextAppointment appointments={todayAppointments} />
          <StatusBreakdown appointments={todayAppointments} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <RevenuePanel stats={stats} />
        <TopServices appointments={todayAppointments} />
        <ConfigPanel config={config} schedules={schedules} />
      </div>
    </div>
  );
}
