"use client";

import { Storefront } from "@phosphor-icons/react";
import { useBusiness } from "@/context/BusinessContext";
import { WorkspaceRole, ROUTES } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useHydrated } from "@/hooks/useHydrated";
import { ButtonLink } from "@/components/ui/Button";
import { DashboardSkeleton } from "@/components/dashboard/DashboardStates";
import { OwnerDashboard } from "@/components/dashboard/OwnerDashboard";
import { StaffDashboard } from "@/components/dashboard/StaffDashboard";

function NoWorkspace() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pebble text-signal-blue">
        <Storefront className="h-8 w-8" weight="regular" />
      </span>
      <h2 className="mt-6 text-subheading font-bold text-ink-navy">
        No seleccionaste ningún negocio
      </h2>
      <p className="mt-3 max-w-md text-body text-slate-gray">
        Elegí un negocio desde el menú superior para ver su panel, o revisá tus
        turnos personales.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href={ROUTES.auth.misTurnos} variant="outline">
          Ir a Mis Turnos
        </ButtonLink>
        <ButtonLink href={ROUTES.auth.onboarding}>Crear un negocio</ButtonLink>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { activeWorkspace, isLoading: workspaceLoading } = useBusiness();
  const data = useDashboardData(activeWorkspace);
  const mounted = useHydrated();

  if (!mounted || workspaceLoading) {
    return (
      <div className="min-h-dvh bg-cloud">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-8">
            <div className="mx-auto max-w-page">
              <DashboardSkeleton />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-cloud">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-page">
            {!activeWorkspace ? (
              <NoWorkspace />
            ) : activeWorkspace.role === WorkspaceRole.OWNER ? (
              <OwnerDashboard data={data} workspace={activeWorkspace} />
            ) : (
              <StaffDashboard data={data} workspace={activeWorkspace} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
