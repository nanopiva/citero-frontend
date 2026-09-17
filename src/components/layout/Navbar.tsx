"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { useHydrated } from "@/hooks/useHydrated";
import { openMobileMenu } from "@/lib/mobileMenu";
import { ROUTES, getDashboardRoute } from "@/types";
import { CaretDown, List, Plus, SignOut } from "@phosphor-icons/react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/ui/Logo";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useBusiness();
  const mounted = useHydrated();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logoHref = mounted && user ? getDashboardRoute() : ROUTES.public.home;
  const isAppRoute = Object.values(ROUTES.auth).some((route) =>
    pathname.startsWith(route),
  );

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-hairline bg-paper">
      <nav className="mx-auto flex h-full max-w-page items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          {mounted && user && isAppRoute && (
            <button
              type="button"
              onClick={openMobileMenu}
              aria-label="Abrir menú"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-navy transition-colors hover:bg-pebble lg:hidden"
            >
              <List className="h-5 w-5" weight="bold" />
            </button>
          )}
          <Logo href={logoHref} />

          {mounted && user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg border border-hairline bg-paper px-3 py-2 text-body-sm font-medium text-ink-navy transition-colors hover:bg-pebble"
              >
                {activeWorkspace ? (
                  <>
                    <span className="max-w-[90px] truncate sm:max-w-[140px]">
                      {activeWorkspace.businessName}
                    </span>
                    <Badge
                      variant="neutral"
                      className="hidden sm:inline-flex"
                    >
                      {activeWorkspace.role === "OWNER" ? "Dueño" : "Staff"}
                    </Badge>
                  </>
                ) : (
                  <span className="text-slate-gray">Seleccionar negocio</span>
                )}
                <CaretDown
                  className={`h-4 w-4 text-slate-gray transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                  weight="bold"
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-[calc(100vw-4rem)] max-w-[280px] rounded-2xl border border-hairline bg-paper p-2 shadow-sm-2">
                  <p className="px-3 py-2 text-caption font-semibold uppercase tracking-wider text-slate-gray">
                    Mis negocios
                  </p>
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.businessId}
                      onClick={() => {
                        setActiveWorkspace(workspace);
                        setIsDropdownOpen(false);
                        router.push(ROUTES.auth.dashboard);
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-body-sm transition-colors hover:bg-pebble ${
                        activeWorkspace?.businessId === workspace.businessId
                          ? "bg-pebble text-signal-blue"
                          : "text-ink-navy"
                      }`}
                    >
                      <span className="truncate">{workspace.businessName}</span>
                      <Badge variant="neutral">
                        {workspace.role === "OWNER" ? "Dueño" : "Staff"}
                      </Badge>
                    </button>
                  ))}
                  <div className="my-2 border-t border-hairline" />
                  <Link
                    href={ROUTES.auth.onboarding}
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-body-sm font-medium text-ink-navy transition-colors hover:bg-pebble"
                  >
                    <Plus className="h-4 w-4 text-signal-blue" weight="bold" />
                    Crear nuevo negocio
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {mounted ? (
          <div className="flex items-center gap-3">
            {!user ? (
              <>
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
                <ButtonLink href={ROUTES.public.login} variant="outline" size="sm">
                  Ingresar
                </ButtonLink>
                <ButtonLink href={ROUTES.public.register} size="sm">
                  Crear cuenta
                </ButtonLink>
              </>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={logout}
                className="px-2.5 sm:px-4"
              >
                <SignOut className="h-4 w-4 sm:hidden" weight="bold" />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-9 w-24 animate-pulse rounded-lg bg-pebble" />
            <div className="h-9 w-28 animate-pulse rounded-lg bg-pebble" />
          </div>
        )}
      </nav>
    </header>
  );
}
