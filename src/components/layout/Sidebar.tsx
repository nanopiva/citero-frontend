"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CalendarDotsIcon,
  CaretUpDownIcon,
  GearSixIcon,
  PlusIcon,
  ScissorsIcon,
  SquaresFourIcon,
  TicketIcon,
  UserCircleIcon,
  UsersThreeIcon,
  XIcon,
} from "@phosphor-icons/react";
import { MOBILE_MENU_EVENT } from "@/lib/mobileMenu";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { WorkspaceRole, ROUTES, type WorkspaceResponseDto } from "@/types";

type IconComponent = typeof SquaresFourIcon;

interface ContextualNavItem {
  label: string;
  href: string;
  icon: IconComponent;
  roles: WorkspaceRole[];
}

interface NavItem {
  label: string;
  href: string;
  icon: IconComponent;
}

const OPERATION_ITEMS: ContextualNavItem[] = [
  {
    label: "Dashboard",
    href: ROUTES.auth.dashboard,
    roles: [WorkspaceRole.OWNER, WorkspaceRole.STAFF],
    icon: SquaresFourIcon,
  },
  {
    label: "Agenda",
    href: ROUTES.auth.agenda,
    roles: [WorkspaceRole.OWNER, WorkspaceRole.STAFF],
    icon: CalendarDotsIcon,
  },
];

const BUSINESS_ITEMS: ContextualNavItem[] = [
  {
    label: "Servicios",
    href: ROUTES.auth.servicios,
    roles: [WorkspaceRole.OWNER],
    icon: ScissorsIcon,
  },
  {
    label: "Profesionales",
    href: ROUTES.auth.staff,
    roles: [WorkspaceRole.OWNER],
    icon: UsersThreeIcon,
  },
  {
    label: "Configuración",
    href: ROUTES.auth.configuracion,
    roles: [WorkspaceRole.OWNER],
    icon: GearSixIcon,
  },
];

const PERSONAL_ITEMS: NavItem[] = [
  { label: "Mis turnos", href: ROUTES.auth.misTurnos, icon: TicketIcon },
  { label: "Mi perfil", href: ROUTES.auth.perfil, icon: UserCircleIcon },
];

function roleLabel(role: WorkspaceRole): string {
  return role === WorkspaceRole.OWNER ? "Dueño" : "Staff";
}

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
      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-body-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-signal-blue/30 ${
        isActive
          ? "bg-accent-soft text-signal-blue"
          : "text-slate-gray hover:bg-pebble hover:text-ink-navy"
      }`}
    >
      <Icon className="h-5 w-5" weight={isActive ? "fill" : "regular"} />
      {item.label}
    </Link>
  );
}

function WorkspaceSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useBusiness();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!activeWorkspace) return null;

  const selectWorkspace = (workspace: WorkspaceResponseDto) => {
    setActiveWorkspace(workspace);
    setOpen(false);
    onNavigate?.();
    router.push(ROUTES.auth.dashboard);
  };

  return (
    <div ref={ref} className="px-3 pt-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl border border-hairline bg-paper p-2.5 text-left transition-colors hover:bg-pebble focus-visible:ring-2 focus-visible:ring-signal-blue/30"
      >
        {activeWorkspace.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeWorkspace.logoUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-signal-blue text-body-sm font-semibold text-paper">
            {activeWorkspace.businessName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body-sm font-semibold text-ink-navy">
            {activeWorkspace.businessName}
          </span>
          <span className="block text-caption text-slate-gray">
            {roleLabel(activeWorkspace.role)}
          </span>
        </span>
        <CaretUpDownIcon className="h-4 w-4 shrink-0 text-slate-gray" weight="bold" />
      </button>

      {open && (
        <div
          role="listbox"
          className="mt-2 space-y-1 rounded-xl border border-hairline bg-paper p-1.5 shadow-sm"
        >
          {workspaces.map((workspace) => (
            <button
              key={workspace.businessId}
              type="button"
              role="option"
              aria-selected={workspace.businessId === activeWorkspace.businessId}
              onClick={() => selectWorkspace(workspace)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-body-sm transition-colors hover:bg-pebble ${
                workspace.businessId === activeWorkspace.businessId
                  ? "text-signal-blue"
                  : "text-ink-navy"
              }`}
            >
              <span className="truncate">{workspace.businessName}</span>
              <span className="shrink-0 text-caption text-slate-gray">
                {roleLabel(workspace.role)}
              </span>
            </button>
          ))}
          <Link
            href={ROUTES.auth.onboarding}
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-body-sm font-medium text-ink-navy transition-colors hover:bg-pebble"
          >
            <PlusIcon className="h-4 w-4 text-signal-blue" weight="bold" />
            Crear nuevo negocio
          </Link>
        </div>
      )}
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const { activeWorkspace } = useBusiness();

  if (!user) return null;

  const operationItems = activeWorkspace
    ? OPERATION_ITEMS.filter((item) => item.roles.includes(activeWorkspace.role))
    : [];
  const businessItems = activeWorkspace
    ? BUSINESS_ITEMS.filter((item) => item.roles.includes(activeWorkspace.role))
    : [];

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <WorkspaceSwitcher onNavigate={onNavigate} />

      <nav className="flex flex-1 flex-col gap-6 px-3 py-5">
        {operationItems.length > 0 && (
          <div>
            <p className="px-3 pb-2 text-caption font-semibold uppercase tracking-wider text-slate-gray">
              Operación
            </p>
            <div className="space-y-1">
              {operationItems.map((item) => (
                <SidebarItem key={item.href} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        )}

        {businessItems.length > 0 && (
          <div>
            <p className="px-3 pb-2 text-caption font-semibold uppercase tracking-wider text-slate-gray">
              Negocio
            </p>
            <div className="space-y-1">
              {businessItems.map((item) => (
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
            {PERSONAL_ITEMS.map((item) => (
              <SidebarItem key={item.href} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const drawerRef = useRef<HTMLElement>(null);

  useFocusTrap(drawerRef, open);

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
              ref={drawerRef}
              role="dialog"
              aria-label="Menú de navegación"
              tabIndex={-1}
              className="absolute left-0 top-0 flex h-full w-[85vw] max-w-xs flex-col bg-paper shadow-sm-2 outline-none"
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
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-gray transition-colors hover:bg-pebble hover:text-ink-navy"
                >
                  <XIcon className="h-5 w-5" weight="bold" />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <SidebarContent onNavigate={() => setOpen(false)} />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
