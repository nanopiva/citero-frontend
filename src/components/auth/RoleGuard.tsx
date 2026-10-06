"use client";

import { ProhibitIcon } from "@phosphor-icons/react";
import { useBusiness } from "@/context/BusinessContext";
import { WorkspaceRole, ROUTES } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { ButtonLink } from "@/components/ui/Button";

interface RoleGuardProps {
  allowedRoles: WorkspaceRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { activeWorkspace, isLoading } = useBusiness();

  const isAuthorized =
    activeWorkspace && allowedRoles.includes(activeWorkspace.role);

  if (isLoading) {
    return (
      <div className="flex h-[50dvh] w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pebble text-slate-gray">
          <ProhibitIcon className="h-6 w-6" weight="regular" />
        </span>
        <div>
          <p className="text-body font-semibold text-ink-navy">
            No tenés permiso para ver esta sección
          </p>
          <p className="mt-1 text-body-sm text-slate-gray">
            Pedile al dueño del negocio que te dé acceso.
          </p>
        </div>
        <ButtonLink href={ROUTES.auth.dashboard} variant="outline">
          Ir al panel
        </ButtonLink>
      </div>
    );
  }

  return <>{children}</>;
}
