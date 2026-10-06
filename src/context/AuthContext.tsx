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

/** Resultado del login: completo, o pendiente del segundo factor (MFA). */
export interface LoginOutcome {
  mfaRequired: boolean;
  mfaToken?: string;
  user?: UserResponseDto;
}

interface AuthContextType {
  user: UserResponseDto | null;
  /** true cuando ya se intentó restaurar la sesión (éxito o no). */
  initialized: boolean;
  login: (email: string, password: string) => Promise<LoginOutcome>;
  loginMfa: (mfaToken: string, code: string) => Promise<UserResponseDto>;
  requestRegisterOtp: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    phone: string | undefined,
    name: string | undefined,
    otpCode: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
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
    async (email: string, password: string): Promise<LoginOutcome> => {
      const response = await api.post("/auth/login", { email, password });
      const { token, user: userData, mfaRequired, mfaToken } = response.data;

      if (mfaRequired) {
        // Falta el segundo factor: no hay sesión todavía.
        return { mfaRequired: true, mfaToken };
      }

      setAccessToken(token);
      markSessionActive();
      setUser(userData);

      return { mfaRequired: false, user: userData as UserResponseDto };
    },
    [],
  );

  const loginMfa = useCallback(
    async (mfaToken: string, code: string): Promise<UserResponseDto> => {
      const response = await api.post("/auth/login/mfa", { mfaToken, code });
      const { token, user: userData } = response.data;

      setAccessToken(token);
      markSessionActive();
      setUser(userData);

      return userData as UserResponseDto;
    },
    [],
  );

  const requestRegisterOtp = useCallback(
    async (email: string, password: string) => {
      await api.post("/auth/register/request-otp", { email, password });
    },
    [],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      phone: string | undefined,
      name: string | undefined,
      otpCode: string,
    ) => {
      const response = await api.post("/auth/register", {
        email,
        password,
        phone,
        name,
        otpCode,
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

  const deleteAccount = useCallback(async (password: string) => {
    await api.delete("/users/me", { data: { password } });
    setAccessToken(null);
    clearSessionHint();
    setUser(null);
    localStorage.removeItem("citero_active_business_id");
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        initialized,
        login,
        loginMfa,
        requestRegisterOtp,
        register,
        logout,
        deleteAccount,
      }}
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
