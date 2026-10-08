"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { useHydrated } from "@/hooks/useHydrated";
import { openMobileMenu } from "@/lib/mobileMenu";
import { pageMeta } from "@/lib/navigation";
import { ROUTES, getDashboardRoute } from "@/types";
import { ListIcon, SquaresFourIcon } from "@phosphor-icons/react";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { UserMenu } from "./UserMenu";

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { activeWorkspace } = useBusiness();
  const mounted = useHydrated();

  const isAppRoute = Object.values(ROUTES.auth).some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const meta = pageMeta(pathname);
  const logoHref = mounted && user ? getDashboardRoute() : ROUTES.public.home;

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-hairline bg-paper">
      <nav className="mx-auto flex h-full max-w-page items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {mounted && user && isAppRoute && (
            <button
              type="button"
              onClick={openMobileMenu}
              aria-label="Abrir menú"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-navy transition-colors hover:bg-pebble focus-visible:ring-2 focus-visible:ring-signal-blue/30 lg:hidden"
            >
              <ListIcon className="h-5 w-5" weight="bold" />
            </button>
          )}
          <Logo href={logoHref} />

          {mounted && user && isAppRoute && meta && (
            <div className="hidden min-w-0 items-center gap-2 border-l border-hairline pl-3 md:flex">
              {activeWorkspace && (
                <>
                  <span className="max-w-[160px] truncate text-body-sm text-slate-gray">
                    {activeWorkspace.businessName}
                  </span>
                  <span aria-hidden className="text-mist-gray">
                    /
                  </span>
                </>
              )}
              <span className="truncate text-body-sm font-semibold text-ink-navy">
                {meta.title}
              </span>
            </div>
          )}
        </div>

        {!mounted ? (
          <div className="flex items-center gap-3">
            <div className="h-9 w-24 animate-pulse rounded-lg bg-pebble" />
            <div className="h-9 w-24 animate-pulse rounded-lg bg-pebble" />
          </div>
        ) : user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {!isAppRoute && (
              <ButtonLink
                href={getDashboardRoute()}
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <SquaresFourIcon className="h-4 w-4" weight="bold" />
                Ir al panel
              </ButtonLink>
            )}
            <UserMenu />
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/#como-funciona"
                className="text-body-sm font-medium text-slate-gray transition-colors hover:text-ink-navy"
              >
                Cómo funciona
              </Link>
              <Link
                href="/#beneficios"
                className="text-body-sm font-medium text-slate-gray transition-colors hover:text-ink-navy"
              >
                Beneficios
              </Link>
            </div>
            <ButtonLink
              href={ROUTES.public.login}
              variant="outline"
              size="sm"
              className="hidden min-[400px]:inline-flex"
            >
              Iniciar sesión
            </ButtonLink>
            <ButtonLink href={ROUTES.public.register} size="sm">
              Crear cuenta
            </ButtonLink>
          </div>
        )}
      </nav>
    </header>
  );
}
