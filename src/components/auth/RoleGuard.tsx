"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBusiness } from "@/context/BusinessContext";
import { WorkspaceRole, ROUTES } from "@/types";
import { Spinner } from "@/components/ui/Spinner";

interface RoleGuardProps {
  allowedRoles: WorkspaceRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const { activeWorkspace, isLoading } = useBusiness();

  // Estado derivado: se calcula automáticamente en cada render
  const isAuthorized =
    activeWorkspace && allowedRoles.includes(activeWorkspace.role);

  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      // Redirigir al dashboard si ya cargó y no tiene permisos
      router.replace(ROUTES.auth.dashboard);
    }
  }, [isLoading, isAuthorized, router]);

  // Mostrar un esqueleto mientras carga la data o si la validación falló (esperando el redirect)
  if (isLoading || !isAuthorized) {
    return (
      <div className="flex h-[50dvh] w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
