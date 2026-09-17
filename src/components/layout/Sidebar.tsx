"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CalendarDots,
  GearSix,
  Scissors,
  SquaresFour,
  Ticket,
  UserCircle,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { MOBILE_MENU_EVENT } from "@/lib/mobileMenu";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { WorkspaceRole, ROUTES } from "@/types";

type IconComponent = typeof SquaresFour;

interface NavItem {
  label: string;
  href: string;
  icon: IconComponent;
}

interface ContextualNavItem extends NavItem {
  roles: WorkspaceRole[];
}

const contextualItems: ContextualNavItem[] = [
  {
    label: "Dashboard",
    href: ROUTES.auth.dashboard,
    roles: [WorkspaceRole.OWNER, WorkspaceRole.STAFF],
    icon: SquaresFour,
  },
  {
    label: "Agenda",
    href: ROUTES.auth.agenda,
    roles: [WorkspaceRole.OWNER, WorkspaceRole.STAFF],
    icon: CalendarDots,
  },
  {
    label: "Servicios",
    href: ROUTES.auth.servicios,
    roles: [WorkspaceRole.OWNER],
    icon: Scissors,
  },
  {
    label: "Equipo",
    href: ROUTES.auth.staff,
    roles: [WorkspaceRole.OWNER],
    icon: UsersThree,
  },
  {
    label: "Configuración",
    href: ROUTES.auth.configuracion,
    roles: [WorkspaceRole.OWNER],
    icon: GearSix,
  },
];

const personalItems: NavItem[] = [
  { label: "Mis Turnos", href: ROUTES.auth.misTurnos, icon: Ticket },
  { label: "Mi Perfil", href: ROUTES.auth.perfil, icon: UserCircle },
];

function SidebarItem({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-body-sm font-medium transition-colors ${
        isActive
          ? "bg-[#e6f0ff] text-signal-blue"
          : "text-slate-gray hover:bg-pebble hover:text-ink-navy"
      }`}
    >
      <Icon className="h-5 w-5" weight={isActive ? "fill" : "regular"} />
      {item.label}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const { activeWorkspace } = useBusiness();

  if (!user) return null;

  const visibleContextualItems = activeWorkspace
    ? contextualItems.filter((item) => item.roles.includes(activeWorkspace.role))
    : [];

  return (
    <nav className="flex h-full flex-col gap-8 overflow-y-auto px-3 py-6">
      {activeWorkspace && (
        <div>
          <p className="px-3 pb-2 text-caption font-semibold uppercase tracking-wider text-slate-gray">
            Administración
          </p>
          <div className="space-y-1">
            {visibleContextualItems.map((item) => (
              <SidebarItem key={item.href} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="px-3 pb-2 text-caption font-semibold uppercase tracking-wider text-slate-gray">
          Mi cuenta
        </p>
        <div className="space-y-1">
          {personalItems.map((item) => (
            <SidebarItem key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </nav>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(MOBILE_MENU_EVENT, handler);
    return () => window.removeEventListener(MOBILE_MENU_EVENT, handler);
  }, []);

  return (
    <>
      <aside className="fixed left-0 top-16 z-40 hidden h-[calc(100dvh-4rem)] w-64 border-r border-hairline bg-paper lg:block">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
          >
            <div
              aria-hidden
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-ink-navy/40 backdrop-blur-sm"
            />
            <motion.aside
              role="dialog"
              aria-label="Menú de navegación"
              className="absolute left-0 top-0 flex h-full w-72 flex-col bg-paper shadow-sm-2"
              initial={reduce ? false : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={reduce ? undefined : { x: "-100%" }}
              transition={{ duration: reduce ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                <span className="text-body font-semibold text-ink-navy">
                  Menú
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar menú"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-gray transition-colors hover:bg-pebble hover:text-ink-navy"
                >
                  <X className="h-5 w-5" weight="bold" />
                </button>
              </div>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
