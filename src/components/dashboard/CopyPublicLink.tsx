"use client";

import { useEffect, useRef, useState } from "react";
import { Check, LinkSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

export function CopyPublicLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const handleCopy = async () => {
    try {
      const url = `${window.location.origin}/negocio/${slug}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.open(`/negocio/${slug}`, "_blank");
    }
  };

  return (
    <Button variant="outline" onClick={handleCopy}>
      {copied ? (
        <Check className="h-4 w-4" weight="bold" />
      ) : (
        <LinkSimple className="h-4 w-4" weight="bold" />
      )}
      {copied ? "Link copiado" : "Copiar link público"}
    </Button>
  );
}
