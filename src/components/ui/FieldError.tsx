import type { ReactNode } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p
      id={id}
      className="flex items-start gap-1.5 text-caption text-danger"
    >
      <WarningCircleIcon className="mt-px h-3.5 w-3.5 shrink-0" weight="fill" />
      <span>{children}</span>
    </p>
  );
}
