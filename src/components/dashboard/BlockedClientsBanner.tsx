import Link from "next/link";
import { ArrowRightIcon, ProhibitIcon } from "@phosphor-icons/react/dist/ssr";
import { ROUTES } from "@/types";

export function BlockedClientsBanner({ count }: { count: number }) {
  return (
    <Link
      href={`${ROUTES.auth.configuracion}?tab=clientes`}
      className="flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-paper px-5 py-4 shadow-sm transition-colors hover:border-signal-blue/40 hover:bg-cloud"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pebble text-ink-navy">
          <ProhibitIcon className="h-5 w-5" weight="regular" />
        </span>
        <div>
          <p className="text-body-sm font-medium text-ink-navy">
            Clientes bloqueados
          </p>
          <p className="mt-0.5 text-caption text-slate-gray">
            {count === 0
              ? "No tenés clientes bloqueados."
              : `${count} ${count === 1 ? "cliente" : "clientes"} no pueden reservar.`}
          </p>
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 text-body-sm font-medium text-signal-blue">
        Gestionar
        <ArrowRightIcon className="h-4 w-4" weight="bold" />
      </span>
    </Link>
  );
}
