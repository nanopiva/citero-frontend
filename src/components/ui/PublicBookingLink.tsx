"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowSquareOut, Check, LinkSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { SITE_URL } from "@/lib/site";

export function PublicBookingLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const path = `/negocio/${slug}`;
  const url = `${SITE_URL}${path}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.open(path, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="rounded-2xl border border-[#c7e0ff] bg-[#e6f0ff] p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-signal-blue">
          <LinkSimple className="h-5 w-5" weight="bold" />
        </span>
        <div>
          <p className="text-body font-semibold text-ink-navy">
            Link de reservas
          </p>
          <p className="mt-0.5 text-body-sm text-deep-cobalt/90">
            Compartí este enlace para que tus clientes reserven turnos.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="min-w-0 flex-1 truncate rounded-lg border border-hairline bg-paper px-3 py-2 text-body-sm text-ink-navy">
          {url}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4" weight="bold" />
            ) : (
              <LinkSimple className="h-4 w-4" weight="bold" />
            )}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <a
            href={path}
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir página de reservas"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-hairline bg-paper text-ink-navy transition-colors hover:bg-pebble"
          >
            <ArrowSquareOut className="h-4 w-4" weight="bold" />
          </a>
        </div>
      </div>
    </div>
  );
}
