import { ROUTES } from "@/types";

export interface PageMeta {
  /** Título de la página, para el breadcrumb del topbar. */
  title: string;
}

interface RouteMeta {
  prefix: string;
  meta: PageMeta;
}

/**
 * Metadatos de las páginas del panel, usados por el topbar para mostrar
 * orientación (negocio / página) sin que cada página los repita.
 */
const APP_PAGES: RouteMeta[] = [
  { prefix: ROUTES.auth.dashboard, meta: { title: "Dashboard" } },
  { prefix: ROUTES.auth.agenda, meta: { title: "Agenda" } },
  { prefix: ROUTES.auth.servicios, meta: { title: "Servicios" } },
  { prefix: ROUTES.auth.staff, meta: { title: "Profesionales" } },
  { prefix: ROUTES.auth.configuracion, meta: { title: "Configuración" } },
  { prefix: ROUTES.auth.misTurnos, meta: { title: "Mis turnos" } },
  { prefix: ROUTES.auth.perfil, meta: { title: "Mi perfil" } },
];

export function pageMeta(pathname: string): PageMeta | null {
  const match = APP_PAGES.find(
    (page) => pathname === page.prefix || pathname.startsWith(`${page.prefix}/`),
  );
  return match?.meta ?? null;
}
