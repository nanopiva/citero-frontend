"use client";

import { useState, type ComponentProps } from "react";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { Input } from "./Input";

type PasswordInputProps = Omit<
  ComponentProps<typeof Input>,
  "type" | "rightElement"
>;

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      rightElement={
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="flex h-11 w-11 items-center justify-center rounded-md text-slate-gray transition-colors hover:bg-pebble hover:text-ink-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue/30"
        >
          {visible ? (
            <EyeSlashIcon className="h-5 w-5" weight="regular" />
          ) : (
            <EyeIcon className="h-5 w-5" weight="regular" />
          )}
        </button>
      }
    />
  );
}
