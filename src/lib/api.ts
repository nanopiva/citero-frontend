import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { UserResponseDto } from "@/types";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

// El access token vive solo en memoria (nunca en localStorage) para mitigar el robo
// por XSS. El refresh token viaja en una cookie HttpOnly que el JS no puede leer.
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

const SESSION_HINT_KEY = "citero_has_session";

export const markSessionActive = () => {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_HINT_KEY, "1");
  }
};

export const clearSessionHint = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_HINT_KEY);
  }
};

export const hasSessionHint = () =>
  typeof window !== "undefined" &&
  localStorage.getItem(SESSION_HINT_KEY) === "1";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  // Necesario para que la cookie del refresh token viaje al backend.
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (typeof window !== "undefined") {
      const activeBusinessId = localStorage.getItem(
        "citero_active_business_id",
      );
      if (activeBusinessId) {
        config.headers["X-Business-ID"] = activeBusinessId;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

interface RefreshedSession {
  token: string;
  user: UserResponseDto;
}

async function performRefresh(): Promise<RefreshedSession | null> {
  try {
    // Se usa axios "crudo" para no pasar por los interceptores (evita recursión).
    const response = await axios.post(
      `${baseURL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const token: string | undefined = response.data?.token;
    const user: UserResponseDto | undefined = response.data?.user;

    if (!token || !user) {
      setAccessToken(null);
      return null;
    }

    setAccessToken(token);
    markSessionActive();
    return { token, user };
  } catch (error) {
    setAccessToken(null);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearSessionHint();
    }
    return null;
  }
}

// Single-flight: si varias peticiones reciben 401 a la vez, se hace un único refresh.
let refreshPromise: Promise<RefreshedSession | null> | null = null;

export function refreshSession(): Promise<RefreshedSession | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh")
  );
}

function handleSessionExpired() {
  setAccessToken(null);
  clearSessionHint();
  if (typeof window !== "undefined") {
    localStorage.removeItem("citero_active_business_id");
    // Navegación cliente (no `redirect` de next/navigation, que es solo para server).
    // El full reload además resetea el estado de React (AuthContext/BusinessContext).
    if (window.location.pathname !== "/login") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isAuthEndpoint(original.url)
    ) {
      original._retry = true;
      const session = await refreshSession();

      if (session) {
        original.headers.Authorization = `Bearer ${session.token}`;
        return api(original);
      }

      handleSessionExpired();
    }

    return Promise.reject(error);
  },
);

export default api;
