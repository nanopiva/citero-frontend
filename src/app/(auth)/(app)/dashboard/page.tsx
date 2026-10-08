"use client";

import { StorefrontIcon } from "@phosphor-icons/react";
import { useBusiness } from "@/context/BusinessContext";
import { WorkspaceRole, ROUTES } from "@/types";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useHydrated } from "@/hooks/useHydrated";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardSkeleton } from "@/components/dashboard/DashboardStates";
import { OwnerDashboard } from "@/components/dashboard/OwnerDashboard";
import { StaffDashboard } from "@/components/dashboard/StaffDashboard";

function NoWorkspace() {
  const { workspaces, setActiveWorkspace } = useBusiness();

  if (workspaces.length === 0) {
    return (
      <EmptyState
        className="py-24"
        icon={<StorefrontIcon className="h-7 w-7" weight="regular" />}
        title="Todavía no tenés negocios"
        text="Creá tu primer negocio para empezar a recibir reservas. También podés ver tus turnos como cliente."
        action={
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={ROUTES.auth.onboarding}>
              Crear mi primer negocio
            </ButtonLink>
            <ButtonLink href={ROUTES.auth.misTurnos} variant="outline">
              Ver mis turnos
            </ButtonLink>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        section="Panel"
        title="Elegí un negocio"
        description="Seleccioná con cuál querés trabajar."
      />
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {workspaces.map((workspace) => (
          <li key={workspace.businessId}>
            <button
              type="button"
              onClick={() => setActiveWorkspace(workspace)}
              className="flex w-full items-center gap-3 rounded-2xl border border-hairline bg-paper p-4 text-left transition-colors hover:border-signal-blue/40 hover:bg-pebble"
            >
              <Avatar
                name={workspace.businessName}
                src={workspace.logoUrl}
                size="lg"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-semibold text-ink-navy">
                  {workspace.businessName}
                </span>
                <span className="block text-caption text-slate-gray">
                  {workspace.role === WorkspaceRole.OWNER ? "Dueño" : "Staff"}
                </span>
              </span>
            </button>
          </li>
        ))}
        <li>
          <ButtonLink href={ROUTES.auth.onboarding} variant="outline" fullWidth>
            Crear nuevo negocio
          </ButtonLink>
        </li>
      </ul>
    </div>
  );
}

export default function DashboardPage() {
  const { activeWorkspace, isLoading: workspaceLoading } = useBusiness();
  const data = useDashboardData(activeWorkspace);
  const mounted = useHydrated();

  if (!mounted || workspaceLoading) {
    return (
      <div className="mx-auto max-w-page">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-page">
      {!activeWorkspace ? (
        <NoWorkspace />
      ) : activeWorkspace.role === WorkspaceRole.OWNER ? (
        <OwnerDashboard data={data} workspace={activeWorkspace} />
      ) : (
        <StaffDashboard data={data} workspace={activeWorkspace} />
      )}
    </div>
  );
}
