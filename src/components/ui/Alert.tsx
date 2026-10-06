"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CheckCircleIcon, InfoIcon, WarningCircleIcon } from "@phosphor-icons/react";

export type AlertVariant = "error" | "success" | "info";

const variantStyles: Record<
  AlertVariant,
  { container: string; icon: typeof InfoIcon }
> = {
  error: {
    container: "border-danger-border bg-danger-soft text-danger",
    icon: WarningCircleIcon,
  },
  success: {
    container: "border-accent-border bg-accent-soft text-deep-cobalt",
    icon: CheckCircleIcon,
  },
  info: {
    container: "border-hairline bg-pebble text-deep-cobalt",
    icon: InfoIcon,
  },
};

export function Alert({
  variant = "info",
  title,
  children,
}: {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const { container, icon: Icon } = variantStyles[variant];

  return (
    <motion.div
      role={variant === "error" ? "alert" : "status"}
      initial={reduce ? false : { opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-body-sm ${container}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" weight="fill" />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </motion.div>
  );
}
