"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import api, {
  clearSessionHint,
  hasSessionHint,
  markSessionActive,
  refreshSession,
  setAccessToken,
} from "@/lib/api";
import type { UserResponseDto } from "@/types";

interface AuthContextType {
  user: UserResponseDto | null;
  /** true cuando ya se intentó restaurar la sesión (éxito o no). */
  initialized: boolean;
  login: (email: string, password: string) => Promise<UserResponseDto>;
  register: (
    email: string,
    password: string,
    phone?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserResponseDto | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Al cargar la app, se intenta restaurar la sesión usando la cookie HttpOnly.
  useEffect(() => {
    let active = true;

    (async () => {
      if (!hasSessionHint()) {
        setInitialized(true);
        return;
      }
      const session = await refreshSession();
      if (!active) return;
      if (session) {
        setUser(session.user);
      }
      setInitialized(true);
    })();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<UserResponseDto> => {
      const response = await api.post("/auth/login", { email, password });
      const { token, user: userData } = response.data;

      setAccessToken(token);
      markSessionActive();
      setUser(userData);

      return userData as UserResponseDto;
    },
    [],
  );

  const register = useCallback(
    async (email: string, password: string, phone?: string) => {
      const response = await api.post("/auth/register", {
        email,
        password,
        phone,
      });
      const { token, user: userData } = response.data;

      setAccessToken(token);
      markSessionActive();
      setUser(userData);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignoramos errores de red al cerrar sesión: igual limpiamos el estado local.
    }
    setAccessToken(null);
    clearSessionHint();
    setUser(null);
    localStorage.removeItem("citero_active_business_id");
    router.push("/login");
  }, [router]);

  const deleteAccount = useCallback(async () => {
    await api.delete("/users/me");
    setAccessToken(null);
    clearSessionHint();
    setUser(null);
    localStorage.removeItem("citero_active_business_id");
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, initialized, login, register, logout, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}
