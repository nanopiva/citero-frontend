"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CaretDownIcon, SignOutIcon, TicketIcon, UserCircleIcon } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/types";
import { Avatar } from "@/components/ui/Avatar";

/** Menú de usuario del topbar: avatar + perfil, mis turnos y cerrar sesión. */
export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de usuario"
        className="flex items-center gap-2 rounded-full border border-hairline bg-paper p-1 pr-2 text-body-sm font-medium text-ink-navy transition-colors hover:bg-pebble focus-visible:ring-2 focus-visible:ring-signal-blue/30"
      >
        <Avatar name={user.email} size="sm" tone="primary" />
        <CaretDownIcon
          className={`h-3.5 w-3.5 text-slate-gray transition-transform ${
            open ? "rotate-180" : ""
          }`}
          weight="bold"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-2xl border border-hairline bg-paper p-2 shadow-sm-2"
        >
          <div className="border-b border-hairline px-3 pb-2 pt-1">
            <p className="truncate text-body-sm font-semibold text-ink-navy">
              {user.email}
            </p>
          </div>
          <Link
            role="menuitem"
            href={ROUTES.auth.perfil}
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-body-sm text-ink-navy transition-colors hover:bg-pebble"
          >
            <UserCircleIcon className="h-4 w-4" weight="regular" />
            Mi perfil
          </Link>
          <Link
            role="menuitem"
            href={ROUTES.auth.misTurnos}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-body-sm text-ink-navy transition-colors hover:bg-pebble"
          >
            <TicketIcon className="h-4 w-4" weight="regular" />
            Mis turnos
          </Link>
          <div className="my-2 border-t border-hairline" />
          <button
            role="menuitem"
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-body-sm text-danger transition-colors hover:bg-danger-soft"
          >
            <SignOutIcon className="h-4 w-4" weight="regular" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
