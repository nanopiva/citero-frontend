import {
  CalendarDotsIcon,
  ChartLineUpIcon,
  ClockCountdownIcon,
  CurrencyDollarIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES, type WorkspaceResponseDto } from "@/types";
import { wallClockParts } from "@/lib/datetime";
import type { DashboardData } from "@/hooks/useDashboardData";
import { StatItem, StatsStrip } from "./StatItem";
import { TodayAgenda } from "./TodayAgenda";
import { StatusBreakdown } from "./StatusBreakdown";
import { NextAppointment } from "./NextAppointment";
import { RevenuePanel } from "./RevenuePanel";
import { TopServices } from "./TopServices";
import { BlockedClientsBanner } from "./BlockedClientsBanner";
import { ConfigPanel } from "./ConfigPanel";
import { GettingStarted } from "./GettingStarted";
import { PublicBookingLink } from "@/components/ui/PublicBookingLink";
import { DashboardSkeleton, ErrorPanel } from "./DashboardStates";
import { formatCurrency } from "@/lib/currency";
import { isScheduleConfigured, todayLong } from "./dashboardUtils";

function greetingFor(timeZone?: string | null): string {
  const hour = wallClockParts(new Date(), timeZone).hours;
  if (hour < 12) return "Buen día";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

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
    servicesCount,
    staffCount,
    loading,
    error,
    refresh,
  } = data;

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorPanel message={error} onRetry={refresh} />;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        section={todayLong(workspace.timezone)}
        title={`${greetingFor(workspace.timezone)}, ${workspace.businessName}`}
        description="Así está tu negocio hoy."
        action={
          <ButtonLink href={ROUTES.auth.agenda}>
            <CalendarDotsIcon className="h-4 w-4" weight="bold" />
            Abrir agenda
          </ButtonLink>
        }
      />

      <GettingStarted
        servicesCount={servicesCount}
        staffCount={staffCount}
        scheduleConfigured={isScheduleConfigured(schedules, config)}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <TodayAgenda appointments={todayAppointments} />
        <div className="space-y-6">
          <NextAppointment appointments={todayAppointments} />
          <StatusBreakdown appointments={todayAppointments} />
        </div>
      </div>

      <StatsStrip>
        <StatItem
          label="Turnos hoy"
          value={stats.appointmentsToday ?? 0}
          icon={<CalendarDotsIcon className="h-4 w-4" weight="bold" />}
          hint={`${stats.appointmentsThisMonth ?? 0} este mes`}
        />
        <StatItem
          label="Pendientes"
          value={stats.appointmentsPending ?? 0}
          icon={<ClockCountdownIcon className="h-4 w-4" weight="bold" />}
          hint="Turnos por atender"
        />
        <StatItem
          label="Ingresos de hoy"
          value={formatCurrency(stats.estimatedRevenueToday)}
          icon={<CurrencyDollarIcon className="h-4 w-4" weight="bold" />}
          hint={`${formatCurrency(stats.estimatedRevenueThisMonth)} este mes`}
        />
        <StatItem
          label="Turnos vigentes"
          value={`${stats.occupancyRate ?? 0}%`}
          icon={<ChartLineUpIcon className="h-4 w-4" weight="bold" />}
          progress={stats.occupancyRate ?? 0}
          hint="Confirmados + completados del total de hoy"
        />
      </StatsStrip>

      <BlockedClientsBanner count={stats.blockedClientsCount ?? 0} />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <RevenuePanel stats={stats} timeZone={workspace.timezone} />
        <TopServices appointments={todayAppointments} />
        <ConfigPanel
          config={config}
          schedules={schedules}
          timeZone={workspace.timezone}
        />
      </div>

      <PublicBookingLink slug={workspace.slug} />
    </div>
  );
}
