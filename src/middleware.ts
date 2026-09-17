import { NextResponse } from "next/server";

export function middleware() {
  // La autenticación es stateless con access token en memoria + refresh token en una
  // cookie HttpOnly acotada a /api/auth. Por eso el middleware (que corre en el front)
  // no puede inspeccionar el estado de sesión; la protección de rutas se hace en
  // src/app/(auth)/layout.tsx (guard de cliente) y el control real lo ejerce la API.
  return NextResponse.next();
}

export const config = {
  // Matcher para rutas que podrían necesitar middleware en el futuro
  matcher: ["/app/:path*"],
};
