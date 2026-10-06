"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "@/lib/api";
import { WorkspaceResponseDto, WorkspaceRole } from "@/types";
import { useAuth } from "./AuthContext";

/**
 * Un mismo negocio puede llegar como OWNER y STAFF. Nos quedamos con una sola
 * entrada por businessId, priorizando el rol OWNER.
 */
function dedupeWorkspaces(
  workspaces: WorkspaceResponseDto[],
): WorkspaceResponseDto[] {
  const byBusinessId = new Map<number, WorkspaceResponseDto>();
  for (const workspace of workspaces) {
    const existing = byBusinessId.get(workspace.businessId);
    if (
      !existing ||
      (existing.role !== WorkspaceRole.OWNER &&
        workspace.role === WorkspaceRole.OWNER)
    ) {
      byBusinessId.set(workspace.businessId, workspace);
    }
  }
  return Array.from(byBusinessId.values());
}

interface BusinessContextType {
  workspaces: WorkspaceResponseDto[];
  activeWorkspace: WorkspaceResponseDto | null;
  setActiveWorkspace: (workspace: WorkspaceResponseDto) => void;
  refreshWorkspaces: () => Promise<void>;
  isLoading: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(
  undefined,
);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceResponseDto[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] =
    useState<WorkspaceResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setActiveWorkspace = useCallback((workspace: WorkspaceResponseDto) => {
    setActiveWorkspaceState(workspace);
    // Guarda el ID para que Axios lo lea en api.ts
    localStorage.setItem(
      "citero_active_business_id",
      workspace.businessId.toString(),
    );
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
      localStorage.removeItem("citero_active_business_id");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // El parámetro ?t= evita que el navegador use la caché de una petición anterior
      const response = await api.get(`/users/me/workspaces?t=${Date.now()}`);
      const data = dedupeWorkspaces(response.data as WorkspaceResponseDto[]);
      setWorkspaces(data);

      const storedId = localStorage.getItem("citero_active_business_id");

      if (data.length > 0) {
        const found = storedId
          ? data.find((w) => w.businessId.toString() === storedId)
          : null;
        setActiveWorkspace(found || data[0]);
      } else {
        setActiveWorkspaceState(null);
        localStorage.removeItem("citero_active_business_id");
      }
    } catch (error) {
      console.error("Error al cargar los espacios de trabajo", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, setActiveWorkspace]);

  useEffect(() => {
    // Esperamos a que la sesión esté resuelta para evitar un estado transitorio
    // (user null -> user) que disparaba redirects falsos en RoleGuard.
    if (!initialized) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshWorkspaces();
  }, [initialized, refreshWorkspaces]);

  return (
    <BusinessContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        setActiveWorkspace,
        refreshWorkspaces,
        isLoading,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error("useBusiness debe ser usado dentro de un BusinessProvider");
  }
  return context;
}
